from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

# --- Enums ---
class ValidationStatus(str, Enum):
    PENDING = "PENDING"
    VALID = "VALID"
    INVALID = "INVALID"
    NEEDS_REVIEW = "NEEDS_REVIEW"

class FraudRiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    UNKNOWN = "UNKNOWN"

# --- Pydantic Models (API Layer) ---

class ProviderRecord(BaseModel):
    """Represents the core provider data to be validated."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    npi: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization_name: Optional[str] = None
    license_number: Optional[str] = None
    license_state: Optional[str] = None
    specialty: Optional[str] = "General Practice" # Default for demo
    last_verified: Optional[datetime] = None # When was this data last confirmed real?
    # Raw data from documents can be dumped here
    raw_data: Dict[str, Any] = Field(default_factory=dict)
    file_path: Optional[str] = None # Path to the document file (PDF/Image)
    
    timestamp: datetime = Field(default_factory=datetime.now)

class ParsedData(BaseModel):
    """Data extracted from documents via VLM/OCR."""
    extracted_npi: Optional[str] = None
    extracted_name: Optional[str] = None
    extracted_address: Optional[str] = None
    confidence_score: float = 0.0
    
class ConflictDetails(BaseModel):
    """Details of a conflict found by the Judge."""
    field: str
    entry_value: str
    document_value: str
    description: str

class ValidationResult(BaseModel):
    """Output from the Validating Agent (Judge)."""
    is_consistent: bool = False
    conflicts: List[ConflictDetails] = Field(default_factory=list)
    npi_valid: bool = False
    license_valid: bool = False
    oig_excluded: bool = False
    sources_checked: List[str] = Field(default_factory=list)
    details: str = ""

class FraudAnalysis(BaseModel):
    """Output from the Fraud Detection Agent."""
    risk_score: float = 0.0  # 0 to 100
    risk_level: FraudRiskLevel = FraudRiskLevel.UNKNOWN
    flagged_patterns: List[str] = Field(default_factory=list)

class DegradationPrediction(BaseModel):
    """Output from the Predictive Degradation Agent."""
    predicted_degradation_date: Optional[datetime] = None
    confidence_score: float = 0.0
    recommended_revalidation_date: Optional[datetime] = None
    decay_probability_curve: List[Dict[str, float]] = Field(default_factory=list) # List of {month: prob}

class BusinessImpact(BaseModel):
    """Output from the Business Impact Agent."""
    estimated_savings: float = 0.0
    roi_multiplier: float = 0.0
    notes: str = ""

class GraphicalData(BaseModel):
    """Data prepared for frontend visualization."""
    geographic_distribution: List[Dict[str, Any]] = Field(default_factory=list) # Lat/Lon/Weight/ID
    summary_stats: Dict[str, Any] = Field(default_factory=dict)

# --- Agent State (LangGraph) ---

class MainAgentState(BaseModel):
    """The central state object passed between nodes in LangGraph."""
    job_id: str
    provider_data: ProviderRecord
    
    # New: Parsed data from documents
    parsed_data: Optional[ParsedData] = None

    # Validation outputs
    validation_result: Optional[ValidationResult] = None
    fraud_analysis: Optional[FraudAnalysis] = None
    degradation_prediction: Optional[DegradationPrediction] = None
    business_impact: Optional[BusinessImpact] = None
    graphical_data: Optional[GraphicalData] = None
    
    # Flags to control flow
    errors: List[str] = Field(default_factory=list)
    processing_complete: bool = False
    communication_required: bool = False
    
    class Config:
        arbitrary_types_allowed = True
