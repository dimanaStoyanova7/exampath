import os
import json
import traceback
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _extract_json_array(raw: str) -> list:
    """Parse a JSON array from Claude's response, tolerating code fences and surrounding prose."""
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    start = raw.find("[")
    end = raw.rfind("]")
    if start == -1 or end == -1:
        raise json.JSONDecodeError("No JSON array found in response", raw, 0)
    return json.loads(raw[start:end + 1])

def extract_topics(full_text: str, num_pdfs: int = 1) -> list[str]:
    if num_pdfs == 1:
        min_topics, max_topics = 5, 15
    elif num_pdfs <= 3:
        min_topics, max_topics = 10, 20
    else:
        min_topics, max_topics = 15, 30

    prompt = f"""You are an expert university teaching assistant.

Below is the full text extracted from {num_pdfs} university course document(s).

Your task: identify the {min_topics} to {max_topics} most important, specific, exam-relevant topics covered across all the materials.

Rules:
- Be specific. Write "Fourier transforms" not "signal processing concepts".
- Write "Eigenvalue decomposition" not "linear algebra".
- Each topic should be something a student could be tested on in an exam.
- Do not include duplicates or near-duplicates — if two documents cover the same topic, list it once.
- Do not include administrative topics like "course overview" or "grading".
- Return ONLY a valid JSON array of strings. No explanation, no markdown, no extra text.

Example of good output:
["Fourier transforms", "Convolution theorem", "Z-transforms", "Sampling theorem"]

Course materials:
{full_text}

Return the JSON array now:"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    topics = _extract_json_array(raw)

    if not isinstance(topics, list):
        raise ValueError("Claude did not return a list")

    return [str(t) for t in topics]


def generate_quiz(topics: list[str], full_text: str) -> list[dict]:
    num_topics = len(topics)
    per_topic = max(1, min(5, 25 // num_topics))
    topics_block = "\n".join(f"- {t}" for t in topics)

    prompt = f"""You are an expert university professor writing a multiple choice diagnostic quiz.

The course covers these topics:
{topics_block}

Relevant course material:
{full_text[:15000]}

Your task: write exactly {per_topic} question(s) for EACH topic listed above.
Total questions: {num_topics * per_topic}.

For each question decide whether it suits a 4-option MCQ or a True/False question.
- Use True/False for factual statements that are clearly true or false.
- Use 4-option MCQ for questions requiring understanding or distinction between concepts.

Rules:
- Questions must test genuine understanding, not just memorisation.
- Keep each question under 20 words. Be direct — no preamble like "According to the material…".
- Keep each answer option under 10 words. No full sentences — use concise phrases.
- For MCQ: make all 4 options plausible — avoid obviously wrong distractors.
- For True/False: make the statement specific, not trivially obvious.
- For True/False: ALWAYS include BOTH options: {{"a": "True", "b": "False"}}. Never omit one.
- The correct answer must be unambiguously correct based on the course material.
- Return ONLY a valid JSON array. No explanation, no markdown, no extra text.

Return format:
[
  {{
    "topic": "exact topic name",
    "question": "question text here",
    "question_type": "mcq",
    "options": {{"a": "...", "b": "...", "c": "...", "d": "..."}},
    "correct_answer": "b"
  }},
  {{
    "topic": "exact topic name",
    "question": "statement to evaluate",
    "question_type": "true_false",
    "options": {{"a": "True", "b": "False"}},
    "correct_answer": "a"
  }}
]

Return the full JSON array now:"""

    last_exc: Exception = RuntimeError("generate_quiz: no attempts made")
    questions = None
    for attempt in range(3):
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = message.content[0].text.strip()
        try:
            questions = _extract_json_array(raw)
            break
        except json.JSONDecodeError as e:
            last_exc = e
            print(f"[generate_quiz] attempt {attempt + 1}/3 — JSON parse failed: {e} | raw[:200]: {raw[:200]}")
    else:
        traceback.print_exc()
        raise last_exc

    if not isinstance(questions, list):
        raise ValueError("Claude did not return a list")

    result = []
    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            continue
        if not all(k in q for k in ["topic", "question", "options", "correct_answer"]):
            continue
        options = q["options"]
        if not isinstance(options, dict) or len(options) == 0:
            continue
        correct = str(q["correct_answer"]).lower()
        question_type = str(q.get("question_type", "mcq"))
        # Fix questions that only have 1 option — force to proper True/False
        if len(options) == 1:
            options = {"a": "True", "b": "False"}
            question_type = "true_false"
            if correct not in ("a", "b"):
                correct = "a"
        # Skip if the declared correct answer isn't among the options
        if correct not in options:
            continue
        result.append({
            "question_id": i,
            "topic": str(q["topic"]),
            "question": str(q["question"]),
            "question_type": question_type,
            "options": options,
            "correct_answer": correct
        })

    return result


def generate_topic_judgments(topic_scores: list[dict]) -> list[dict]:
    """
    Given per-topic score breakdown, ask Claude to write
    a one-line judgment per topic. Pure summarisation — no grading.
    """
    lines = []
    for t in topic_scores:
        lines.append(
            f"Topic: {t['topic']} — {t['correct']}/{t['total']} correct"
        )
    scores_block = "\n".join(lines)

    prompt = f"""You are a university professor reviewing a student's quiz results.

Here are the results per topic:
{scores_block}

For each topic write:
- tier: "positive" if more than half correct, "negative" if half or fewer correct, "neutral" if exactly half
- judgment: one sentence describing the student's understanding of this topic

Return ONLY a valid JSON array. No markdown, no extra text.

Return format:
[
  {{"topic": "...", "tier": "positive", "judgment": "..."}}
]

Return the JSON array now:"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    judgments = _extract_json_array(raw)
    if not isinstance(judgments, list):
        raise ValueError("Claude did not return a list")
    return judgments