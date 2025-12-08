# utils.py
import os
import re
import math
import filetype
from typing import List, Tuple, Dict, Optional

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






# tools.py
import os
from typing import Dict, Any, List, Optional
from utils import clean_text, detect_mime
import pdfplumber
import docx
import pandas as pd
from PIL import Image
import pytesseract
from pydub import AudioSegment
import tempfile
import whisper  # optional - whisper pip package
import json

class BaseTool:
    name = "base"
    def can_handle(self, file_path: str) -> bool:
        raise NotImplementedError
    def parse(self, file_path: str) -> Dict[str, Any]:
        raise NotImplementedError

class PDFTool(BaseTool):
    name = "pdf"
    def can_handle(self, file_path: str) -> bool:
        return detect_mime(file_path) == 'application/pdf' or file_path.lower().endswith('.pdf')

    def parse(self, file_path: str) -> Dict[str, Any]:
        text_pages = []
        metadata = {}
        tables = []
        try:
            with pdfplumber.open(file_path) as pdf:
                metadata = pdf.metadata or {}
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text() or ""
                    text_pages.append(clean_text(page_text))
                    # extract tables if present
                    for t in page.extract_tables():
                        df = pd.DataFrame(t[1:], columns=t[0]) if t else None
                        if df is not None:
                            tables.append(df)
        except Exception as e:
            # fallback: try PyPDF2 or textract
            raise e
        full_text = "\n\n".join(text_pages)
        return {'text': clean_text(full_text), 'pages': text_pages, 'tables': tables, 'metadata': metadata}

class DOCXTool(BaseTool):
    name = "docx"
    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith('.docx') or detect_mime(file_path).endswith('wordprocessingml.document')

    def parse(self, file_path: str) -> Dict[str, Any]:
        doc = docx.Document(file_path)
        paras = [p.text for p in doc.paragraphs if p.text.strip()]
        return {'text': clean_text("\n\n".join(paras)), 'metadata': {}}

class PlainTextTool(BaseTool):
    name = "txt"
    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith('.txt') or detect_mime(file_path) == 'text/plain'
    def parse(self, file_path: str) -> Dict[str, Any]:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            txt = f.read()
        return {'text': clean_text(txt), 'metadata': {}}

class CSVTool(BaseTool):
    name = "csv"
    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith('.csv') or detect_mime(file_path) == 'text/csv'
    def parse(self, file_path: str) -> Dict[str, Any]:
        df = pd.read_csv(file_path, low_memory=False)
        # represent as text summary + table object
        text = df.to_csv(index=False)
        return {'text': text, 'table': df, 'metadata': {'shape': df.shape}}

class ImageOCRTool(BaseTool):
    name = "image_ocr"
    def can_handle(self, file_path: str) -> bool:
        mime = detect_mime(file_path)
        return mime.startswith('image/') or file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff'))
    def parse(self, file_path: str) -> Dict[str, Any]:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return {'text': clean_text(text), 'metadata': {}}

class AudioTranscribeTool(BaseTool):
    name = "audio"
    def __init__(self, model_name: str = "small"):
        # optional: use whisper
        try:
            self.model = whisper.load_model(model_name)
        except Exception:
            self.model = None

    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith(('.mp3', '.wav', '.m4a', '.flac'))

    def parse(self, file_path: str) -> Dict[str, Any]:
        # Convert to wav if needed
        with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
            if not file_path.lower().endswith('.wav'):
                audio = AudioSegment.from_file(file_path)
                audio.export(tmp.name, format='wav')
                audio_path = tmp.name
            else:
                audio_path = file_path
            if self.model is not None:
                res = self.model.transcribe(audio_path)
                text = res.get('text', '')
                return {'text': clean_text(text), 'metadata': {'duration': res.get('duration', None)}}
            else:
                # fallback: no model
                return {'text': '', 'metadata': {}}

# Tool registry helper
DEFAULT_TOOLS = [PDFTool(), DOCXTool(), PlainTextTool(), CSVTool(), ImageOCRTool(), AudioTranscribeTool()]





