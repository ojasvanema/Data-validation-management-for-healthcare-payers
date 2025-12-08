import os
import tempfile
import requests
import difflib
from typing import Dict, Any, List

# Optional Imports with Graceful Degradation
try:
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    from PIL import Image
    import pytesseract
    HAS_OCR = True
except ImportError:
    HAS_OCR = False

try:
    from pydub import AudioSegment
    import whisper
    HAS_WHISPER = True
except ImportError:
    HAS_WHISPER = False

# Import Utils
from backend.app.utils import clean_text, detect_mime


class BaseTool:
    name = "base"
    def can_handle(self, file_path: str) -> bool:
        raise NotImplementedError
    def parse(self, file_path: str) -> Dict[str, Any]:
        raise NotImplementedError

class PDFTool(BaseTool):
    name = "pdf"
    def can_handle(self, file_path: str) -> bool:
        return HAS_PDF and (detect_mime(file_path) == 'application/pdf' or file_path.lower().endswith('.pdf'))

    def parse(self, file_path: str) -> Dict[str, Any]:
        if not HAS_PDF: return {'text': "", 'error': "pdfplumber not installed"}
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
            return {'text': "", 'error': str(e)}
        
        full_text = "\n\n".join(text_pages)
        return {'text': clean_text(full_text), 'pages': text_pages, 'tables': tables, 'metadata': metadata}

class DOCXTool(BaseTool):
    name = "docx"
    def can_handle(self, file_path: str) -> bool:
        return HAS_DOCX and (file_path.lower().endswith('.docx'))

    def parse(self, file_path: str) -> Dict[str, Any]:
        if not HAS_DOCX: return {'text': "", 'error': "python-docx not installed"}
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
        return HAS_PANDAS and (file_path.lower().endswith('.csv'))
    def parse(self, file_path: str) -> Dict[str, Any]:
        try:
            df = pd.read_csv(file_path, low_memory=False)
            text = df.to_csv(index=False)
            return {'text': text, 'table': df.to_dict(orient='records'), 'metadata': {'shape': df.shape}}
        except Exception as e:
            return {'text': "", 'error': str(e)}

class ImageOCRTool(BaseTool):
    name = "image_ocr"
    def can_handle(self, file_path: str) -> bool:
        return HAS_OCR and (file_path.lower().endswith(('.png', '.jpg', '.jpeg')))
    def parse(self, file_path: str) -> Dict[str, Any]:
        try:
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img)
            return {'text': clean_text(text), 'metadata': {}}
        except Exception as e:
             return {'text': "", 'error': str(e)}

class AudioTranscribeTool(BaseTool):
    name = "audio"
    def can_handle(self, file_path: str) -> bool:
        return HAS_WHISPER and file_path.lower().endswith(('.mp3', '.wav'))
    def parse(self, file_path: str) -> Dict[str, Any]:
        return {'text': "Whisper disabled", 'metadata': {}}

class NpiRegistryTool:
    name = "npi_registry"
    BASE_URL = "https://npiregistry.cms.hhs.gov/api/"
    
    def lookup(self, npi: str) -> Dict[str, Any]:
        if not npi or len(npi) != 10 or not npi.isdigit():
             return {"valid": False, "error": "Invalid format"}
             
        params = {"number": npi, "version": "2.1"}
        try:
            resp = requests.get(self.BASE_URL, params=params, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if "results" in data and len(data["results"]) > 0:
                    result = data["results"][0]
                    return {
                        "valid": True,
                        "data": {
                            "first_name": result["basic"].get("first_name"),
                            "last_name": result["basic"].get("last_name"),
                            "credential": result["basic"].get("credential"),
                            "addresses": result.get("addresses", [])
                        }
                    }
                else:
                    return {"valid": False, "error": "Not Found"}
            else:
                return {"valid": False, "error": f"API Error: {resp.status_code}"}
        except Exception as e:
            return {"valid": False, "error": str(e)}

class FuzzyMatchTool:
    name = "fuzzy_match"
    
    def ratio(self, str1: str, str2: str) -> float:
        if not str1 or not str2:
             return 0.0
        return difflib.SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

# Instance registry
DEFAULT_TOOLS = [PDFTool(), DOCXTool(), PlainTextTool(), CSVTool(), ImageOCRTool(), AudioTranscribeTool()]
NPI_TOOL = NpiRegistryTool()
FUZZY_TOOL = FuzzyMatchTool()
