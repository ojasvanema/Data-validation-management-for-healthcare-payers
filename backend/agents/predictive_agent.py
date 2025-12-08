import random
from datetime import datetime, timedelta
from typing import Dict, Any

class PredictiveAgent:
    name = "predictive_agent"
    
    def predict_risk(self, provider_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts the risk of data becoming outdated or incorrect.
        """
        # Feature extraction (mock)
        last_update = provider_data.get("last_updated", datetime.now().strftime("%Y-%m-%d"))
        specialty = provider_data.get("specialty", "General")
        
        try:
            last_date = datetime.strptime(last_update, "%Y-%m-%d")
            days_since_update = (datetime.now() - last_date).days
        except:
            days_since_update = 365 # Default to old if invalid format

        # Logic: 
        # - Data older than 90 days increases risk.
        # - Certain specialties have higher turnover (e.g. Residents).
        
        risk_score = 0.1 # Base risk
        risk_factors = []
        
        if days_since_update > 90:
            risk_score += 0.4
            risk_factors.append("Data stale (>90 days)")
        elif days_since_update > 30:
            risk_score += 0.1
            
        if "resident" in specialty.lower() or "student" in specialty.lower():
            risk_score += 0.3
            risk_factors.append("High turnover specialty")
            
        # Random perturbation for demo "AI" feel
        risk_score += random.uniform(-0.05, 0.05)
        risk_score = max(0.0, min(1.0, risk_score))
        
        prediction = {
            "risk_score": round(risk_score, 2),
            "risk_level": "High" if risk_score > 0.7 else ("Medium" if risk_score > 0.3 else "Low"),
            "predicted_degradation_date": (datetime.now() + timedelta(days=int(30 * (1-risk_score)))).strftime("%Y-%m-%d"),
            "factors": risk_factors
        }
        
        return prediction
