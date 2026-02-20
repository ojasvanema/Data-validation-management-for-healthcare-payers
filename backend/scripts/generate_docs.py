
import os
import random
import csv
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(os.path.dirname(BASE_DIR), "test_dirty_providers.csv")
DOCS_DIR = os.path.join(BASE_DIR, "uploads", "generated_docs")

os.makedirs(DOCS_DIR, exist_ok=True)

DOCUMENT_TYPES = [
    "State License Certificate",
    "DEA Registration",
    "Board Certification",
    "Malpractice Insurance Policy",
    "Hospital Privileges Letter"
]

STATUS_TEXTS = {
    "valid": [
        "This certifies that the practitioner is in good standing.",
        "License active and unrestricted.",
        "Full privileges granted at Memorial Hospital.",
        "Coverage active through 2026.",
        "Board Certified in declared specialty."
    ],
    "expired": [
        "NOTICE: License EXPIRED as of 2023-12-31.",
        "Registration lapsed. Renewal required immediately.",
        "Board Certification no longer valid due to missed CME.",
        "Coverage terminated for non-payment.",
        "Privileges suspended pending review."
    ],
    "disciplinary": [
        "WARNING: Under investigation for billing irregularities.",
        "Probationary status active required supervision.",
        "Recent semantic analysis flagged potential misconduct.",
        "Restrictions placed on prescribing authority.",
        "Audit finding: Mismatch in reported service location."
    ]
}

def generate_pdf(filepath, content):
    c = canvas.Canvas(filepath, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 750, "Official Provider Documentation")
    
    c.setFont("Helvetica", 12)
    c.drawString(72, 720, f"Date Generated: {random.choice(['2023-01-15', '2024-05-20', '2022-11-10'])}")
    c.drawString(72, 700, "-" * 60)
    
    y = 650
    for line in content.split('\n'):
        c.drawString(72, y, line)
        y -= 20
        
    c.save()

def main():
    print(f"Reading providers from {CSV_PATH}...")
    rows = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if 'related_docs' not in fieldnames:
            fieldnames.append('related_docs')
        for row in reader:
            rows.append(row)

    print(f"Processing {len(rows)} providers...")
    updated_rows = []
    
    for row in rows:
        npi = row.get('NPI')
        name = f"{row.get('First_Name')} {row.get('Last_Name')}"
        
        # 25% chance to have a document
        if random.random() < 0.25:
            doc_type = random.choice(DOCUMENT_TYPES)
            
            # Determine content based on status or random
            # If status is not 'A', higher chance of bad docs
            status = row.get('Status', 'A')
            if status != 'A' or random.random() < 0.1:
                content_type = random.choice(["expired", "disciplinary"])
            else:
                content_type = "valid"
                
            text_body = random.choice(STATUS_TEXTS[content_type])
            full_text = f"Document: {doc_type}\nProvider: {name} (NPI: {npi})\n\n{text_body}\n\nVerified by: State Board of Medicine"
            
            filename = f"{npi}_{doc_type.replace(' ', '_')}.pdf"
            filepath = os.path.join(DOCS_DIR, filename)
            
            generate_pdf(filepath, full_text)
            
            # Store relative path for cleaner CSV, or absolute? 
            # Storing absolute path is safer for the agent to find.
            row['related_docs'] = filepath
            print(f"Generated {content_type} doc for {npi}")
        else:
            row['related_docs'] = ""
            
        updated_rows.append(row)

    print("Writing updated CSV...")
    with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)
        
    print("Done!")

if __name__ == "__main__":
    main()
