import tempfile
import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from dotenv import load_dotenv
from extractor import extract_text_from_pdf
from ai import extract_topics

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CHAR_BUDGET = 18000  # safe limit leaving room for the prompt itself

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

    return {
        "topic_count": len(topics),
        "topics": topics,
        "full_text": combined_text,
        "budget": {
            "chars_used": chars_used,
            "chars_total": CHAR_BUDGET,
            "included_files": included_files,
            "excluded_files": excluded_files,
            "skipped_files": skipped_files
        }
    }