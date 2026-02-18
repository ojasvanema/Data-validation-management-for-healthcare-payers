import os
from dotenv import load_dotenv

load_dotenv()

STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']
SPECIALTIES = ['Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Radiology', 'Surgery', 'Urology']

# Path to the dirty dataset (relative to project root)
# Moving up from backend/app/core/config.py to project root: ../../../
# Original was backend/app/main.py -> ../../
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "test_dirty_providers.csv")
PROVIDER_LIMIT = 50  # Process first N providers to keep API calls manageable
