import random
from typing import Dict, Any, List
from datetime import datetime, timedelta

class ValidationAgent:
    name = "validation_agent"
    
    def __init__(self):
        # Simulation of connected sources
        self.sources = ["NPI Registry", "OIG Exclusions", "State Medical Board", "Google Maps API", "DEA Database"]

    def validate_provider(self, provider_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates provider data against multiple (mocked) external sources.
        """
        results = {
            "is_valid": True,
            "overall_confidence": 1.0,
            "field_scores": {},
            "flags": [],
            "source_checks": []
        }
        
        # 1. NPI Validation
        npi = provider_data.get("npi", "")
        npi_score = 1.0
        if not npi or len(str(npi)) != 10:
            results["flags"].append("Invalid NPI format")
            npi_score = 0.0
            results["is_valid"] = False
        else:
             # Randomly simulate NPI not found for demonstration if NPI ends in '00'
             if str(npi).endswith("00"):
                 results["flags"].append("NPI not found in registry")
                 npi_score = 0.1
                 results["is_valid"] = False
        
        results["field_scores"]["npi"] = npi_score
        results["source_checks"].append({"source": "NPI Registry", "status": "Verified" if npi_score > 0.8 else "Failed"})

        # 2. License Validation
        license_num = provider_data.get("license_number", "")
        lic_score = 1.0
        # Simulate expired license if it ends with 'EXP'
        if str(license_num).endswith("EXP"):
             results["flags"].append("License Expired")
             lic_score = 0.0
             results["is_valid"] = False
        
        results["field_scores"]["license_number"] = lic_score
        results["source_checks"].append({"source": "State Medical Board", "status": "Active" if lic_score > 0.8 else "Inactive/Expired"})

        # 3. Address Validation (Google Maps Mock)
        address = provider_data.get("address", "")
        addr_score = 0.95 # Usually high confidence
        if "Fake St" in address:
            results["flags"].append("Address does not exist")
            addr_score = 0.2
            results["is_valid"] = False
            
        results["field_scores"]["address"] = addr_score
        results["source_checks"].append({"source": "Google Maps API", "status": "Verified" if addr_score > 0.8 else "Not Found"})
        
        # 4. Sanctions Check (OIG)
        # Randomly flag if name is "John Doe"
        name = provider_data.get("name", "")
        if name.lower() == "john doe":
            results["flags"].append("Potential Match in OIG Exclusion List")
            results["is_valid"] = False
            results["source_checks"].append({"source": "OIG Exclusions", "status": "MATCH FOUND"})
        else:
            results["source_checks"].append({"source": "OIG Exclusions", "status": "Clear"})

        # Calculate overall confidence
        scores = list(results["field_scores"].values())
        if scores:
            results["overall_confidence"] = sum(scores) / len(scores)
        
        return results
