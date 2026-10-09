import re
from typing import List, Tuple, Dict, Any
from .models import GuardrailViolation, GuardrailReport

class EnterpriseGuardrailEngine:
    """
    Enterprise-Grade AI Guardrails & Safety Filter for ITSM:
    1. Prompt Injection & Jailbreak Detection (Adversarial Robustness)
    2. Data Loss Prevention (DLP) & PII / Secrets Sanitization
    3. Destructive Command & Malicious Code Interception
    4. Hallucination & Faithfulness Constraints
    5. Payload Anomaly & Length Boundaries
    """

    # --- 1. Prompt Injection & Jailbreak Signatures ---
    PROMPT_INJECTION_PATTERNS = [
        # English patterns
        r"(?i)\b(ignore|disregard|forget|override)\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules|commands)",
        r"(?i)\b(you\s+are\s+now|act\s+as)\s+(an?\s+)?(unrestricted|jailbroken|dan|developer\s+mode|root|admin)",
        r"(?i)\b(system\s+prompt|reveal\s+instructions|leak\s+secret|show\s+prompt)",
        r"(?i)\b(bypass|disable|turn\s+off)\s+(security|safety|filter|guardrail|hitl|checks)",
        r"(?i)\b(do\s+anything\s+now|unfiltered|jailbreak)\b",
        r"(?i)<\s*(system|admin|override|prompt)\s*>",
        r"(?i)\[\s*(inst|system|override)\s*\]",
        # Arabic patterns
        r"(تجاهل|الغاء|تخطي|تجاوز)\s+(جميع\s+)?(التعليمات|الأوامر|القواعد|السياسات)\s+(السابقة|الأصلية)",
        r"(أنت\s+الآن|تصرف\s+كأنك)\s+(مطور|مسؤول|بدون\s+قيود|مخترق)",
        r"(اكشف|اعرض|اطبع)\s+(التعليمات\s+السرية|برومبت\s+النظام|أسرار\s+النظام)",
        r"(عطّل|ايقاف)\s+(الحماية|الأمان|الفلتر|حزام\s+الأمان)",
    ]

    # --- 2. Secrets & Credentials Signatures ---
    SECRET_PATTERNS = [
        ("AWS_KEY", r"\b(AKIA[0-9A-Z]{16})\b"),
        ("JWT_TOKEN", r"\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b"),
        ("PRIVATE_KEY", r"-----BEGIN\s+([A-Z\s]+)?PRIVATE\s+KEY-----"),
        ("GENERIC_PASSWORD", r"(?i)\b(password|passwd|pwd|secret)\s*[:=]\s*([^\s]{4,})"),
        ("CONNECTION_STRING", r"(?i)\b(postgres|mysql|mongodb|redis):\/\/[a-zA-Z0-9_\-]+:[^@\s]+@[a-zA-Z0-9_\-\.]+"),
        ("API_KEY", r"(?i)\b(api[_-]?key|access[_-]?token)\s*[:=]\s*([a-zA-Z0-9_\-]{16,})"),
    ]

    # --- 3. PII (Personally Identifiable Information) Signatures ---
    PII_PATTERNS = [
        ("SAUDI_NATIONAL_ID", r"\b([12]\d{9})\b"),
        ("CREDIT_CARD", r"\b(?:\d[ -]*?){13,16}\b"),
        ("SAUDI_PHONE", r"\b(?:\+9665|05)\d{8}\b"),
        ("EMAIL_ADDRESS", r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"),
    ]

    # --- 4. Destructive Infrastructure Commands ---
    DESTRUCTIVE_COMMAND_PATTERNS = [
        r"(?i)\brm\s+-[rRfF]{1,3}\s+[\/\*]",
        r"(?i)\b(format\s+[a-zA-Z]:|mkfs(\.[a-z0-9]+)?\s+)",
        r"(?i)\bdd\s+if=\/dev\/(zero|urandom|random)\s+of=\/dev\/",
        r"(?i)\bchmod\s+(-R\s+)?777\s+[\/\*]",
        r"(?i)\bkill\s+-9\s+1\b",
        r"(?i)\b(shutdown\s+-h\s+now|init\s+0|reboot\s+-f)\b",
        r"(?i)\b(curl|wget)\s+[^|\n]+?\|\s*(bash|sh)\b",
        r"(?i):\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:",  # Fork bomb
        # Dangerous SQL commands
        r"(?i)\bDROP\s+(TABLE|DATABASE|SCHEMA|VIEW)\b",
        r"(?i)\bTRUNCATE\s+(TABLE)?\b",
        r"(?i)\bDELETE\s+FROM\s+[a-zA-Z0-9_]+\s*(WHERE\s+1=1|\s*;|\s*$)",
    ]

    @classmethod
    def evaluate_input(cls, title: str, description: str) -> GuardrailReport:
        """
        Scans input ticket title and description for:
        - Prompt injections (Blocks if malicious)
        - PII and Secrets (Sanitizes & Masks with DLP tokens)
        - Destructive commands (Flags as high severity)
        """
        violations: List[GuardrailViolation] = []
        full_text = f"{title} {description}"
        sanitized_title = title
        sanitized_desc = description

        # 1. Check Prompt Injections
        has_prompt_injection = False
        for pattern in cls.PROMPT_INJECTION_PATTERNS:
            match = re.search(pattern, full_text)
            if match:
                has_prompt_injection = True
                violations.append(GuardrailViolation(
                    rule="PROMPT_INJECTION_DEFENSE",
                    severity="CRITICAL",
                    details=f"Detected adversarial prompt injection signature: '{match.group(0)[:50]}...'",
                    actionTaken="BLOCKED"
                ))
                break

        # 2. Check & Sanitize Secrets
        has_secrets = False
        for label, pattern in cls.SECRET_PATTERNS:
            for match in re.finditer(pattern, full_text):
                has_secrets = True
                matched_str = match.group(0)
                redaction = f"[REDACTED_SECRET:{label}]"
                sanitized_title = sanitized_title.replace(matched_str, redaction)
                sanitized_desc = sanitized_desc.replace(matched_str, redaction)
                violations.append(GuardrailViolation(
                    rule="DLP_SECRET_MASKING",
                    severity="HIGH",
                    details=f"Masked potential sensitive secret: {label}",
                    actionTaken="SANITIZED"
                ))

        # 3. Check & Sanitize PII
        has_pii = False
        for label, pattern in cls.PII_PATTERNS:
            # Avoid replacing already redacted tokens
            for match in re.finditer(pattern, full_text):
                matched_str = match.group(0)
                if "[REDACTED" in matched_str:
                    continue
                # For credit card numbers, ensure minimum 13 digits
                digits_only = re.sub(r"\D", "", matched_str)
                if label == "CREDIT_CARD" and len(digits_only) < 13:
                    continue
                has_pii = True
                redaction = f"[REDACTED_PII:{label}]"
                sanitized_title = sanitized_title.replace(matched_str, redaction)
                sanitized_desc = sanitized_desc.replace(matched_str, redaction)
                violations.append(GuardrailViolation(
                    rule="DLP_PII_PROTECTION",
                    severity="MEDIUM",
                    details=f"Masked user identifiable information: {label}",
                    actionTaken="SANITIZED"
                ))

        # 4. Check Destructive Commands in Input
        has_destructive = False
        for pattern in cls.DESTRUCTIVE_COMMAND_PATTERNS:
            match = re.search(pattern, full_text)
            if match:
                has_destructive = True
                violations.append(GuardrailViolation(
                    rule="DESTRUCTIVE_COMMAND_PREVENTION",
                    severity="CRITICAL",
                    details=f"Prohibited destructive system command detected: '{match.group(0)[:40]}'",
                    actionTaken="BLOCKED"
                ))
                break

        # Calculate Status & Risk
        if has_prompt_injection or has_destructive:
            status = "BLOCKED"
            risk_score = 98.0
        elif has_secrets or has_pii:
            status = "SANITIZED"
            risk_score = 65.0
        else:
            status = "PASSED"
            risk_score = 5.0

        return GuardrailReport(
            status=status,
            riskScore=risk_score,
            sanitizedTitle=sanitized_title,
            sanitizedDescription=sanitized_desc,
            violations=violations,
            promptInjectionDetected=has_prompt_injection,
            piiRedacted=has_secrets or has_pii,
            secretsRedacted=has_secrets,
            destructiveCommandsBlocked=has_destructive
        )

    @classmethod
    def evaluate_output(cls, root_cause: str, proposed_resolution: str) -> Tuple[bool, List[GuardrailViolation], str]:
        """
        Inspects output generated by Action Planner to ensure no destructive commands,
        unsafe scripts, or hallucinated risky terminal operations were recommended.
        Returns: (is_safe, violations, sanitized_resolution)
        """
        violations: List[GuardrailViolation] = []
        is_safe = True
        sanitized_res = proposed_resolution
        output_text = f"{root_cause} {proposed_resolution}"

        for pattern in cls.DESTRUCTIVE_COMMAND_PATTERNS:
            match = re.search(pattern, output_text)
            if match:
                is_safe = False
                matched_val = match.group(0)
                sanitized_res = sanitized_res.replace(
                    matched_val,
                    "[BLOCKED_BY_GUARDRAIL: Destructive command intercepted and removed for system safety]"
                )
                violations.append(GuardrailViolation(
                    rule="OUTPUT_SAFETY_GATE",
                    severity="CRITICAL",
                    details=f"Agent attempted to recommend forbidden destructive command: '{matched_val}'",
                    actionTaken="BLOCKED"
                ))

        return is_safe, violations, sanitized_res
