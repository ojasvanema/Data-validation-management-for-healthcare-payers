"""
VERA OCR Service — Extract structured provider data from scanned documents.
Uses pytesseract (Tesseract OCR) for text extraction and regex for field parsing.
"""

import re
import io
from typing import Dict, Any, List, Optional
from PIL import Image
import pytesseract

# Try to import pdfplumber for PDF support
try:
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False


def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from an image file using Tesseract OCR."""
    try:
        image = Image.open(io.BytesIO(file_bytes))
        # Convert to RGB if needed (handles RGBA, palette, etc.)
        if image.mode != "RGB":
            image = image.convert("RGB")
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        return f"[OCR Error: {str(e)}]"


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using pdfplumber."""
    if not HAS_PDF:
        return "[PDF support not available — install pdfplumber]"
    try:
        texts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    texts.append(page_text)
        return "\n".join(texts).strip() if texts else "[No text found in PDF]"
    except Exception as e:
        return f"[PDF Error: {str(e)}]"


def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Route to the appropriate extractor based on file extension.
    Supports: .jpg, .jpeg, .png, .bmp, .tiff, .pdf
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("jpg", "jpeg", "png", "bmp", "tiff", "tif", "webp"):
        return extract_text_from_image(file_bytes)
    else:
        return f"[Unsupported file type: .{ext}]"


# ─── Field Extraction via Regex ───

NPI_PATTERN = re.compile(r'\b(\d{10})\b')
PHONE_PATTERN = re.compile(r'\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b')
ZIP_PATTERN = re.compile(r'\b(\d{5}(?:-\d{4})?)\b')
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')

# Common state abbreviations
US_STATES = {
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID',
    'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
    'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
    'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
    'WI', 'WY', 'DC'
}

# Common medical credentials
CREDENTIALS = [
    'M.D.', 'MD', 'D.O.', 'DO', 'Ph.D.', 'PhD', 'DPM', 'DDS', 'DMD',
    'PA-C', 'PA', 'NP', 'ARNP', 'APRN', 'RN', 'LPN', 'PT', 'DPT',
    'OD', 'DC', 'OT', 'SLP', 'LCSW', 'LMFT', 'PsyD', 'PharmD'
]

SPECIALTIES = [
    'Internal Medicine', 'Family Medicine', 'Family Practice', 'Cardiology',
    'Orthopedic Surgery', 'Dermatology', 'Psychiatry', 'Emergency Medicine',
    'Urgent Care', 'Physician Assistant', 'Nurse Practitioner', 'Physical Therapist',
    'Optometry', 'Podiatry', 'Chiropractic', 'General Surgery', 'Pediatrics',
    'Obstetrics', 'Gynecology', 'Neurology', 'Oncology', 'Radiology',
    'Anesthesiology', 'Pathology', 'Urology', 'Ophthalmology', 'ENT',
    'Pulmonology', 'Gastroenterology', 'Endocrinology', 'Rheumatology',
    'Nephrology', 'Hematology', 'Surgery', 'Speech-Language Pathologist',
    'Registered Nurse', 'Licensed Practical Nurse'
]


def parse_provider_fields(raw_text: str) -> Dict[str, Any]:
    """
    Extract structured provider fields from OCR text using regex + heuristics.
    Returns a dict with all extracted fields (may be empty for missing data).
    """
    result: Dict[str, Any] = {
        "npi": "",
        "first_name": "",
        "last_name": "",
        "credential": "",
        "specialty": "",
        "phone": "",
        "address": "",
        "city": "",
        "state": "",
        "zip": "",
        "email": "",
        "raw_text": raw_text,
        "extraction_confidence": "low",
        "fields_found": 0,
    }

    if not raw_text or raw_text.startswith("["):
        return result

    text_upper = raw_text.upper()
    fields_found = 0

    # 1. NPI (10-digit number)
    npi_matches = NPI_PATTERN.findall(raw_text)
    if npi_matches:
        # Pick the first 10-digit number (most likely NPI)
        result["npi"] = npi_matches[0]
        fields_found += 1

    # 2. Phone
    phone_matches = PHONE_PATTERN.findall(raw_text)
    if phone_matches:
        result["phone"] = phone_matches[0]
        fields_found += 1

    # 3. ZIP code
    zip_matches = ZIP_PATTERN.findall(raw_text)
    if zip_matches:
        result["zip"] = zip_matches[-1]  # Last ZIP is often the address ZIP
        fields_found += 1

    # 4. State
    for state in US_STATES:
        # Look for state abbreviation as a word boundary
        if re.search(rf'\b{state}\b', text_upper):
            result["state"] = state
            fields_found += 1
            break

    # 5. Credential
    for cred in CREDENTIALS:
        if cred.upper() in text_upper:
            result["credential"] = cred
            fields_found += 1
            break

    # 6. Specialty
    text_lower = raw_text.lower()
    for spec in SPECIALTIES:
        if spec.lower() in text_lower:
            result["specialty"] = spec
            fields_found += 1
            break

    # 7. Email
    email_matches = EMAIL_PATTERN.findall(raw_text)
    if email_matches:
        result["email"] = email_matches[0]
        fields_found += 1

    # 8. Name extraction (heuristic: look for "Dr." or "Name:" patterns)
    name_patterns = [
        re.compile(r'(?:Dr\.?\s+)([A-Z][a-z]+)\s+([A-Z][a-z]+)', re.IGNORECASE),
        re.compile(r'(?:Name|Provider|Physician)[\s:]+([A-Z][a-z]+)\s+([A-Z][a-z]+)', re.IGNORECASE),
        re.compile(r'(?:First\s*Name)[\s:]+([A-Z][a-z]+)', re.IGNORECASE),
    ]
    for pat in name_patterns:
        match = pat.search(raw_text)
        if match:
            result["first_name"] = match.group(1)
            if match.lastindex >= 2:
                result["last_name"] = match.group(2)
            fields_found += 1
            break

    # 9. Address (heuristic: look for street indicators)
    address_pattern = re.compile(
        r'(\d+\s+[A-Za-z]+(?:\s+[A-Za-z]+)*\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Circle|Cir)\.?)',
        re.IGNORECASE
    )
    addr_match = address_pattern.search(raw_text)
    if addr_match:
        result["address"] = addr_match.group(1).strip()
        fields_found += 1

    # Set confidence
    result["fields_found"] = fields_found
    if fields_found >= 5:
        result["extraction_confidence"] = "high"
    elif fields_found >= 3:
        result["extraction_confidence"] = "medium"
    else:
        result["extraction_confidence"] = "low"

    return result
