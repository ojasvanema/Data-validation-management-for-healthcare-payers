
import os
import csv
import random
import glob

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(base_dir)
    source_csv = os.path.join(root_dir, "test_dirty_providers.csv")
    target_csv = os.path.join(root_dir, "test_dirty_providers_with_docs.csv")
    
    # We moved everything to backend/uploads/all_docs
    all_docs_dir = os.path.join(base_dir, "uploads", "all_docs")
    
    docs_pool = []
    
    if os.path.exists(all_docs_dir):
        # Store RELATIVE paths: "backend/uploads/all_docs/filename.pdf"
        for f in glob.glob(os.path.join(all_docs_dir, "*.*")):
            rel_path = os.path.join("backend", "uploads", "all_docs", os.path.basename(f))
            docs_pool.append(rel_path)
        
    if not docs_pool:
        print("Error: No documents found in uploads/all_docs")
        return
        
    print(f"Found {len(docs_pool)} documents to use as pool.")
    
    # 2. Read source CSV and update
    updated_rows = []
    with open(source_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        if 'related_docs' not in fieldnames:
            fieldnames.append('related_docs')
            
        for row in reader:
            # 25% chance to have related_docs
            if random.random() < 0.25:
                # Pick 1 to 3 random docs
                num_docs = random.randint(1, min(3, len(docs_pool)))
                chosen_docs = random.sample(docs_pool, num_docs)
                
                # Format as a JSON string e.g., '["path1.pdf", "path2.png"]'
                # The csv writer will correctly quote this if needed.
                import json
                row['related_docs'] = json.dumps(chosen_docs)
            else:
                row['related_docs'] = "[]"
                
            updated_rows.append(row)
            
    # 3. Write Target CSV
    with open(target_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)
        
    print(f"Successfully created {target_csv} with ~25% coverage of document lists.")

if __name__ == "__main__":
    main()
