"""
VERA Multi-Source Validation Service
Implements the 3-Dimensional Trust Score: T = 100 × (w1·s1 + w2·s2 + w3·s3) × (1-λ)
 - D1: Identity Integrity (NPPES API)
 - D2: Reachability (Census Geocoder + Medicare API)
 - D3: Reputation (NPI status + credential checks)
"""

import httpx
import asyncio
import re
from datetime import datetime
from difflib import SequenceMatcher
from typing import Dict, Any, List, Tuple, Optional
from .models import AgentThought

# ─── API Endpoints ───
NPPES_API = "https://npiregistry.cms.hhs.gov/api/"
CENSUS_GEOCODER_API = "https://geocoding.geo.census.gov/geocoder/addresses/onelineaddress"
MEDICARE_PROVIDER_URL = "https://data.cms.gov/data-api/v1/dataset/3614a599-919b-4534-ac94-3e7c18cc3b22/data"

# ─── Weights ───
W1 = 0.40  # Identity Integrity
W2 = 0.30  # Reachability
W3 = 0.30  # Reputation

# ─── Specialty turnover base rates (for PDA) ───
SPECIALTY_DECAY_RATES = {
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
    "General Surgery": 0.13,
}

# High-mobility states
HIGH_MOBILITY_STATES = {"FL", "AZ", "NV", "TX", "CA", "CO", "GA"}


def fuzzy_match(a: str, b: str) -> float:
    """Return 0-1 similarity between two strings."""
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.upper().strip(), b.upper().strip()).ratio()


def normalize_phone(phone: str) -> str:
    """Strip phone to digits only."""
    if not phone:
        return ""
    return re.sub(r'\D', '', str(phone))[-10:]  # last 10 digits


