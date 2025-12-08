from typing import List, Dict, Any
import statistics

class BatchBusinessAgent:
    """
    Analyzes a collection of processed records to determine:
    - Total ROI / Savings
    - Portfolio Risk Score
    - Top Discrepancy Patterns
    """
    
    def analyze_batch(self, jobs_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        print("[BatchBusinessAgent] Starting collective analysis...")
        
        total_savings = 0.0
        risk_scores = []
        high_risk_count = 0
        discrepancy_types = {}
        
        for job in jobs_data:
             # jobs_data contains raw DB rows (dicts). result_state is a JSON string or dict.
            state = job.get("result_state")
            if not state: 
                continue
                
            # If state is dict (handled by main.py logic before passed here) or we need to parse if string
            if isinstance(state, str):
                import json
                try:
                    state = json.loads(state)
                except:
                    continue
            elif not isinstance(state, dict):
                continue

            # 1. Savings
            if state.get("business_impact"):
                total_savings += state["business_impact"].get("estimated_savings", 0)
            
            # 2. Risk
            if state.get("fraud_analysis"):
                score = state["fraud_analysis"].get("risk_score", 0)
                risk_scores.append(score)
                if state["fraud_analysis"].get("risk_level") == "HIGH":
                    high_risk_count += 1
            
            # 3. Discrepancies
            if state.get("validation_result") and not state["validation_result"].get("is_consistent"):
                conflicts = state["validation_result"].get("conflicts", [])
                for c in conflicts:
                    desc = c.get("description", "Unknown Issue")
                    discrepancy_types[desc] = discrepancy_types.get(desc, 0) + 1

        # --- Aggregate Calculations ---
        
        avg_risk = statistics.mean(risk_scores) if risk_scores else 0
        
        # Portfolio Risk Logic: 
        # If > 30% of batch is High Risk, multiply portfolio risk by 1.5 (Cluster Risk)
        portfolio_risk_modifier = 1.0
        if jobs_data and (high_risk_count / len(jobs_data)) > 0.3:
            portfolio_risk_modifier = 1.5
            
        portfolio_risk_score = min(100, avg_risk * portfolio_risk_modifier)
        
        # Top Patterns
        sorted_patterns = sorted(discrepancy_types.items(), key=lambda x: x[1], reverse=True)[:3]
        
        result = {
            "total_estimated_savings": round(total_savings, 2),
            "portfolio_risk_score": round(portfolio_risk_score, 1),
            "high_risk_percentage": round((high_risk_count / len(jobs_data) * 100), 1) if jobs_data else 0,
            "top_discrepancy_patterns": [p[0] for p in sorted_patterns],
            "analysis_timestamp": str(datetime.now())
        }
        
        print(f"[BatchBusinessAgent] Analysis Complete: {result}")
        return result

from datetime import datetime
batch_business_agent = BatchBusinessAgent()
