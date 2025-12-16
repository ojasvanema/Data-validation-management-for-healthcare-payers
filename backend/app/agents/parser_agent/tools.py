import os
from typing import Dict, Any, List, Optional
import docx
import pandas as pd
from PIL import Image
try:
    import pytesseract
except ImportError:
    pytesseract = None
try:
    from pydub import AudioSegment
except ImportError:
    AudioSegment = None
import tempfile
try:
    import whisper  # optional - whisper pip package
except ImportError:
    whisper = None
import json
import pdfplumber

from .utils import detect_mime, clean_text

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

class ToolNotFound(Exception):
    pass