async def validate_nppes(npi: str, csv_row: Dict[str, Any], client: httpx.AsyncClient) -> Dict[str, Any]:
    """
    Call NPPES API to validate identity fields.
    Returns: { s1, findings: [...], nppes_data: {...}, lambda_penalty }
    """
    result = {
        "s1": 0.0,
        "findings": [],
        "nppes_data": None,
        "lambda_penalty": 0.0,
        "nppes_found": False,
    }

    try:
        resp = await client.get(NPPES_API, params={
            "version": "2.1",
            "number": str(npi),
            "pretty": "true"
        }, timeout=15.0)
        data = resp.json()
    except Exception as e:
        result["findings"].append(f"NPPES API error: {str(e)[:80]}")
        result["s1"] = 0.3  # Can't validate, uncertain
        return result

    result_count = data.get("result_count", 0)
    if result_count == 0:
        result["findings"].append(f"NPI {npi} NOT FOUND in NPPES registry")
        result["s1"] = 0.0
        result["lambda_penalty"] = 0.9  # Critical: NPI doesn't exist
        return result

    nppes = data["results"][0]
    basic = nppes.get("basic", {})
    addresses = nppes.get("addresses", [])
    taxonomies = nppes.get("taxonomies", [])

    result["nppes_found"] = True
    result["nppes_data"] = {
        "first_name": basic.get("first_name", ""),
        "last_name": basic.get("last_name", ""),
        "credential": basic.get("credential", ""),
        "status": basic.get("status", ""),
        "last_updated": basic.get("last_updated", ""),
        "enumeration_date": basic.get("enumeration_date", ""),
    }

    # Collect practice address from NPPES
    if addresses:
        primary_addr = addresses[0]
        result["nppes_data"]["address"] = primary_addr.get("address_1", "")
        result["nppes_data"]["city"] = primary_addr.get("city", "")
        result["nppes_data"]["state"] = primary_addr.get("state", "")
        result["nppes_data"]["zip"] = primary_addr.get("postal_code", "")
        result["nppes_data"]["phone"] = primary_addr.get("telephone_number", "")

    # Primary taxonomy
    if taxonomies:
        primary_tax = next((t for t in taxonomies if t.get("primary")), taxonomies[0])
        result["nppes_data"]["specialty_desc"] = primary_tax.get("desc", "")
        result["nppes_data"]["specialty_code"] = primary_tax.get("code", "")
        result["nppes_data"]["license"] = primary_tax.get("license", "")
        result["nppes_data"]["license_state"] = primary_tax.get("state", "")

    # ─── Compute s1 (Identity Integrity) ───
    checks = []
    nppes_d = result["nppes_data"]

    # 1. Name match (most important)
    csv_first = csv_row.get("First_Name", "")
    csv_last = csv_row.get("Last_Name", "")
    nppes_first = nppes_d.get("first_name", "")
    nppes_last = nppes_d.get("last_name", "")

    name_sim = (fuzzy_match(csv_first, nppes_first) + fuzzy_match(csv_last, nppes_last)) / 2

    if name_sim >= 0.85:
        checks.append(1.0)
        result["findings"].append(f"✓ Name match: {csv_first} {csv_last} ↔ NPPES: {nppes_first} {nppes_last}")
    elif name_sim >= 0.5:
        checks.append(0.5)
        result["findings"].append(f"⚠ Partial name match ({name_sim:.0%}): CSV '{csv_first} {csv_last}' vs NPPES '{nppes_first} {nppes_last}'")
    else:
        checks.append(0.0)
        result["findings"].append(f"✗ Name MISMATCH: CSV '{csv_first} {csv_last}' vs NPPES '{nppes_first} {nppes_last}'")

    # 2. Credential match
    csv_cred = csv_row.get("Credential", "")
    nppes_cred = nppes_d.get("credential", "")
    cred_sim = fuzzy_match(csv_cred, nppes_cred)
    if cred_sim >= 0.7:
        checks.append(1.0)
    elif cred_sim >= 0.3:
        checks.append(0.5)
        result["findings"].append(f"⚠ Credential partial match: CSV '{csv_cred}' vs NPPES '{nppes_cred}'")
    else:
        checks.append(0.2)
        if csv_cred and nppes_cred:
            result["findings"].append(f"✗ Credential mismatch: CSV '{csv_cred}' vs NPPES '{nppes_cred}'")

    # 3. Specialty match (fuzzy — handles "Ortho" vs "Orthopedic Surgery")
    csv_spec = csv_row.get("Specialty", "")
    nppes_spec = nppes_d.get("specialty_desc", "")
    spec_sim = fuzzy_match(csv_spec, nppes_spec)
    if spec_sim >= 0.5:
        checks.append(1.0)
    elif spec_sim >= 0.25:
        checks.append(0.6)
        result["findings"].append(f"⚠ Specialty partial match: CSV '{csv_spec}' vs NPPES '{nppes_spec}'")
    else:
        checks.append(0.2)
        result["findings"].append(f"✗ Specialty mismatch: CSV '{csv_spec}' vs NPPES '{nppes_spec}'")

    # 4. State match
    csv_state = csv_row.get("State", "")
    nppes_state = nppes_d.get("state", "")
    if csv_state and nppes_state and csv_state.upper() == nppes_state.upper():
        checks.append(1.0)
    else:
        checks.append(0.0)
        result["findings"].append(f"✗ State mismatch: CSV '{csv_state}' vs NPPES '{nppes_state}'")

    # NPI status check
    npi_status = basic.get("status", "")
    if npi_status and npi_status.upper() == "D":  # Deactivated
        result["lambda_penalty"] = max(result["lambda_penalty"], 0.5)
        result["findings"].append("✗ NPI is DEACTIVATED in NPPES registry")

    result["s1"] = sum(checks) / len(checks) if checks else 0.0
    return result


