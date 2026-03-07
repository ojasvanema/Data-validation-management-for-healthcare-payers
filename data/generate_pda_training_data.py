"""
PDA Training Data Generator
===========================
Reads 100_test_providers.csv and generates a synthetic longitudinal dataset
for training a Cox Proportional Hazards survival analysis model.

Approach: Simulate 6 monthly "snapshots" of the provider directory.
At each snapshot, some providers' data mutates (address, phone, license changes).
We track these changes to build features and label each provider with:
  - duration: months until data went stale (or total months observed if censored)
  - event: 1 if data went stale, 0 if still accurate

Features engineered:
  1. specialty_churn   — baseline turnover rate by specialty
  2. months_since_update — months since Last_Updated
  3. state_mobility    — 1 if provider is in a high-mobility state
  4. has_docs          — 1 if provider has uploaded supporting documents
  5. years_active      — years since Enumeration_Date

Output: data/pda_training_data.csv (100 rows)
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

np.random.seed(42)  # Reproducibility

# ─── Constants ───
SPECIALTY_CHURN_RATES = {
    "Internal Medicine": 0.15,
    "Family Medicine": 0.12,
    "Family Practice": 0.12,
    "Cardiology": 0.10,
    "Orthopedic Surgery": 0.10,
    "Dermatology": 0.08,
    "Psychiatry": 0.18,
    "Emergency Medicine": 0.25,
    "Urgent Care": 0.30,
    "Physician Assistant": 0.22,
    "Nurse Practitioner": 0.20,
    "Physical Therapist": 0.18,
    "Optometry": 0.10,
    "Podiatry": 0.12,
    "Chiropractic": 0.14,
    "Chiropractor": 0.14,
    "General Surgery": 0.13,
    "Surgery": 0.13,
    "Occupational Therapist": 0.15,
    "Occupational Therapy Assistant": 0.17,
    "Physical Therapy Assistant": 0.19,
    "Social Worker": 0.16,
    "Counselor": 0.18,
    "Behavior Analyst": 0.20,
    "Behavior Technician": 0.25,
    "Registered Nurse": 0.18,
    "Speech-Language Pathologist": 0.14,
    "Audiologist": 0.10,
    "Dietitian": 0.12,
    "Pharmacist": 0.10,
    "Dentist": 0.08,
    "Psychologist": 0.15,
}

HIGH_MOBILITY_STATES = {"FL", "AZ", "NV", "TX", "CA", "CO", "GA"}

TODAY = datetime(2026, 3, 7)  # Current date for consistent computation


def get_specialty_churn(specialty_str: str) -> float:
    """Look up specialty churn rate, handling compound specialties."""
    if not specialty_str or pd.isna(specialty_str):
        return 0.15  # default
    
    # Try exact match first
    spec = specialty_str.strip()
    if spec in SPECIALTY_CHURN_RATES:
        return SPECIALTY_CHURN_RATES[spec]
    
    # Try partial match (e.g., "Nurse Practitioner, Family" → "Nurse Practitioner")
    for key, rate in SPECIALTY_CHURN_RATES.items():
        if key.lower() in spec.lower() or spec.lower() in key.lower():
            return rate
    
    return 0.15  # default


def parse_date(date_str: str) -> datetime | None:
    """Parse date from various formats."""
    if not date_str or pd.isna(date_str):
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(str(date_str)[:10], fmt)
        except (ValueError, TypeError):
            continue
    return None


def main():
    # ─── Load CSV ───
    csv_path = os.path.join(os.path.dirname(__file__), "csvs", "100_test_providers.csv")
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} providers from {csv_path}")

    records = []

    for _, row in df.iterrows():
        npi = row.get("NPI", "")
        specialty = str(row.get("Specialty", ""))
        state = str(row.get("State", ""))
        last_updated = str(row.get("Last_Updated", ""))
        enumeration_date = str(row.get("Enumeration_Date", ""))
        related_docs = str(row.get("related_docs", ""))

        # ─── Feature 1: Specialty churn rate ───
        specialty_churn = get_specialty_churn(specialty)

        # ─── Feature 2: Months since last update ───
        updated_dt = parse_date(last_updated)
        if updated_dt:
            months_since_update = (TODAY - updated_dt).days / 30.0
        else:
            months_since_update = 24.0  # Unknown → assume moderately old

        # ─── Feature 3: State mobility ───
        state_mobility = 1.0 if state.upper() in HIGH_MOBILITY_STATES else 0.0

        # ─── Feature 4: Has supporting documents ───
        has_docs = 1.0 if related_docs and related_docs != "[]" and related_docs != "nan" else 0.0

        # ─── Feature 5: Years active since enumeration ───
        enum_dt = parse_date(enumeration_date)
        if enum_dt:
            years_active = (TODAY - enum_dt).days / 365.25
        else:
            years_active = 5.0  # Unknown → assume moderate

        # ─── Simulate event and duration ───
        # Compute a "true" hazard rate from features
        # Higher hazard = faster data decay
        log_hazard = (
            1.8 * specialty_churn +           # High-churn specialties decay faster
            0.015 * months_since_update +     # Older data decays faster
            0.4 * state_mobility +            # High-mobility states
            -0.3 * has_docs +                 # Having docs = more stable
            -0.02 * min(years_active, 20) +   # Longer-established = more stable
            np.random.normal(0, 0.3)          # Random noise
        )
        hazard_rate = np.exp(log_hazard) * 0.035  # Scale to reasonable monthly hazard

        # Sample event time from exponential distribution
        if hazard_rate > 0:
            event_time_months = np.random.exponential(1.0 / hazard_rate)
        else:
            event_time_months = 100  # Effectively never

        # Observation window = 6 months (our simulation window)
        observation_months = 6.0

        if event_time_months < observation_months:
            event = 1
            duration = max(0.5, round(event_time_months, 1))  # At least 0.5 months
        else:
            event = 0
            duration = observation_months

        records.append({
            "NPI": npi,
            "duration": duration,
            "event": event,
            "specialty_churn": round(specialty_churn, 3),
            "months_since_update": round(months_since_update, 1),
            "state_mobility": state_mobility,
            "has_docs": has_docs,
            "years_active": round(years_active, 1),
        })

    # ─── Output ───
    out_df = pd.DataFrame(records)
    out_path = os.path.join(os.path.dirname(__file__), "pda_training_data.csv")
    out_df.to_csv(out_path, index=False)

    # Stats
    event_rate = out_df["event"].mean()
    print(f"\nGenerated {len(out_df)} training records → {out_path}")
    print(f"Event rate: {event_rate:.1%} ({out_df['event'].sum()} events, {len(out_df) - out_df['event'].sum()} censored)")
    print(f"\nFeature summary:")
    print(out_df[["specialty_churn", "months_since_update", "state_mobility", "has_docs", "years_active"]].describe().round(2))


if __name__ == "__main__":
    main()
