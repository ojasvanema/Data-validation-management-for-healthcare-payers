import os
import csv
import random

CSV_DIR = '/home/abhieren/Drive/Projects/Agents/Data-validation-management-for-healthcare-payers/data/csvs'

def generate_mock_email(first_name, last_name, npi):
    domains = ["healthmail.com", "medprovider.org", "clinic.net", "hospital.gov", "practice.io"]
    
    first = str(first_name).strip().lower() if first_name else "dr"
    last = str(last_name).strip().lower() if last_name else str(npi)
    
    # Remove any non-alphanumeric chars for email handle
    first = "".join(c for c in first if c.isalnum())
    last = "".join(c for c in last if c.isalnum())
    
    domain = random.choice(domains)
    return f"{first}.{last}@{domain}"

def process_csv(filepath):
    print(f"Processing: {filepath}")
    temp_filepath = filepath + ".tmp"
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            
            # Check if Email already exists
            if 'Email' in header:
                print(f"Email column already exists in {filepath}. Skipping.")
                return True
                
            header.append("Email")
            
            # Find indices for First, Last, and NPI
            first_idx = header.index("First_Name") if "First_Name" in header else -1
            last_idx = header.index("Last_Name") if "Last_Name" in header else -1
            npi_idx = header.index("NPI") if "NPI" in header else 0 # fallback
            
            rows = [header]
            for row in reader:
                first = row[first_idx] if first_idx != -1 and first_idx < len(row) else ""
                last = row[last_idx] if last_idx != -1 and last_idx < len(row) else ""
                npi = row[npi_idx] if npi_idx != -1 and npi_idx < len(row) else random.randint(1000000000, 9999999999)
                
                email = generate_mock_email(first, last, npi)
                row.append(email)
                rows.append(row)
                
        with open(temp_filepath, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows)
            
        os.replace(temp_filepath, filepath)
        print(f"Successfully added emails to {filepath}")
        return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
        return False

def main():
    target_files = [
        "ground_truth_providers.csv",
        "providers.csv",
        "small_test_providers.csv",
        "test_dirty_providers.csv",
        "test_dirty_providers_with_docs.csv"
    ]
    
    for filename in target_files:
        filepath = os.path.join(CSV_DIR, filename)
        if os.path.exists(filepath):
            process_csv(filepath)
        else:
            print(f"File not found: {filepath}")

if __name__ == "__main__":
    main()