# indexer.py
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from typing import List, Dict, Any

class EmbeddingModel:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
    def embed(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)

class FaissIndexer:
    def __init__(self, dim: int):
        self.dim = dim
        self.index = faiss.IndexFlatL2(dim)
        self.metadata = []  # parallel list to hold metadata per vector

    def add(self, vectors: np.ndarray, metadatas: List[Dict[str, Any]]):
        if vectors.ndim == 1:
            vectors = vectors.reshape(1, -1)
        assert vectors.shape[1] == self.dim
        self.index.add(vectors.astype('float32'))
        self.metadata.extend(metadatas)

    def search(self, qvec: np.ndarray, top_k: int = 5):
        if qvec.ndim == 1:
            qvec = qvec.reshape(1, -1)
        D, I = self.index.search(qvec.astype('float32'), top_k)
        results = []
        for dlist, ilist in zip(D, I):
            row = []
            for d, i in zip(dlist, ilist):
                if i < len(self.metadata):
                    row.append({'score': float(d), 'meta': self.metadata[i]})
            results.append(row)
        return results






 #agent.py
import os
from typing import List, Dict, Any, Optional
from tools import DEFAULT_TOOLS
from utils import detect_mime, chunk_text, clean_text
from indexer.py import EmbeddingModel, FaissIndexer  # small fix: import path depends on your file layout
import numpy as np

class ToolNotFound(Exception):
    pass

class LangGraphFileAgent:
    def __init__(self, tools: Optional[List] = None, embedding_model_name: str = "all-MiniLM-L6-v2", chunk_size: int = 1000, chunk_overlap: int = 200):
        self.tools = tools or DEFAULT_TOOLS
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embedder = EmbeddingModel(embedding_model_name)
        # create FAISS index after getting embedding dimension
        # lazy init after we get a first embedding
        self.faiss = None
        self.dimension = None

    def pick_tool(self, file_path: str):
        for t in self.tools:
            try:
                if t.can_handle(file_path):
                    return t
            except Exception:
                continue
        raise ToolNotFound(f"No tool registered for {file_path}")

    def ingest_file(self, file_path: str, doc_id: Optional[str] = None) -> Dict[str, Any]:
        tool = self.pick_tool(file_path)
        parsed = tool.parse(file_path)
        text = parsed.get('text', '')
        text = clean_text(text)
        chunks = chunk_text(text, self.chunk_size, self.chunk_overlap)
        # embed chunks
        vectors = self.embedder.embed(chunks)
        if self.faiss is None:
            self.dimension = vectors.shape[1]
            self.faiss = FaissIndexer(self.dimension)
        metadatas = [{'doc_id': doc_id or os.path.basename(file_path), 'chunk_index': i, 'text': chunks[i]} for i in range(len(chunks))]
        self.faiss.add(vectors, metadatas)
        return {'parsed': parsed, 'chunks': len(chunks)}

    def semantic_search(self, query: str, top_k: int = 5):
        qvec = self.embedder.embed([query])[0]
        res = self.faiss.search(qvec, top_k)
        return res

    def query_with_context(self, query: str, top_k: int = 5) -> str:
        # retrieve top chunks, then send to an LLM for answer (LLM code placeholder)
        hits = self.semantic_search(query, top_k=top_k)[0]
        context = "\n\n".join([h['meta']['text'] for h in hits])
        prompt = f"Use the following extracted document context to answer the question. If the answer is not present, say 'NOT FOUND'.\n\nCONTEXT:\n{context}\n\nQUESTION:\n{query}\n\nAnswer concisely:"
        # Call to LLM (placeholder)
        answer = self.call_llm(prompt)
        return answer

    def call_llm(self, prompt: str) -> str:
        # Implement using OpenAI or other LLM. Placeholder:
        # from openai import OpenAI; resp = openai.Completion.create(...)
        return "LLM_RESPONSE_PLACEHOLDER"
