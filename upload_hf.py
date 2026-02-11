import os
from huggingface_hub import HfApi, create_repo
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
REPO_ID = "healthcare-validation-synthetic-data" 
USER_NAMESPACE = None 

if not HF_TOKEN:
    print("Error: HF_TOKEN not found in environment variables.")
    exit(1)

api = HfApi(token=HF_TOKEN)

try:
    # Get user info
    user_info = api.whoami()
    USER_NAMESPACE = user_info['name']
    full_repo_id = f"{USER_NAMESPACE}/{REPO_ID}"
    
    print(f"Target Repository: {full_repo_id}")

    # Create repo
    try:
        create_repo(full_repo_id, repo_type="dataset", exist_ok=True)
        print(f"Repository {full_repo_id} ensures.")
    except Exception as e:
        print(f"Error creating/checking repo: {e}")
        exit(1)

    # Generate Dataset Card
    readme_content = """---
configs:
- config_name: default
  data_files:
  - split: train
    path: synthetic_data/providers.csv
license: mit
task_categories:
- tabular-classification
- text-classification
tags:
- healthcare
- synthetic
- insurance
- payers
size_categories:
- 1K<n<10K
---

# Healthcare Payer Synthetic Data & Codebase

This repository contains both the synthetic healthcare provider data and the validation management system codebase.

## Dataset Structure

### `synthetic_data/providers.csv`
Contains tabular data.

### `synthetic_data/documents/`
Contains synthetic documents (PDFs, Images).

## usage

```python
from datasets import load_dataset
dataset = load_dataset("{full_repo_id}", data_files="synthetic_data/providers.csv")
```
"""
    
    # Save specialized README for upload
    with open("README_HF.md", "w") as f:
        f.write(readme_content.format(full_repo_id=full_repo_id))

    print("Starting bulk upload of synthetic data...")
    
    # upload only synthetic_data contents
    api.upload_large_folder(
        folder_path="synthetic_data",
        repo_id=full_repo_id,
        repo_type="dataset",
        ignore_patterns=[
            ".DS_Store",
            "__pycache__"
        ],
        num_workers=4
    )
    
    # formatting fix: upload proper README manually
    print("Uploading Dataset Card...")
    api.upload_file(
        path_or_fileobj="README_HF.md",
        path_in_repo="README.md",
        repo_id=full_repo_id,
        repo_type="dataset",
        commit_message="Update Dataset Card"
    )

    print(f"Upload complete! View your dataset at: https://huggingface.co/datasets/{full_repo_id}")
    
    if os.path.exists("README_HF.md"):
        os.remove("README_HF.md")

except Exception as e:
    print(f"An error occurred: {e}")
