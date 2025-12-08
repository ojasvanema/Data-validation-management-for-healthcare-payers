import os
import pdfplumber
import docx
import pandas as pd
from PIL import Image
import pytesseract
from pydub import AudioSegment
import tempfile
import whisper
from typing import Dict, Any, List
# Fix import to be absolute or relative to package
from backend.utils import clean_text, detect_mime

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
                            tables.append(df.to_dict(orient='records'))
        except Exception as e:
            print(f"Error parsing PDF: {e}")
            return {'text': "", 'error': str(e)}
        
        full_text = "\n\n".join(text_pages)
        return {'text': clean_text(full_text), 'pages': text_pages, 'tables': tables, 'metadata': metadata}

class DOCXTool(BaseTool):
    name = "docx"
    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith('.docx') or detect_mime(file_path).endswith('wordprocessingml.document')

    def parse(self, file_path: str) -> Dict[str, Any]:
        try:
            doc = docx.Document(file_path)
            paras = [p.text for p in doc.paragraphs if p.text.strip()]
            return {'text': clean_text("\n\n".join(paras)), 'metadata': {}}
        except Exception as e:
             return {'text': "", 'error': str(e)}

class PlainTextTool(BaseTool):
    name = "txt"
    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith('.txt') or detect_mime(file_path) == 'text/plain'
    def parse(self, file_path: str) -> Dict[str, Any]:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                txt = f.read()
            return {'text': clean_text(txt), 'metadata': {}}
        except Exception as e:
            return {'text': "", 'error': str(e)}

class CSVTool(BaseTool):
    name = "csv"
    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith('.csv') or detect_mime(file_path) == 'text/csv'
    def parse(self, file_path: str) -> Dict[str, Any]:
        try:
            df = pd.read_csv(file_path, low_memory=False)
            # represent as text summary + table object
            text = df.to_csv(index=False)
            return {'text': text, 'table': df.to_dict(orient='records'), 'metadata': {'shape': df.shape}}
        except Exception as e:
            return {'text': "", 'error': str(e)}

class ImageOCRTool(BaseTool):
    name = "image_ocr"
    def can_handle(self, file_path: str) -> bool:
        mime = detect_mime(file_path)
        return mime.startswith('image/') or file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff'))
    def parse(self, file_path: str) -> Dict[str, Any]:
        try:
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img)
            return {'text': clean_text(text), 'metadata': {}}
        except Exception as e:
             return {'text': "", 'error': str(e)}

class AudioTranscribeTool(BaseTool):
    name = "audio"
    def __init__(self, model_name: str = "base"):
        self.model = None
        self.model_name = model_name

    def load_model(self):
        if self.model is None:
            try:
                self.model = whisper.load_model(self.model_name)
            except Exception as e:
                print(f"Warning: Whisper model not loaded. {e}")
                self.model = None

    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith(('.mp3', '.wav', '.m4a', '.flac'))

    def parse(self, file_path: str) -> Dict[str, Any]:
        self.load_model()
        if self.model is None:
             return {'text': "Whisper model not available", 'metadata': {}}
        
        # Convert to wav if needed
        audio_path = file_path
        tmp = None
        try:
            if not file_path.lower().endswith('.wav'):
                tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                audio = AudioSegment.from_file(file_path)
                audio.export(tmp.name, format='wav')
                audio_path = tmp.name
            
            res = self.model.transcribe(audio_path)
            text = res.get('text', '')
            return {'text': clean_text(text), 'metadata': {'duration': res.get('duration', None)}}
        except Exception as e:
             return {'text': "", 'error': str(e)}
        finally:
            if tmp and os.path.exists(tmp.name):
                os.remove(tmp.name)

# Instance registry
DEFAULT_TOOLS = [PDFTool(), DOCXTool(), PlainTextTool(), CSVTool(), ImageOCRTool(), AudioTranscribeTool()]
