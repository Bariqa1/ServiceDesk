import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import (
    TicketAnalysisRequest, MultiAgentAnalysisResponse,
    TriageQuickRequest, TriageQuickResponse, KnowledgeMatch
)
from .agent_graph import MultiAgentOrchestrator
from .knowledge_base import EnterpriseKnowledgeBase
from typing import List

app = FastAPI(
    title="ServiceDesk Agentic AI Intelligence Service",
    description="Enterprise Multi-Agent State Machine with Triage, Knowledge RAG, Tool Execution, and Human-in-the-Loop Orchestration.",
    version="1.0.0"
)

# Enable CORS for Angular frontend and Spring Boot backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "servicedesk-ai-service",
        "architecture": "Multi-Agent State Machine (LangGraph Pattern)",
        "agents": [
            "SupervisorAgent",
            "TriageAgent",
            "KnowledgeAgent",
            "DiagnosticAgent",
            "ActionPlannerAgent",
            "HitlGatekeeper"
        ],
        "knowledgeBaseArticles": len(EnterpriseKnowledgeBase.ARTICLES),
        "toolExecutionEngine": "ONLINE"
    }

@app.post("/api/ai/agent/diagnose", response_model=MultiAgentAnalysisResponse)
def run_agentic_diagnosis(request: TicketAnalysisRequest):
    """Executes the complete multi-agent reasoning graph over the given ticket."""
    try:
        response = MultiAgentOrchestrator.execute(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent orchestration failed: {str(e)}")

@app.post("/api/ai/agent/triage", response_model=TriageQuickResponse)
def run_quick_triage(request: TriageQuickRequest):
    """Performs rapid classification, urgency scoring, and department routing."""
    ticket_req = TicketAnalysisRequest(
        title=request.title,
        description=request.description
    )
    result = MultiAgentOrchestrator.execute(ticket_req)
    
    summary_ar = f"التصنيف: {result.predictedCategory} | الأولوية: {result.calculatedPriority} | التوجيه: {result.suggestedTeam}"
    summary_en = f"Category: {result.predictedCategory} | Priority: {result.calculatedPriority} | Route: {result.suggestedTeam}"

    return TriageQuickResponse(
        category=result.predictedCategory,
        priority=result.calculatedPriority,
        language=result.languageDetected,
        urgencyScore=result.urgencyScore,
        confidenceScore=result.confidenceScore,
        recommendedTeam=result.suggestedTeam,
        summaryAr=summary_ar,
        summaryEn=summary_en
    )

@app.post("/api/ai/agent/knowledge/search", response_model=List[KnowledgeMatch])
def search_knowledge(query: str, topK: int = 3):
    """Semantic vector search across enterprise knowledge base articles."""
    return EnterpriseKnowledgeBase.search(query, top_k=topK)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
