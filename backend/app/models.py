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
    # Raw data from documents can be dumped here
    raw_data: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)

class ValidationResult(BaseModel):
    npi_valid: bool = False
    license_valid: bool = False
    oig_excluded: bool = False
    sources_checked: List[str] = Field(default_factory=list)
    details: str = ""

class FraudAnalysis(BaseModel):
    risk_score: float = 0.0
    risk_level: FraudRiskLevel = FraudRiskLevel.UNKNOWN
    flagged_patterns: List[str] = Field(default_factory=list)

class DegradationPrediction(BaseModel):
    predicted_degradation_date: Optional[datetime] = None
    confidence_score: float = 0.0

class BusinessImpact(BaseModel):
    estimated_savings: float = 0.0
    roi_multiplier: float = 0.0
    notes: str = ""

# --- Agent State (LangGraph) ---

class MainAgentState(BaseModel):
    job_id: str
    provider_data: ProviderRecord
    validation_result: Optional[ValidationResult] = None
    fraud_analysis: Optional[FraudAnalysis] = None
    degradation_prediction: Optional[DegradationPrediction] = None
    business_impact: Optional[BusinessImpact] = None
    errors: List[str] = Field(default_factory=list)
    communication_required: bool = False

    class Config:
        arbitrary_types_allowed = True

# --- Frontend Integration Models ---

class ChartDataPoint(BaseModel):
    name: str
    value: float
    secondaryValue: Optional[float] = None

class AgentThought(BaseModel):
    agentName: str
    thought: str
    verdict: str  # pass, fail, warn, neutral
    timestamp: str

class FrontendProviderRecord(BaseModel):
    id: str
    name: str
    npi: str
    specialty: str
    riskScore: float
    decayProb: float
    status: str # Verified, Flagged, Review
    conflicts: List[str]
    agentThoughts: List[AgentThought]
    agentThoughts: List[AgentThought]
    lastUpdated: str
    state: str # US State Code

class AnalysisResult(BaseModel):
    """Matches the frontend expected format."""
    roi: float
    fraudRiskScore: float
    providersProcessed: int
    discrepanciesFound: int
    timelineData: List[ChartDataPoint]
    riskDistribution: List[ChartDataPoint]
    records: List[FrontendProviderRecord]
    agentLogs: List[Dict[str, str]]
    summary: str
