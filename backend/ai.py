import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

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

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    topics = json.loads(raw)

    if not isinstance(topics, list):
        raise ValueError("Claude did not return a list")

    return [str(t) for t in topics]