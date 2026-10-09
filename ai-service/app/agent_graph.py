from datetime import datetime
import re
from typing import List, Dict, Any, Optional
from .models import (
    TicketAnalysisRequest, TrajectoryStep, KnowledgeMatch, DiagnosticResult,
    MultiAgentAnalysisResponse, ActionType, AgentType, GuardrailReport, GuardrailViolation
)
from .knowledge_base import EnterpriseKnowledgeBase
from .tools import EnterpriseDiagnosticTools
from .guardrails import EnterpriseGuardrailEngine

class AgentState:
    def __init__(self, request: TicketAnalysisRequest):
        self.request = request
        self.language = "AR" if any('\u0600' <= c <= '\u06FF' for c in (request.title + request.description)) else "EN"
        self.category = request.category or "GENERAL"
        self.priority = request.priority or "MEDIUM"
        self.urgency_score = 50.0
        self.confidence_score = 90.0
        self.trajectory: List[TrajectoryStep] = []
        self.kb_matches: List[KnowledgeMatch] = []
        self.diagnostic_results: List[DiagnosticResult] = []
        self.guardrail_report: Optional[GuardrailReport] = None
        self.root_cause = ""
        self.proposed_resolution = ""
        self.action_type = ActionType.REQUIRE_HUMAN_APPROVAL
        self.requires_human_approval = True
        self.suggested_team = "L1 Support"
        self.sla_breach_risk = "NOMINAL"

    def record_step(self, agent: str, action: str, thought: str, toolCalled: Optional[str] = None, observation: Optional[str] = None):
        step_idx = len(self.trajectory) + 1
        now_str = datetime.now().strftime("%H:%M:%S")
        self.trajectory.append(TrajectoryStep(
            stepIndex=step_idx,
            agent=agent,
            action=action,
            thought=thought,
            toolCalled=toolCalled,
            observation=observation,
            timestamp=now_str
        ))

