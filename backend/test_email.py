import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the app directory to the python path so we can import services
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.email_service import send_provider_email

def test_email_sending():
    print("Testing Email Sending Service...")
    
    # Check if SMTP variables are actually loaded
    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = os.environ.get("SMTP_PORT", 587)
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    
    print(f"SMTP Configured: {bool(smtp_server and smtp_user and smtp_password)}")
    if smtp_user:
        print(f"SMTP User: {smtp_user}")
        
    provider_data = {
        "id": "test-123",
        "name": "Dr. Test Validato",
        "npi": "0987654321",
        "status": "Review",
        "conflicts": [
            "Test Conflict 1: Data mismatch detected.",
            "Test Conflict 2: NPI verification failed."
        ]
    }
    
    # Try sending to the configured SMTP user to test
    target_email = smtp_user if smtp_user else "tester@example.com"
    print(f"Attempting to send test email to: {target_email}")
    
    try:
        success = send_provider_email(provider_data, target_email)
        if success:
            print("send_provider_email returned True. Check your inbox.")
        else:
            print("send_provider_email returned False.")
    except Exception as e:
        print(f"Exception caught during test: {e}")

if __name__ == "__main__":
    test_email_sending()
