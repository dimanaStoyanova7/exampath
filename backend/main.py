import tempfile
import os
import json
import uuid
import asyncio
import traceback
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Annotated
from dotenv import load_dotenv
from extractor import extract_text_from_pdf
from ai import extract_topics, generate_quiz, generate_topic_judgments

load_dotenv()

SESSION_TTL = timedelta(minutes=15)
sessions: dict = {}


async def _cleanup_sessions():
    while True:
        await asyncio.sleep(300)
        cutoff = datetime.utcnow() - SESSION_TTL
        expired = [sid for sid, s in list(sessions.items()) if s["last_accessed"] < cutoff]
        for sid in expired:
            sessions.pop(sid, None)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_cleanup_sessions())
    yield
    task.cancel()


app = FastAPI(lifespan=lifespan)


def _get_session(session_id: str) -> dict | None:
    """Return the session if it exists and hasn't expired; update last_accessed."""
    s = sessions.get(session_id)
    if not s:
        return None
    if datetime.utcnow() - s["last_accessed"] > SESSION_TTL:
        sessions.pop(session_id, None)
        return None
    s["last_accessed"] = datetime.utcnow()
    return s

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CHAR_BUDGET = 80000

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract-topics")
async def extract_topics_route(files: Annotated[list[UploadFile], File(...)]):
    if len(files) > 15:
        raise HTTPException(status_code=400, detail="Maximum 15 PDFs allowed")

    included_files = []   # filenames that made it into the budget
    excluded_files = []   # filenames that didn't fit
    skipped_files = []    # filenames that failed extraction
    collected_texts = []
    chars_used = 0

    for file in files:
        if not file.filename.endswith(".pdf"):
            skipped_files.append({"filename": file.filename, "reason": "not a PDF"})
            continue

        contents = await file.read()
        if len(contents) == 0:
            skipped_files.append({"filename": file.filename, "reason": "empty file"})
            continue

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            extraction = extract_text_from_pdf(tmp_path)
        except Exception as e:
            skipped_files.append({"filename": file.filename, "reason": f"extraction error: {str(e)}"})
            continue
        finally:
            os.unlink(tmp_path)

        if extraction["char_count"] == 0:
            skipped_files.append({"filename": file.filename, "reason": "no extractable text — may be scanned"})
            continue

        file_text = extraction["full_text"]
        file_chars = len(file_text)

        if chars_used + file_chars > CHAR_BUDGET:
            # Check if we can fit a trimmed version
            remaining = CHAR_BUDGET - chars_used
            if remaining < 500:
                # Not worth including a tiny sliver — mark as excluded
                excluded_files.append({"filename": file.filename, "reason": "budget full"})
                continue
            else:
                # Fit as much of this file as the budget allows
                file_text = file_text[:remaining]
                collected_texts.append(file_text)
                chars_used += len(file_text)
                included_files.append({"filename": file.filename, "chars": len(file_text), "trimmed": True})
                # Budget is now full — exclude everything remaining
                remaining_files = files[files.index(file) + 1:]
                for remaining_file in remaining_files:
                    excluded_files.append({"filename": remaining_file.filename, "reason": "budget full"})
                break
        else:
            collected_texts.append(file_text)
            chars_used += file_chars
            included_files.append({"filename": file.filename, "chars": file_chars, "trimmed": False})

    if not collected_texts:
        raise HTTPException(status_code=422, detail="Could not extract text from any of the uploaded files")

    combined_text = "\n\n---\n\n".join(collected_texts)

    try:
        topics = extract_topics(combined_text, num_pdfs=len(included_files))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Claude returned invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Topic extraction failed: {type(e).__name__}: {str(e)}")

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "session_id": session_id,
        "topics": topics,
        "full_text": combined_text,
        "quiz": None,
        "results": None,
        "last_accessed": datetime.utcnow(),
    }

    return {
        "session_id": session_id,
        "topic_count": len(topics),
        "topics": topics,
        "budget": {
            "chars_used": chars_used,
            "chars_total": CHAR_BUDGET,
            "included_files": included_files,
            "excluded_files": excluded_files,
            "skipped_files": skipped_files
        }
    }

