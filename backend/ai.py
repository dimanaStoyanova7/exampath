import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def extract_topics(full_text: str) -> list[str]:
    prompt = f"""You are an expert university teaching assistant.

Below is the full text extracted from a university course's lecture materials.

Your task: identify the 10 to 20 most important, specific, exam-relevant topics covered in this course.

Rules:
- Be specific. Write "Fourier transforms" not "signal processing concepts".
- Write "Eigenvalue decomposition" not "linear algebra".
- Each topic should be something a student could be tested on in an exam.
- Do not include administrative topics like "course overview" or "grading".
- Return ONLY a valid JSON array of strings. No explanation, no markdown, no extra text.

Example of good output:
["Fourier transforms", "Convolution theorem", "Z-transforms", "Sampling theorem"]

Course materials:
{full_text[:12000]}

Return the JSON array now:"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if Claude adds them despite instructions
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    topics = json.loads(raw)

    if not isinstance(topics, list):
        raise ValueError("Claude did not return a list")

    return [str(t) for t in topics]