from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class AgentType(str, Enum):
    GUARDRAIL = "GuardrailSecurityAgent"
    SUPERVISOR = "SupervisorAgent"
    TRIAGE = "TriageAgent"
    KNOWLEDGE = "KnowledgeAgent"
    DIAGNOSTIC = "DiagnosticAgent"
    ACTION_PLANNER = "ActionPlannerAgent"
    HITL_GATEKEEPER = "HitlGatekeeper"


class ActionType(str, Enum):
    AUTO_RESOLVE = "AUTO_RESOLVE"
    REQUIRE_HUMAN_APPROVAL = "REQUIRE_HUMAN_APPROVAL"
    ESCALATE = "ESCALATE"
    REQUEST_MORE_INFO = "REQUEST_MORE_INFO"

class TicketAnalysisRequest(BaseModel):
    ticketId: Optional[int] = None
    ticketNumber: Optional[str] = "INC-2026-XXXX"
    title: str
    description: str
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = "NEW"
    requesterEmail: Optional[str] = "user@company.com"
    requesterName: Optional[str] = "Employee"
    createdAt: Optional[str] = None

class TrajectoryStep(BaseModel):
    stepIndex: int
    agent: str
    action: str
    thought: str
    toolCalled: Optional[str] = None
    observation: Optional[str] = None
    timestamp: str

class KnowledgeMatch(BaseModel):
    articleId: str
    title: str
    relevanceScore: float
    recommendedSolution: str
    rootCause: str
    category: str

class DiagnosticResult(BaseModel):
    toolName: str
    status: str
    details: Dict[str, Any]

class GuardrailViolation(BaseModel):
    rule: str
    severity: str
    details: str
    actionTaken: str

class GuardrailReport(BaseModel):
    status: str = "PASSED"  # PASSED, SANITIZED, BLOCKED
    riskScore: float = 0.0
    sanitizedTitle: str = ""
    sanitizedDescription: str = ""
    violations: List[GuardrailViolation] = []
    promptInjectionDetected: bool = False
    piiRedacted: bool = False
    secretsRedacted: bool = False
    destructiveCommandsBlocked: bool = False

class MultiAgentAnalysisResponse(BaseModel):
    ticketNumber: str
    languageDetected: str
    predictedCategory: str
    calculatedPriority: str
    urgencyScore: float
    confidenceScore: float
    actionType: ActionType
    requiresHumanApproval: bool
    rootCauseAnalysis: str
    proposedResolution: str
    suggestedTeam: str
    slaBreachRisk: str
    trajectory: List[TrajectoryStep]
    knowledgeMatches: List[KnowledgeMatch]
    diagnosticResults: List[DiagnosticResult]
    guardrailReport: Optional[GuardrailReport] = None


class TriageQuickRequest(BaseModel):
    title: str
    description: str

class TriageQuickResponse(BaseModel):
    category: str
    priority: str
    language: str
    urgencyScore: float
    confidenceScore: float
    recommendedTeam: str
    summaryAr: str
    summaryEn: str
