import pdfplumber

def extract_text_from_pdf(pdf_path: str) -> dict:
    pages_text = []
    skipped_pages = []

    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)

        for i, page in enumerate(pdf.pages):
            try:
                text = page.extract_text()
                if text and text.strip():
                    pages_text.append(text.strip())
                else:
                    skipped_pages.append(i + 1)
            except Exception:
                skipped_pages.append(i + 1)

    full_text = "\n\n".join(pages_text)

    return {
        "full_text": full_text,
        "total_pages": total_pages,
        "pages_extracted": len(pages_text),
        "pages_skipped": skipped_pages,
        "char_count": len(full_text)
    }

def chunk_text(text: str, chunk_size: int = 3000, overlap: int = 200) -> list[str]:
    """
    Split long text into overlapping chunks.
    chunk_size: chars per chunk (~750 tokens)
    overlap: chars repeated between chunks so context isn't lost at boundaries
    """

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap

    return chunks