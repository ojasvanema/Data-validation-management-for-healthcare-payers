
import asyncio
import csv
import json
import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.services.vera_agent import run_vera_on_row
from dotenv import load_dotenv

load_dotenv()

async def main():
    csv_path = "backend/app/data/comprehensive_providers.csv"
    if not os.path.exists(csv_path):
        # try relative if running from root
        csv_path = "backend/app/data/comprehensive_providers.csv"
        if not os.path.exists(csv_path):
            print(f"Error: CSV not found at {csv_path}")
            return

    print(f"Loading data from {csv_path}...")
    
    rows = []
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    print(f"Found {len(rows)} records. Starting VERA Analysis...\n{'='*60}")

    for i, row in enumerate(rows):
        print(f"\nProcessing Record #{i+1}: {row['First_Name']} {row['Last_Name']} (NPI: {row['NPI']})")
        print(f"File Path: {row['File_Path']}")
        
        try:
            result = await run_vera_on_row(row)
            
            report = result["final_report"]
            print("-" * 40)
            print(f"TRUST SCORE: {report['trust_score']} / 100")
            print(f"Risk Level:  {result['risk_level']}")
            print("-" * 40)
            
            print("Breakdown:")
            dims = report.get("breakdown", {})
            print(f"  Identity:     {dims.get('identity', {}).get('score', 0):.2f} - {dims.get('identity', {}).get('reasoning', '')}")
            print(f"  Reachability: {dims.get('reachability', {}).get('score', 0):.2f} - {dims.get('reachability', {}).get('reasoning', '')}")
            print(f"  Reputation:   {dims.get('reputation', {}).get('score', 0):.2f} - {dims.get('reputation', {}).get('reasoning', '')}")
            
            if report.get("critical_flags"):
                print(f"CRITICAL FLAGS: {report['critical_flags']}")
            
            print("\nLOGS:")
            for log in result["logs"]:
                print(f"  [LOG] {log}")
                
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
