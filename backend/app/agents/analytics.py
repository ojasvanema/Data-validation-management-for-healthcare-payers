from ..models import MainAgentState, DegradationPrediction, BusinessImpact
from datetime import datetime, timedelta
import asyncio
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

# Demo Constants
SPECIALTY_VOLATILITY = {
    "Surgery": 0.8,    # High drift (equip, privileges)
    "Radiology": 0.6,
    "General Practice": 0.3, # Low drift
    "Dermatology": 0.2
}

SPECIALTY_COST_TIER = {
    "Surgery": 1.5,
    "Radiology": 1.4,
    "Cardiology": 1.3,
    "General Practice": 1.0
}

async def predictive_agent_node(state: MainAgentState) -> dict:
    """
    Predictive Degradation Agent:
    Dynamically generates a "Synthetic History" based on the provider's profile to 
    train a unique regression model for this specific case.
    """
    print(f"[{state.job_id}] [Predictive Agent] Generating synthetic history for {state.provider_data.specialty}...")
    
    specialty = state.provider_data.specialty or "General Practice"
    volatility = SPECIALTY_VOLATILITY.get(specialty, 0.4)
    
    # 1. Generate Synthetic Training Data
    # We simulate 3 past data points (Audit History)
    # Volatility determines how fast their data "decayed" in the past
    
    X_train = np.array([[0], [12], [24]]) # 0 months, 1 year, 2 years ago
    
    # Base decay formula: 1.0 - (months * volatility_factor)
    # Random noise added to make it look "real"
    slopes = [1.0, 0.95 - (0.1 * volatility), 0.9 - (0.2 * volatility)]
    y_train = np.array(slopes)
    
    if state.provider_data.last_verified:
        # If data is old, the starting point is already lower
        age_days = (datetime.now() - state.provider_data.last_verified).days
        age_factor = max(0, min(0.5, age_days / 365.0 * 0.2)) # degrade up to 20% based on age
        y_train = y_train - age_factor

    # 2. Train Real Model
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # 3. Predict Future (Next 12 months)
    today = datetime.now()
    expiry_date = today + timedelta(days=365)
    
    decay_curve = []
    current_score = 1.0
    
    for i in range(12):
        # Predict
        prediction = model.predict(np.array([[i + 24]]))  # We are at month 24 (relative to start of history)
        
        # Add "Shock Event" logic
        # 5% chance of regulatory change event dropping score for high-volatility specialties
        if i > 6 and volatility > 0.5 and i % 5 == 0:
             prediction -= 0.15

        score = max(0.05, min(1.0, prediction[0]))
        
        # Format for chart
        month_date = today + timedelta(days=30*i)
        month_str = month_date.strftime("%Y-%m")
        decay_curve.append({month_str: round(score, 2)})
        
        if i == 0: current_score = score

    # Heuristic Revalidation Date: When score drops below 0.7
    reval_date = expiry_date
    for entry in decay_curve:
        for date_str, val in entry.items():
            if val < 0.7:
                 # rough conversion
                 reval_date = datetime.strptime(date_str, "%Y-%m")
                 break

    return {
        "degradation_prediction": DegradationPrediction(
            predicted_degradation_date=reval_date,
            confidence_score=round(0.85 + (0.1 if volatility < 0.5 else -0.1), 2),
            recommended_revalidation_date=reval_date - timedelta(days=30),
            decay_probability_curve=decay_curve
        )
    }

async def business_agent_node(state: MainAgentState) -> dict:
    """
    Business Impact Agent:
    Calculates dynamic ROI based on Provider Tier and Risk Probability.
    """
    print(f"[{state.job_id}] [Business Agent] Calculating financial impact metrics...")
    
    specialty = state.provider_data.specialty or "General Practice"
    tier_multiplier = SPECIALTY_COST_TIER.get(specialty, 1.0)
    
    # Base Metrics
    manual_cost = 50.00 * tier_multiplier # Specialized doctors take longer to verify manually
    auto_cost = 0.50 # API cost is distinct
    
    notes = [f"Automated verification for {specialty}."]
    
    # 1. Error Prevention Value
    # If the other agent found an error, we saved the cost of a claim denial
    claim_denial_cost = 500.00 * tier_multiplier
    prevention_savings = 0.0
    
    if state.validation_result and (not state.validation_result.npi_valid or not state.validation_result.is_consistent):
         prevention_savings = claim_denial_cost
         notes.append("Prevented potential claim denial due to data mismatch.")

    # 2. Fraud Prevention Value
    # Probability-weighted savings
    # Tuned for realistic demo numbers (Very Conservative)
    fraud_incident_cost = 5000.00 
    fraud_savings = 0.0
    
    if state.fraud_analysis:
        # Only claim savings if we actually flagged something significant
        if state.fraud_analysis.risk_level == "HIGH":
            fraud_savings = fraud_incident_cost * 0.6 # 60% confidence for high risk
        elif state.fraud_analysis.risk_level == "MEDIUM":
            fraud_savings = fraud_incident_cost * 0.03 # Very conservative 3% for medium
        else:
            fraud_savings = 0 
            
        if state.fraud_analysis.risk_level == "HIGH":
            notes.append("CRITICAL: High-risk fraud pattern mitigated.")

    # Total Savings
    # (Manual Cost - Auto Cost) + Prevention + Fraud Avoidance
    operational_savings = manual_cost - auto_cost
    total_estimated_savings = operational_savings + prevention_savings + fraud_savings
    
    roi_multiplier = total_estimated_savings / auto_cost
        
    return {
        "business_impact": BusinessImpact(
            estimated_savings=round(total_estimated_savings, 2),
            roi_multiplier=round(roi_multiplier, 1),
            notes=" ".join(notes)
        )
    }
