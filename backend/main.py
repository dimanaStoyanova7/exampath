import tempfile
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from extractor import extract_text_from_pdf

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

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = extract_text_from_pdf(tmp_path)
    finally:
        os.unlink(tmp_path)  # always delete the temp file

    if result["char_count"] == 0:
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text. The PDF may be scanned/image-based."
        )

    return {
        "filename": file.filename,
        "pages_extracted": result["pages_extracted"],
        "total_pages": result["total_pages"],
        "pages_skipped": result["pages_skipped"],
        "char_count": result["char_count"],
        "text_preview": result["full_text"][:500],
        "full_text": result["full_text"],
    }