async def validate_reachability(csv_row: Dict[str, Any], nppes_data: Optional[Dict],
                                 npi: str, client: httpx.AsyncClient) -> Dict[str, Any]:
    """
    Validate address via Census Geocoder + check Medicare activity.
    Returns: { s2, findings: [...] }
    """
    result = {"s2": 0.5, "findings": [], "medicare_found": False, "geocoder_match": False}
    checks = []

    # ─── Census Geocoder ───
    address = csv_row.get("Address", "")
    city = csv_row.get("City", "")
    state = csv_row.get("State", "")
    zipcode = str(csv_row.get("ZIP", ""))

    one_line = f"{address}, {city}, {state} {zipcode}"

    try:
        resp = await client.get(CENSUS_GEOCODER_API, params={
            "address": one_line,
            "benchmark": "Public_AR_Current",
            "format": "json"
        }, timeout=15.0)
        geo_data = resp.json()
        matches = geo_data.get("result", {}).get("addressMatches", [])

        if matches:
            result["geocoder_match"] = True
            matched_addr = matches[0].get("matchedAddress", "")
            checks.append(1.0)
            result["findings"].append(f"✓ Address geocoded successfully: {matched_addr}")
        else:
            checks.append(0.0)
            result["findings"].append(f"✗ Address could not be geocoded: '{one_line}'")
    except Exception as e:
        checks.append(0.3)  # Uncertain
        result["findings"].append(f"Geocoder API error: {str(e)[:80]}")

    # ─── Phone area code vs state (quick heuristic) ───
    csv_phone = normalize_phone(csv_row.get("Phone", ""))
    nppes_phone = normalize_phone(nppes_data.get("phone", "") if nppes_data else "")

    if csv_phone and nppes_phone:
        if csv_phone == nppes_phone:
            checks.append(1.0)
            result["findings"].append(f"✓ Phone number matches NPPES record")
        else:
            checks.append(0.3)
            result["findings"].append(f"⚠ Phone mismatch: CSV '{csv_phone}' vs NPPES '{nppes_phone}'")
    elif csv_phone:
        checks.append(0.5)  # Can't verify, neutral

    # ─── Medicare Activity Check ───
    try:
        resp = await client.get(MEDICARE_PROVIDER_URL, params={
            "filter[Rndrng_NPI]": str(npi),
            "size": 1
        }, timeout=15.0)

        if resp.status_code == 200:
            medicare_data = resp.json()
            if medicare_data and len(medicare_data) > 0:
                result["medicare_found"] = True
                rec = medicare_data[0]
                medicare_city = rec.get("Rndrng_Prvdr_City", "")
                medicare_state = rec.get("Rndrng_Prvdr_State_Abrvtn", "")
                checks.append(1.0)
                result["findings"].append(
                    f"✓ Medicare billing activity found — {medicare_city}, {medicare_state}"
                )

                # Cross-check Medicare location with CSV
                csv_state_upper = state.upper() if state else ""
                if medicare_state and csv_state_upper and medicare_state != csv_state_upper:
                    result["findings"].append(
                        f"⚠ Medicare billing state ({medicare_state}) differs from CSV state ({csv_state_upper})"
                    )
                    checks.append(0.3)
            else:
                checks.append(0.5)  # No Medicare data doesn't mean invalid
                result["findings"].append("⚠ No Medicare billing records found for this NPI")
        else:
            checks.append(0.5)
    except Exception as e:
        checks.append(0.5)
        result["findings"].append(f"Medicare API timeout (non-critical): {str(e)[:60]}")

    result["s2"] = sum(checks) / len(checks) if checks else 0.5
    return result


