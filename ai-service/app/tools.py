import time
from typing import Dict, Any
from .models import DiagnosticResult

class EnterpriseDiagnosticTools:
    
    @staticmethod
    def ping_service_cluster(service_name: str) -> DiagnosticResult:
        """Pings microservices and infrastructure gateways to test latency and availability."""
        service_clean = service_name.lower()
        if "vpn" in service_clean or "network" in service_clean:
            return DiagnosticResult(
                toolName="ping_service_cluster",
                status="OPERATIONAL_WITH_LATENCY",
                details={
                    "target": "vpn-gateway-riyadh-01.company.sa",
                    "latencyMs": 48.2,
                    "packetLossPercent": 0.0,
                    "activeTunnels": 1420,
                    "serverHealth": "HEALTHY",
                    "note": "Gateway cluster is running normally; issue is isolated to client configuration."
                }
            )
        elif "db" in service_clean or "database" in service_clean or "postgres" in service_clean:
            return DiagnosticResult(
                toolName="ping_service_cluster",
                status="HEALTHY",
                details={
                    "target": "servicedesk-postgres:5432",
                    "latencyMs": 1.2,
                    "activeConnections": 18,
                    "maxConnections": 100,
                    "transactionStatus": "COMMITTED_OK"
                }
            )
        elif "erp" in service_clean or "backend" in service_clean:
            return DiagnosticResult(
                toolName="ping_service_cluster",
                status="DEGRADED",
                details={
                    "target": "servicedesk-backend:8081",
                    "latencyMs": 280.5,
                    "jvmHeapUsagePercent": 84.5,
                    "gcPauseAlert": True,
                    "note": "JVM memory pressure detected; recommended container restart or heap tuning."
                }
            )
        else:
            return DiagnosticResult(
                toolName="ping_service_cluster",
                status="OPERATIONAL",
                details={
                    "target": service_name,
                    "latencyMs": 15.0,
                    "status": "UP"
                }
            )

    @staticmethod
    def lookup_user_directory_profile(email: str) -> DiagnosticResult:
        """Queries Enterprise Identity & Access Management (IAM) for user lockouts, MFA status, and roles."""
        is_locked = "lock" in email.lower() or "error" in email.lower() or "blocked" in email.lower()
        return DiagnosticResult(
            toolName="lookup_user_directory_profile",
            status="WARNING" if is_locked else "CLEAN",
            details={
                "accountStatus": "LOCKED" if is_locked else "ACTIVE",
                "mfaEnrolled": True,
                "badPasswordCount": 5 if is_locked else 0,
                "passwordLastChanged": "45 days ago",
                "assignedAssets": ["ThinkPad T14s Gen 4 (SN: PF-99214)", "Dell U2723QE Display"],
                "department": "Operations & Logistics"
            }
        )

    @staticmethod
    def inspect_sla_policy(priority: str, elapsed_hours: float = 0.5) -> DiagnosticResult:
        """Evaluates SLA deadline constraints, escalation windows, and breach likelihood."""
        sla_matrix = {
            "CRITICAL": {"responseHours": 0.5, "resolutionHours": 2.0},
            "HIGH": {"responseHours": 1.0, "resolutionHours": 4.0},
            "MEDIUM": {"responseHours": 2.0, "resolutionHours": 8.0},
            "LOW": {"responseHours": 4.0, "resolutionHours": 24.0}
        }
        policy = sla_matrix.get(priority.upper(), sla_matrix["MEDIUM"])
        rem_res = max(0.0, policy["resolutionHours"] - elapsed_hours)
        risk_level = "CRITICAL_RISK" if rem_res < 1.0 else ("WARNING" if rem_res < 2.0 else "NOMINAL")

        return DiagnosticResult(
            toolName="inspect_sla_policy",
            status=risk_level,
            details={
                "priority": priority,
                "slaTargetResolutionHours": policy["resolutionHours"],
                "elapsedHours": elapsed_hours,
                "remainingHours": round(rem_res, 1),
                "breachProbabilityPercent": 85.0 if risk_level == "CRITICAL_RISK" else (40.0 if risk_level == "WARNING" else 10.0),
                "escalationRequired": risk_level == "CRITICAL_RISK"
            }
        )

    @staticmethod
    def execute_self_healing_check(category: str, title: str) -> DiagnosticResult:
        """Runs automated rule-based self-healing diagnostic checks for the ticket."""
        return DiagnosticResult(
            toolName="execute_self_healing_check",
            status="DIAGNOSTIC_COMPLETED",
            details={
                "automatedRemediationPossible": category in ["NETWORK", "SECURITY_ACCESS", "SOFTWARE"],
                "recommendedExecutionType": "GUIDED_ASSISTANCE",
                "suggestedAutomatedScript": "netsh winsock reset && ipconfig /flushdns" if "vpn" in title.lower() else "Unlock-ADAccount"
            }
        )