class MultiAgentOrchestrator:

    @classmethod
    def execute(cls, request: TicketAnalysisRequest) -> MultiAgentAnalysisResponse:
        state = AgentState(request)

        # 0. Pre-Execution Guardrail Node (Adversarial Defense & DLP)
        state.guardrail_report = EnterpriseGuardrailEngine.evaluate_input(
            title=request.title,
            description=request.description
        )

        # If malicious prompt injection or destructive command intercepted, halt and isolate
        if state.guardrail_report.status == "BLOCKED":
            cls._guardrail_blocked_node(state)
            return cls._build_response(state)

        # If sensitive credentials or PII detected, sanitize payload before sub-agent ingestion
        if state.guardrail_report.status == "SANITIZED":
            cls._guardrail_sanitized_node(state)
            state.request.title = state.guardrail_report.sanitizedTitle
            state.request.description = state.guardrail_report.sanitizedDescription
        else:
            cls._guardrail_passed_node(state)

        # 1. Supervisor Agent (Intent & Orchestration Node)
        cls._supervisor_node(state)

        # 2. Triage & Classification Agent Node
        cls._triage_node(state)

        # 3. Knowledge & RAG Retrieval Agent Node
        cls._knowledge_node(state)

        # 4. Diagnostic & Tool Calling Agent Node
        cls._diagnostic_node(state)

        # 5. Action Planner & Solution Synthesis Agent Node
        cls._action_planner_node(state)

        # 6. Post-Execution Guardrails (Harm & Output Hallucination Filter)
        cls._guardrail_post_node(state)

        # 7. Human-in-the-Loop (HITL) Gatekeeper Node
        cls._hitl_gatekeeper_node(state)

        return cls._build_response(state)

    @classmethod
    def _build_response(cls, state: AgentState) -> MultiAgentAnalysisResponse:
        return MultiAgentAnalysisResponse(
            ticketNumber=state.request.ticketNumber or f"INC-2026-{state.request.ticketId or 'AUTO'}",
            languageDetected=state.language,
            predictedCategory=state.category,
            calculatedPriority=state.priority,
            urgencyScore=round(state.urgency_score, 1),
            confidenceScore=round(state.confidence_score, 1),
            actionType=state.action_type,
            requiresHumanApproval=state.requires_human_approval,
            rootCauseAnalysis=state.root_cause,
            proposedResolution=state.proposed_resolution,
            suggestedTeam=state.suggested_team,
            slaBreachRisk=state.sla_breach_risk,
            trajectory=state.trajectory,
            knowledgeMatches=state.kb_matches,
            diagnosticResults=state.diagnostic_results,
            guardrailReport=state.guardrail_report
        )


    @staticmethod
    def _supervisor_node(state: AgentState):
        text = (state.request.title + " " + state.request.description).lower()
        thought = (
            f"تم استلام التذكرة وفحص السياق اللغوي: {state.language}. يجري توزيع المهام على وكلاء الفرز والتشخيص والمعرفة."
            if state.language == "AR" else
            f"Ingested ticket payload. Detected language: {state.language}. Dispatching sub-agents for triage, knowledge retrieval, and diagnostics."
        )
        state.record_step(
            agent=AgentType.SUPERVISOR,
            action="Ticket Ingestion & Workflow Dispatch",
            thought=thought,
            toolCalled=None,
            observation=f"Initialized Multi-Agent State Machine for ticket '{state.request.title}'"
        )

    @staticmethod
    def _triage_node(state: AgentState):
        text = (state.request.title + " " + state.request.description).lower()
        
        # Categorization logic
        category = "SOFTWARE"
        team = "Applications Support"
        if any(w in text for w in ["vpn", "network", "wifi", "internet", "dns", "شبكة", "واي فاي", "انترنت"]):
            category = "NETWORK"
            team = "Network & Infrastructure Ops"
        elif any(w in text for w in ["lock", "password", "ad", "permission", "login", "auth", "حساب", "كلمة المرور", "صلاحية"]):
            category = "SECURITY_ACCESS"
            team = "Identity & Access Management (IAM)"
        elif any(w in text for w in ["database", "postgres", "sql", "pool", "قاعدة بيانات", "سيرفر"]):
            category = "INFRASTRUCTURE"
            team = "Cloud & Database Reliability (DBRE)"
        elif any(w in text for w in ["laptop", "monitor", "screen", "keyboard", "dock", "شاشة", "كمبيوتر", "عتاد"]):
            category = "HARDWARE"
            team = "End-User Computing & Field Services"

        # Priority calculation
        priority = "MEDIUM"
        urgency = 50.0
        if any(w in text for w in ["critical", "down", "outage", "emergency", "crash", "عاجل", "توقف تام", "طوارئ", "عطل كلي"]):
            priority = "CRITICAL"
            urgency = 95.0
        elif any(w in text for w in ["cannot work", "blocked", "high", "failed", "error", "تعطل", "فشل", "لا يعمل"]):
            priority = "HIGH"
            urgency = 75.0
        elif any(w in text for w in ["slow", "minor", "inquiry", "how to", "استفسار", "طلب"]):
            priority = "LOW"
            urgency = 25.0

        state.category = category
        state.priority = priority
        state.urgency_score = urgency
        state.suggested_team = team

        thought = (
            f"تم تصنيف التذكرة تحت قسم '{category}' وتحديد مستوى الأولوية '{priority}' (مستوى الاستعجال: {urgency}%). توجيه التذكرة لفريق: {team}."
            if state.language == "AR" else
            f"Triage complete: Category='{category}', Priority='{priority}' (Urgency Score: {urgency}%). Recommended dispatch team: '{team}'."
        )
        state.record_step(
            agent=AgentType.TRIAGE,
            action="Categorization & Priority Assignment",
            thought=thought,
            observation=f"Assigned Category={category}, Priority={priority}, TargetTeam={team}"
        )

    @staticmethod
    def _knowledge_node(state: AgentState):
        query = state.request.title + " " + state.request.description
        matches = EnterpriseKnowledgeBase.search(query, top_k=2)
        state.kb_matches = matches

        if matches:
            top_m = matches[0]
            thought = (
                f"تم العثور على حل مطابق في قاعدة المعرفة: [{top_m.articleId}] بنسبة ملاءمة {int(top_m.relevanceScore * 100)}%. تم استخراج السبب الجذري والحل المقترح."
                if state.language == "AR" else
                f"Matched internal KB article [{top_m.articleId}] with {int(top_m.relevanceScore * 100)}% semantic score. Extracted proven SOP resolution."
            )
            obs = f"Found {len(matches)} relevant articles. Top match: {top_m.title}"
        else:
            thought = (
                "لم يتم العثور على مقال معرفي مطابق بشكل مباشر؛ سيتم الاعتماد على الفحص التشخيصي واستدعاء أدوات البنية التحتية."
                if state.language == "AR" else
                "No direct KB match found; falling back to dynamic infrastructure diagnostics."
            )
            obs = "KB Vector search returned 0 high-confidence matches."

        state.record_step(
            agent=AgentType.KNOWLEDGE,
            action="Semantic KB Retrieval",
            thought=thought,
            toolCalled="EnterpriseKnowledgeBase.search",
            observation=obs
        )

    @staticmethod
    def _diagnostic_node(state: AgentState):
        results = []
        text = (state.request.title + " " + state.request.description).lower()

        # Tool 1: Service ping
        target_service = "vpn" if state.category == "NETWORK" else ("postgres" if state.category == "INFRASTRUCTURE" else "backend")
        ping_res = EnterpriseDiagnosticTools.ping_service_cluster(target_service)
        results.append(ping_res)

        # Tool 2: Identity check
        if state.category == "SECURITY_ACCESS" or "user" in text or "login" in text:
            iam_res = EnterpriseDiagnosticTools.lookup_user_directory_profile(state.request.requesterEmail or "user@company.com")
            results.append(iam_res)

        # Tool 3: SLA Inspection
        sla_res = EnterpriseDiagnosticTools.inspect_sla_policy(state.priority)
        results.append(sla_res)
        state.sla_breach_risk = sla_res.status

        state.diagnostic_results = results

        thought = (
            f"تم استدعاء {len(results)} أدوات فحص تشخيصية للنظام. حالة البنية التحتية: {ping_res.status}، وخطر كسر الـ SLA: {state.sla_breach_risk}."
            if state.language == "AR" else
            f"Executed {len(results)} diagnostic tool probes. Infrastructure status: {ping_res.status}, SLA risk assessment: {state.sla_breach_risk}."
        )
        state.record_step(
            agent=AgentType.DIAGNOSTIC,
            action="Automated Tool Execution & Probing",
            thought=thought,
            toolCalled=f"ping_service_cluster({target_service}), inspect_sla_policy",
            observation=f"Collected diagnostic telemetry. SLA Risk={state.sla_breach_risk}"
        )

    @staticmethod
    def _action_planner_node(state: AgentState):
        if state.kb_matches:
            top_match = state.kb_matches[0]
            state.root_cause = top_match.rootCause
            state.proposed_resolution = top_match.recommendedSolution
            state.confidence_score = min(98.0, max(85.0, top_match.relevanceScore * 100))
        else:
            if state.category == "NETWORK":
                state.root_cause = "Local DNS caching issue or gateway handshake timeout."
                state.proposed_resolution = "Flush local DNS via 'ipconfig /flushdns', restart network adapter, and reconnect."
            elif state.category == "SECURITY_ACCESS":
                state.root_cause = "Account authentication lock caused by multiple failed login attempts."
                state.proposed_resolution = "Perform AD account unlock and initiate self-service password reset procedure."
            else:
                state.root_cause = "Application state discrepancy or transient service communication failure."
                state.proposed_resolution = "Verify service operational metrics and restart corresponding worker container."
            state.confidence_score = 82.0

        thought = (
            f"تم صياغة مسودة الحل الشامل بنسبة ثقة {state.confidence_score}%. تم تحديد السبب الجذري والخطوات التنفيذية الموصى بها."
            if state.language == "AR" else
            f"Synthesized comprehensive resolution plan with {state.confidence_score}% confidence. Identified root cause and operational steps."
        )
        state.record_step(
            agent=AgentType.ACTION_PLANNER,
            action="Resolution Synthesis & RCA",
            thought=thought,
            observation=f"Formulated Root Cause Analysis & Proposed Resolution (Confidence: {state.confidence_score}%)"
        )

    @staticmethod
    def _hitl_gatekeeper_node(state: AgentState):
        # Human-in-the-loop policy:
        # Critical tickets or actions below 88% confidence MUST have human approval
        if state.priority == "CRITICAL" or state.confidence_score < 88.0:
            state.action_type = ActionType.REQUIRE_HUMAN_APPROVAL
            state.requires_human_approval = True
            thought = (
                "السياسة الأمنية تتطلب موافقة الفني البشري (Human-in-the-Loop) نظراً لحساسية التذكرة أو مستوى أولويتها الحرج."
                if state.language == "AR" else
                "Safety policy enforced: High-severity or low-confidence ticket requires explicit human technician verification (HITL) before execution."
            )
            obs = "Gatekeeper Decision: REQUIRE_HUMAN_APPROVAL"
        else:
            state.action_type = ActionType.AUTO_RESOLVE
            state.requires_human_approval = False
            thought = (
                "تم التحقق من معايير السلامة: الحل معتمد ونسبة الثقة عالية. جاهز للتنفيذ التلقائي أو الاعتماد الفوري بنقرة واحدة."
                if state.language == "AR" else
                "Safety verification passed: High confidence match with low operational risk. Suitable for autonomous resolution."
            )
            obs = "Gatekeeper Decision: AUTO_RESOLVE_READY"

        state.record_step(
            agent=AgentType.HITL_GATEKEEPER,
            action="Human-in-the-Loop Risk Evaluation",
            thought=thought,
            observation=obs
        )

    @staticmethod
    def _guardrail_blocked_node(state: AgentState):
        state.priority = "CRITICAL"
        state.category = "SECURITY_ACCESS"
        state.urgency_score = 99.0
        state.confidence_score = 0.0
        state.action_type = ActionType.REQUIRE_HUMAN_APPROVAL
        state.requires_human_approval = True
        state.suggested_team = "Cyber Security Operations (SOC)"
        state.sla_breach_risk = "CRITICAL_RISK"
        
        v_details = ", ".join(v.rule for v in state.guardrail_report.violations) if state.guardrail_report else "SECURITY_VIOLATION"
        state.root_cause = f"CRITICAL SECURITY ALERT: Input triggered AI Guardrails defense policy ({v_details}). Potential prompt injection or destructive exploitation."
        state.proposed_resolution = "Autonomous execution halted. Payload isolated. Mandatory human investigation by Cyber Security Operations (SOC) required."

        thought = (
            f"تم رصد تهديد أمني ومحاولة اختراق/حقن أوامر (Prompt Injection أو أوامر تدميرية). تم إحباط الهجوم وعزل التذكرة فوراً لمنع التسميم المعرفي للوكلاء."
            if state.language == "AR" else
            f"Adversarial security attack detected ({v_details}). Exploitation attempt neutralized immediately; payload quarantined to protect agent integrity."
        )
        state.record_step(
            agent=AgentType.GUARDRAIL,
            action="Adversarial Attack & Safety Interception",
            thought=thought,
            toolCalled="EnterpriseGuardrailEngine.evaluate_input",
            observation=f"Status: BLOCKED | Violations: {len(state.guardrail_report.violations)} | Action: Threat Contained & Escalated"
        )

    @staticmethod
    def _guardrail_sanitized_node(state: AgentState):
        violations_count = len(state.guardrail_report.violations) if state.guardrail_report else 0
        thought = (
            f"تم تفعيل درع حماية البيانات (DLP): تم حجب وتشفير {violations_count} عنصر حساس (كلمات مرور/مفاتيح برمجية/هويات) قبل إرسالها للوكلاء لمنع تسريب البيانات."
            if state.language == "AR" else
            f"Data Loss Prevention (DLP) guardrail activated: Masked and sanitized {violations_count} sensitive secrets/PII elements before agent ingestion."
        )
        state.record_step(
            agent=AgentType.GUARDRAIL,
            action="Pre-Execution DLP & Secret Sanitization",
            thought=thought,
            toolCalled="EnterpriseGuardrailEngine.evaluate_input",
            observation=f"Status: SANITIZED | Masked Items: {violations_count} | Payload Cleaned"
        )

    @staticmethod
    def _guardrail_passed_node(state: AgentState):
        thought = (
            "اجتازت التذكرة فحص درع الأمان (Guardrails) بنجاح: خالية من محاولات كسر الحماية (Jailbreak)، وتسريب البيانات، والأوامر المحظورة."
            if state.language == "AR" else
            "Guardrail security verification passed: 0 prompt injections, 0 credential leaks, 0 destructive command signatures. Payload is clean."
        )
        state.record_step(
            agent=AgentType.GUARDRAIL,
            action="Security & Policy Pre-Flight Clearance",
            thought=thought,
            toolCalled="EnterpriseGuardrailEngine.evaluate_input",
            observation="Status: PASSED | Risk Score: 5.0% | Clean Enterprise Payload"
        )

    @staticmethod
    def _guardrail_post_node(state: AgentState):
        is_safe, violations, sanitized_res = EnterpriseGuardrailEngine.evaluate_output(
            root_cause=state.root_cause,
            proposed_resolution=state.proposed_resolution
        )
        if not is_safe:
            state.proposed_resolution = sanitized_res
            if state.guardrail_report:
                state.guardrail_report.violations.extend(violations)
                state.guardrail_report.destructiveCommandsBlocked = True
            state.requires_human_approval = True
            state.action_type = ActionType.REQUIRE_HUMAN_APPROVAL

            thought = (
                "درع الأمان البعدي (Output Guardrail) رصد واعتراض أوامر نظام غير آمنة في خطة الحل المقترحة وتم إزالتها فوراً لسلامة النظام."
                if state.language == "AR" else
                "Post-execution output guardrail intercepted and removed dangerous system commands from proposed resolution."
            )
            state.record_step(
                agent=AgentType.GUARDRAIL,
                action="Post-Execution Harm Mitigation",
                thought=thought,
                toolCalled="EnterpriseGuardrailEngine.evaluate_output",
                observation=f"Intercepted {len(violations)} dangerous command signatures. Safety bounds maintained."
            )