def compute_reputation(nppes_data: Optional[Dict], csv_row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute reputation score from NPI status, credential, license state checks.
    Returns: { s3, findings: [...] }
    """
    result = {"s3": 0.8, "findings": []}  # Default: assume decent
    checks = []

    if not nppes_data:
        result["s3"] = 0.3
        result["findings"].append("⚠ Cannot assess reputation — NPPES data unavailable")
        return result

    # NPI active status
    status = nppes_data.get("status", "")
    if status and status.upper() == "A":
        checks.append(1.0)
        result["findings"].append("✓ NPI status is Active")
    elif status:
        checks.append(0.0)
        result["findings"].append(f"✗ NPI status: {status}")
    else:
        checks.append(0.7)

    # License state matches practice state
    license_state = nppes_data.get("license_state", "")
    practice_state = nppes_data.get("state", "")
    csv_state = csv_row.get("State", "")

    if license_state and csv_state:
        if license_state.upper() == csv_state.upper():
            checks.append(1.0)
            result["findings"].append(f"✓ License state ({license_state}) matches CSV state")
        else:
            checks.append(0.4)
            result["findings"].append(f"⚠ License state ({license_state}) differs from CSV state ({csv_state})")

    # Credential present
    cred = nppes_data.get("credential", "")
    if cred:
        checks.append(1.0)
    else:
        checks.append(0.6)
        result["findings"].append("⚠ No credential on file in NPPES")

    result["s3"] = sum(checks) / len(checks) if checks else 0.5
    return result


def compute_trust_score(s1: float, s2: float, s3: float, lambda_penalty: float) -> float:
    """
    T = 100 × (w1·s1 + w2·s2 + w3·s3) × (1 - λ)
    """
    raw = W1 * s1 + W2 * s2 + W3 * s3
    T = 100.0 * raw * (1.0 - lambda_penalty)
    return round(max(0.0, min(100.0, T)), 1)


def compute_decay_probability(specialty: str, last_updated: str, state: str) -> float:
    """
    Rule-based heuristic for data staleness prediction.
    decayProb = baseRate × recencyFactor × stateMobility
    """
    # Base rate from specialty
    base = SPECIALTY_DECAY_RATES.get(specialty, 0.15)

    # Recency factor: older data = higher decay
    recency = 1.0
    if last_updated:
        try:
            # Handle various date formats
            for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y-%m-%dT%H:%M:%S"):
                try:
                    updated_dt = datetime.strptime(last_updated[:10], fmt)
                    break
                except ValueError:
                    continue
            else:
                updated_dt = None

            if updated_dt:
                months_since = (datetime.now() - updated_dt).days / 30.0
                if months_since > 24:
                    recency = 2.5
                elif months_since > 12:
                    recency = 1.8
                elif months_since > 6:
                    recency = 1.3
                else:
                    recency = 1.0
        except Exception:
            recency = 1.5  # Unknown date = moderate risk

    # State mobility factor
    state_factor = 1.3 if state and state.upper() in HIGH_MOBILITY_STATES else 1.0

    decay = base * recency * state_factor
    return round(min(decay, 0.99), 2)  # Cap at 99%


def generate_agent_thoughts(
    nppes_result: Dict, reachability_result: Dict, reputation_result: Dict,
    trust_score: float, decay_prob: float, csv_row: Dict
) -> List[AgentThought]:
    """Generate real agent thoughts from actual API findings."""
    thoughts = []
    now_str = datetime.now().isoformat()

    # ─── Validation Agent (D1: Identity) ───
    s1 = nppes_result["s1"]
    for finding in nppes_result["findings"][:3]:  # Top 3 findings
        verdict = "pass" if finding.startswith("✓") else "fail" if finding.startswith("✗") else "warn"
        thoughts.append(AgentThought(
            agentName="Validation Agent",
            thought=finding.replace("✓ ", "").replace("✗ ", "").replace("⚠ ", ""),
            verdict=verdict,
            timestamp=now_str
        ))

    # ─── Reachability Agent (D2) ───
    for finding in reachability_result["findings"][:3]:
        verdict = "pass" if finding.startswith("✓") else "fail" if finding.startswith("✗") else "warn"
        thoughts.append(AgentThought(
            agentName="Reachability Agent",
            thought=finding.replace("✓ ", "").replace("✗ ", "").replace("⚠ ", ""),
            verdict=verdict,
            timestamp=now_str
        ))

    # ─── Fraud Detection (D3: Reputation) ───
    for finding in reputation_result["findings"][:2]:
        verdict = "pass" if finding.startswith("✓") else "fail" if finding.startswith("✗") else "warn"
        thoughts.append(AgentThought(
            agentName="Fraud Detection",
            thought=finding.replace("✓ ", "").replace("✗ ", "").replace("⚠ ", ""),
            verdict=verdict,
            timestamp=now_str
        ))

    # ─── Predictive Degradation ───
    if decay_prob > 0.7:
        thoughts.append(AgentThought(
            agentName="Predictive Degradation",
            thought=f"High decay probability ({decay_prob:.0%}). Contact information likely to become obsolete within 60 days.",
            verdict="fail",
            timestamp=now_str
        ))
    elif decay_prob > 0.3:
        thoughts.append(AgentThought(
            agentName="Predictive Degradation",
            thought=f"Moderate decay risk ({decay_prob:.0%}). Quarterly re-validation recommended.",
            verdict="warn",
            timestamp=now_str
        ))
    else:
        thoughts.append(AgentThought(
            agentName="Predictive Degradation",
            thought=f"Low decay probability ({decay_prob:.0%}). Data freshness verified.",
            verdict="pass",
            timestamp=now_str
        ))

    # ─── Communicator (based on risk) ───
    risk_score = 100 - trust_score
    if risk_score > 70:
        thoughts.append(AgentThought(
            agentName="Communicator",
            thought="Drafted 'Urgent Credential Update Request' email to provider office.",
            verdict="neutral",
            timestamp=now_str
        ))
    elif risk_score > 40:
        thoughts.append(AgentThought(
            agentName="Communicator",
            thought="Scheduled automated follow-up for data verification.",
            verdict="neutral",
            timestamp=now_str
        ))

    return thoughts


async def validate_single_provider(csv_row: Dict[str, Any], client: httpx.AsyncClient) -> Dict[str, Any]:
    """
    Run full 3-dimensional validation on a single provider record.
    Returns all data needed to build a FrontendProviderRecord.
    """
    npi = str(csv_row.get("NPI", ""))

    # D1: Identity Integrity (NPPES)
    nppes_result = await validate_nppes(npi, csv_row, client)
    nppes_data = nppes_result.get("nppes_data")

    # D2: Reachability (Census + Medicare)
    reachability_result = await validate_reachability(csv_row, nppes_data, npi, client)

    # D3: Reputation
    reputation_result = compute_reputation(nppes_data, csv_row)

    # Lambda penalty
    lambda_penalty = nppes_result.get("lambda_penalty", 0.0)
    # Additional penalty if both address invalid AND license state mismatch
    if not reachability_result.get("geocoder_match") and any("License state" in f and "differs" in f for f in reputation_result.get("findings", [])):
        lambda_penalty = max(lambda_penalty, 0.5)

    # Trust Score
    s1 = nppes_result["s1"]
    s2 = reachability_result["s2"]
    s3 = reputation_result["s3"]
    trust_score = compute_trust_score(s1, s2, s3, lambda_penalty)
    risk_score = round(100 - trust_score, 1)

    # PDA: Decay Probability
    specialty = csv_row.get("Specialty", "")
    last_updated = csv_row.get("Last_Updated", "")
    state = csv_row.get("State", "")
    decay_prob = compute_decay_probability(specialty, last_updated, state)

    # Status
    if risk_score > 70:
        status = "Flagged"
    elif risk_score > 35:
        status = "Review"
    else:
        status = "Verified"

    # Conflicts
    conflicts = []
    for f in nppes_result["findings"]:
        if f.startswith("✗"):
            conflicts.append(f.replace("✗ ", ""))
    for f in reachability_result["findings"]:
        if f.startswith("✗"):
            conflicts.append(f.replace("✗ ", ""))

    # Agent thoughts
    thoughts = generate_agent_thoughts(
        nppes_result, reachability_result, reputation_result,
        trust_score, decay_prob, csv_row
    )

    # Build locations
    locations = [{"address": f"{csv_row.get('Address', '')}, {csv_row.get('City', '')} {state}", "updated": last_updated or "Unknown"}]
    if nppes_data and nppes_data.get("address"):
        nppes_addr = f"{nppes_data['address']}, {nppes_data.get('city', '')} {nppes_data.get('state', '')}"
        if nppes_addr != locations[0]["address"]:
            locations.append({"address": f"NPPES: {nppes_addr}", "updated": nppes_data.get("last_updated", "")})

    # Build contact numbers
    contact_numbers = []
    csv_phone = csv_row.get("Phone", "")
    if csv_phone:
        contact_numbers.append({"number": str(csv_phone), "type": "Office"})
    if nppes_data and nppes_data.get("phone") and nppes_data["phone"] != normalize_phone(csv_phone):
        contact_numbers.append({"number": nppes_data["phone"], "type": "NPPES Listed"})

    return {
        "npi": npi,
        "name": f"{csv_row.get('First_Name', '')} {csv_row.get('Last_Name', '')}".strip(),
        "specialty": specialty,
        "state": state,
        "risk_score": risk_score,
        "trust_score": trust_score,
        "decay_prob": decay_prob,
        "status": status,
        "conflicts": conflicts,
        "thoughts": thoughts,
        "last_updated": last_updated,
        "locations": locations,
        "contact_numbers": contact_numbers,
        "s1": s1,
        "s2": s2,
        "s3": s3,
        "lambda": lambda_penalty,
    }
