from ..models import MainAgentState, DegradationPrediction, BusinessImpact
from datetime import datetime, timedelta
import asyncio
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

async def predictive_agent_node(state: MainAgentState) -> dict:
    """
    Predictive Degradation Agent:
    Uses Scikit-Learn Linear Regression to predict data validity score.
    """
    print(f"[{state.job_id}] [Predictive Agent] Estimating data decay with Sklearn...")
    
    # 1. Prepare Training Data (Mock historical decline of similar provider data)
    # X = Months passed since verification
    # y = Validity Score (1.0 = Perfect, 0.0 = Invalid)
    # We assume linear degradation for simplicity in this demo model
    X_train = np.array([[0], [12], [24]]) # 0 months, 1 year, 2 years
    y_train = np.array([1.0, 0.9, 0.5])   # Degrades to 50% after 2 years
    
    # 2. Fit Model
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # 3. Predict Future (Next 12 months)
    today = datetime.now()
    expiry_date = today + timedelta(days=365) # Approx
    
    decay_curve = []
    
    for i in range(12):
        month_date = today + timedelta(days=30*i)
        month_str = month_date.strftime("%Y-%m")
        
        # Predict for month i
        prediction = model.predict(np.array([[i]]))
        score = max(0.0, min(1.0, prediction[0]))
        
        # Add penalty if near specific expiry date (sudden drop logic)
        days_to_expiry = (expiry_date - month_date).days
        if days_to_expiry < 30:
             score *= 0.5 # Sharp drop
             
        decay_curve.append({month_str: round(score, 2)})

    return {
        "degradation_prediction": DegradationPrediction(
            predicted_degradation_date=expiry_date,
            confidence_score=0.88, # static for linear model quality
            recommended_revalidation_date=expiry_date - timedelta(days=60),
            decay_probability_curve=decay_curve
        )
    }

async def business_agent_node(state: MainAgentState) -> dict:
    """
    Business Impact Agent:
    The 'money' agent that calculates financial value and real-time ROI.
    """
    print(f"[{state.job_id}] [Business Agent] Calculating ROI...")
    await asyncio.sleep(0.1)
    
    savings = 0.0
    notes = "Routine validation."
    
    # ROI Logic:
    # Base admin cost per provider verification manually: $50
    # Cost of automated verification: $0.50
    # Cost of fraud incident: $25,000
    # Cost of data error fixing (claims denial): $500
    
    base_savings = 49.50
    final_savings = base_savings
    
    if state.fraud_analysis and state.fraud_analysis.risk_level == "HIGH":
        final_savings += 25000.00 
        notes = "High-risk fraud prevented + Admin Time Saved."
    
    if state.validation_result and (not state.validation_result.npi_valid or not state.validation_result.is_consistent):
         final_savings += 500.00
         notes = "Data error corrected early + Admin Time Saved."
         
    # ROI Multiplier = Value / Cost
    # Assuming internal cost of this run is $0.50
    cost_of_run = 0.50
    roi = final_savings / cost_of_run
        
    return {
        "business_impact": BusinessImpact(
            estimated_savings=round(final_savings, 2),
            roi_multiplier=round(roi, 1),
            notes=notes
        )
    }
