import tempfile
import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/health")
def health():
    return {"status": "ok"}

import tempfile
import os
from fastapi import UploadFile, File, HTTPException

from extractor import extract_text_from_pdf
import tempfile
import os
from fastapi import UploadFile, File, HTTPException



@app.post("/extract-topics")
async def extract_topics_route(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        extraction = extract_text_from_pdf(tmp_path)
    finally:
        os.unlink(tmp_path)

    if extraction["char_count"] == 0:
        raise HTTPException(status_code=422, detail="Could not extract text from PDF")

    try:
        topics = extract_topics(extraction["full_text"])
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"Topic extraction failed: {str(e)}")

    return {
        "filename": file.filename,
        "topic_count": len(topics),
        "topics": topics,
        "full text": extraction["full_text"]
    }