import requests
import json
import time
import subprocess
import sys
import os

def start_server():
    print("Starting server...")
    # Start server in background
    proc = subprocess.Popen([sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"], 
                            cwd=os.getcwd(), 
                            stdout=subprocess.PIPE, 
                            stderr=subprocess.PIPE)
    print("Waiting 30s for server startup (models might be downloading)...")
    time.sleep(30) # Wait for startup
    if proc.poll() is not None:
        print("Server exited early!")
        print("STDOUT:", proc.stdout.read().decode())
        print("STDERR:", proc.stderr.read().decode())
    return proc

def test_api():
    url = "http://127.0.0.1:8000/api/orchestrate"
    data = {
        "npi": "1234567890",
        "name": "Test Doctor",
        "license_number": "LIC-TEST",
        "address": "123 Test St",
        "specialty": "General",
        "last_updated": "2024-01-01"
    }
    
    try:
        print(f"Testing {url}...")
        resp = requests.post(url, data=data)
        if resp.status_code == 200:
            print("SUCCESS: API returned 200 OK")
            print("Response:", json.dumps(resp.json(), indent=2))
        else:
            print(f"FAILURE: API returned {resp.status_code}")
            print(resp.text)
    except Exception as e:
        print(f"FAILURE: Could not connect. {e}")

if __name__ == "__main__":
    proc = start_server()
    try:
        test_api()
    finally:
        print("Stopping server...")
        proc.terminate()
        proc.wait()
