import os
import re
import filetype
from typing import List

def detect_mime(file_path: str) -> str:
    kind = filetype.guess(file_path)
    if kind:
        return kind.mime
    # fallback by extension
    ext = os.path.splitext(file_path)[1].lower()
    map_ext = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
    }
    return map_ext.get(ext, 'application/octet-stream')

def clean_text(text: str) -> str:
    # simple whitespace + normalization + remove multiple newlines
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Chunk text into overlapping chunks.
    chunk_size, overlap in characters (simple heuristic).
    """
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    L = len(text)
    while start < L:
        end = min(start + chunk_size, L)
        chunk = text[start:end]
        chunks.append(chunk)
        start = max(end - overlap, end)  # move forward
    return chunks

def approximate_num_tokens(text: str, chars_per_token: int = 4) -> int:
    return max(1, len(text) // chars_per_token)