class SessionRequest(BaseModel):
    session_id: str

@app.post("/generate-quiz")
async def generate_quiz_route(body: SessionRequest):
    session = _get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    if session["quiz"] is not None:
        # Return cached — strip correct_answer before sending
        safe_questions = [
            {k: v for k, v in q.items() if k != "correct_answer"}
            for q in session["quiz"]
        ]
        return {"session_id": body.session_id, "questions": safe_questions}

    try:
        questions = generate_quiz(session["topics"], session["full_text"])
    except json.JSONDecodeError as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Claude returned invalid JSON: {str(e)}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {type(e).__name__}: {str(e)}")

    session["quiz"] = questions  # stored WITH correct_answer

    # Return WITHOUT correct_answer
    safe_questions = [
        {k: v for k, v in q.items() if k != "correct_answer"}
        for q in questions
    ]

    return {
        "session_id": body.session_id,
        "question_count": len(safe_questions),
        "questions": safe_questions
    }



class AnswerItem(BaseModel):
    question_id: int
    selected: str  # "a", "b", "c", or "d"

class SubmitAnswersRequest(BaseModel):
    session_id: str
    answers: list[AnswerItem]

@app.post("/submit-answers")
async def submit_answers_route(body: SubmitAnswersRequest):
    session = _get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    if session["quiz"] is None:
        raise HTTPException(status_code=400, detail="Quiz not generated yet — call /generate-quiz first")

    if session["results"] is not None:
        return session["results"]  # cached

    # Build answer lookup: question_id -> selected letter
    answer_map = {a.question_id: a.selected.lower() for a in body.answers}

    # Grade each question with pure Python
    question_grades = []
    for q in session["quiz"]:
        qid = q["question_id"]
        selected = answer_map.get(qid, "")
        correct = selected == q["correct_answer"]
        question_grades.append({
            "question_id": qid,
            "topic": q["topic"],
            "selected": selected,
            "correct_answer": q["correct_answer"],  # reveal after submission
            "correct": correct
        })

    # Compute per-topic score breakdown
    topic_scores = {}
    for g in question_grades:
        t = g["topic"]
        if t not in topic_scores:
            topic_scores[t] = {"topic": t, "correct": 0, "total": 0}
        topic_scores[t]["total"] += 1
        if g["correct"]:
            topic_scores[t]["correct"] += 1

    topic_score_list = list(topic_scores.values())

    # Ask Claude to write one-line judgments (no grading — just summaries)
    try:
        judgments = generate_topic_judgments(topic_score_list)
    except Exception as e:
        # Non-fatal — fall back to no judgment if Claude fails
        judgments = [
            {"topic": t["topic"], "tier": "neutral", "judgment": ""}
            for t in topic_score_list
        ]

    # Merge scores and judgments
    judgment_map = {j["topic"]: j for j in judgments}
    topic_summaries = []
    for t in topic_score_list:
        j = judgment_map.get(t["topic"], {})
        ratio = t["correct"] / t["total"] if t["total"] > 0 else 0
        if ratio > 0.5:
            tier = "positive"
        elif ratio == 0.5:
            tier = "neutral"
        else:
            tier = "negative"
        topic_summaries.append({
            "topic": t["topic"],
            "correct": t["correct"],
            "total": t["total"],
            "tier": tier,
            "judgment": j.get("judgment", "")
        })

    total_correct = sum(1 for g in question_grades if g["correct"])
    total_questions = len(question_grades)

    results = {
        "session_id": body.session_id,
        "total_correct": total_correct,
        "total_questions": total_questions,
        "percentage": round(total_correct / total_questions * 100) if total_questions > 0 else 0,
        "question_grades": question_grades,
        "topic_summaries": topic_summaries
    }

    session["results"] = results
    return results


@app.get("/session/{session_id}")
async def get_session(session_id: str):
    session = _get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return {
        "session_id": session_id,
        "topics": session["topics"],
        "quiz_generated": session["quiz"] is not None,
        "quiz_question_count": len(session["quiz"]) if session["quiz"] else 0,
        "results_available": session["results"] is not None
    }