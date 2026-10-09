import re
import math
from typing import List, Dict, Any
from .models import KnowledgeMatch

class EnterpriseKnowledgeBase:
    ARTICLES: List[Dict[str, Any]] = [
        {
            "id": "KB-NET-101",
            "title": "Cisco AnyConnect / GlobalProtect VPN Gateway Timeout (Error 800/412)",
            "title_ar": "تعذر الاتصال ببوابة VPN المؤسسية والمهلة الزمنية (كود الخطأ 800/412)",
            "category": "NETWORK",
            "keywords": ["vpn", "anyconnect", "globalprotect", "remote access", "error 800", "error 412", "timeout", "الاتصال عن بعد", "شبكة", "في بي ان", "انقطاع"],
            "root_cause": "Client MTU packet size mismatch with ISP or corrupted local certificate cache in Cisco Secure Client profile.",
            "root_cause_ar": "عدم تطابق حجم حزم MTU للعميل مع مزود الخدمة أو تلف ملف الشهادات المؤقت في تطبيق Cisco VPN.",
            "solution": "1. Run command prompt as Admin and reset Winsock: 'netsh winsock reset'.\n2. Set interface MTU to 1350: 'netsh interface ipv4 set subinterface \"Ethernet\" mtu=1350 store=persistent'.\n3. Clear cached profiles in %LOCALAPPDATA%\\Cisco\\Cisco Secure Client\\ and reconnect to vpn-cluster.company.com.",
            "solution_ar": "1. قم بتشغيل موجه الأوامر كمسؤول ونفذ: 'netsh winsock reset'.\n2. اضبط حجم الـ MTU إلى 1350 لضمان استقرار النقل عبر الشبكات الخارجية.\n3. احذف ملفات الـ Cache المؤقتة في مجلد التطبيق وأعد المحاولة عبر البوابة البديلة."
        },
        {
            "id": "KB-SEC-202",
            "title": "Active Directory Account Lockout & Kerberos Ticket Expiration",
            "title_ar": "قفل حساب المستخدم في الدليل النشط (Active Directory) وانتهاء صلاحية التذكرة",
            "category": "SECURITY_ACCESS",
            "keywords": ["locked", "lockout", "password", "active directory", "ad", "kerberos", "login failed", "حساب مقفل", "كلمة المرور", "تسجيل الدخول", "صلاحيات"],
            "root_cause": "Repeated failed authentication attempts caused by stored credentials in Windows Credential Manager or mobile device exchange sync.",
            "root_cause_ar": "محاولات تسجيل دخول خاطئة متكررة ناتجة عن كلمة مرور قديمة محفوظة في مدير بيانات الاعتماد (Credential Manager) أو مزامنة بريد الجوال.",
            "solution": "1. Verify user status in DC via PowerShell: 'Unlock-ADAccount -Identity <Username>'.\n2. Instruct user to remove stale saved network passwords from Control Panel -> Credential Manager.\n3. Regenerate Kerberos ticket: 'klist purge'.",
            "solution_ar": "1. إلغاء قفل الحساب عبر أدوات إدارة الهوية المركزية.\n2. توجيه المستخدم لحذف كلمات المرور القديمة المحفوظة في Windows Credential Manager.\n3. تنظيف تذاكر Kerberos القديمة عبر أمر 'klist purge' وتسجيل الدخول مجدداً."
        },
        {
            "id": "KB-DB-303",
            "title": "PostgreSQL / Enterprise Database Connection Pool Starvation (HikariCP Timeout)",
            "title_ar": "نفاد مجمع اتصالات قاعدة البيانات وتوقف استجابة الخدمة (HikariCP Timeout)",
            "category": "INFRASTRUCTURE",
            "keywords": ["database", "postgres", "connection pool", "hikaricp", "timeout", "deadlock", "قاعدة البيانات", "اتصال", "توقف السيرفر", "بطء"],
            "root_cause": "Long-running unindexed analytical query or unclosed hibernate session holding connections beyond maximum pool size.",
            "root_cause_ar": "استعلامات طويلة المدى غير مفهرسة أو عدم إغلاق جلسات الاتصال البرمجية مما سبب استهلاك كامل اتصالات HikariCP.",
            "solution": "1. Inspect pg_stat_activity: 'SELECT pid, query, state, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE state != 'idle';'.\n2. Terminate rogue blocking queries: 'SELECT pg_terminate_backend(<pid>);'.\n3. Increase HikariCP maximumPoolSize from default to 30 in application.yml and review slow query index.",
            "solution_ar": "1. فحص الاتصالات العالقة عبر استعلام pg_stat_activity وإنهاء العمليات المعطلة.\n2. تحسين مجمع الاتصالات في إعدادات التطبيق وتفعيل المراقبة اللحظية.\n3. التحقق من سلامة الفهارس (Indexes) للجداول المعنية."
        },
        {
            "id": "KB-APP-404",
            "title": "ERP System Session Crash / 502 Bad Gateway NGINX Reverse Proxy",
            "title_ar": "خطأ بوابة غير صالحة 502 في نظام تخطيط الموارد وسير العمليات (ERP)",
            "category": "SOFTWARE",
            "keywords": ["erp", "502 bad gateway", "nginx", "crash", "white screen", "session", "نظام", "تعطل", "شاشة بيضاء", "خطأ 502", "سيرفر"],
            "root_cause": "Upstream Spring Boot backend service container exceeded JVM memory limits (OutOfMemoryError: Java heap space) during heavy batch processing.",
            "root_cause_ar": "تجاوز خادم التطبيقات الخلفي حدود ذاكرة الـ JVM (Heap Space) أثناء معالجة دفعة بيانات كبيرة مما أدى لتوقف الحاوية مؤقتاً.",
            "solution": "1. Restart backend container via 'docker restart servicedesk-backend'.\n2. Adjust JVM memory flags: '-Xms512m -Xmx2048m' in deployment descriptor.\n3. Clear client browser session tokens and re-authenticate via OAuth/JWT.",
            "solution_ar": "1. إعادة تشغيل حاوية خادم التطبيقات لاستعادة الاتصال الفوري.\n2. رفع حد ذاكرة JVM Heap إلى 2GB لمنع تكرار العطل أثناء ضغط العمل.\n3. تحديث جلسة المستخدم في المتصفح وإعادة تسجيل الدخول."
        },
        {
            "id": "KB-HW-505",
            "title": "Enterprise Laptop Thunderbolt Docking Station & External Display Flicker",
            "title_ar": "تعطل قاعدة التوصيل (Docking Station) واهتزاز شاشات العرض الخارجية",
            "category": "HARDWARE",
            "keywords": ["laptop", "monitor", "display", "dock", "thunderbolt", "flicker", "hardware", "شاشة", "كمبيوتر", "عطل عتادي", "توصيل"],
            "root_cause": "Outdated Intel Display driver or Thunderbolt firmware negotiation failure with DisplayPort 1.4 MST daisy-chaining.",
            "root_cause_ar": "عدم توافق تعريف بطاقة الشاشة أو تعليق في نظام إدارة الطاقة لمنفذ Thunderbolt مع بروتوكول DisplayPort.",
            "solution": "1. Power cycle dock by disconnecting power cord and holding power button for 15 seconds.\n2. Push enterprise driver update package via Microsoft Intune or Dell Command Update.\n3. Disable DisplayPort 1.4 MST mode in monitor OSD menu to stabilize signal.",
            "solution_ar": "1. فصل كابل الطاقة عن محطة الـ Dock لمدة 15 ثانية لتفريغ الشحنات الكهربائية العالقة.\n2. تحديث برامج تشغيل كرت الشاشة ومنافذ Thunderbolt عبر التحديث المركزي.\n3. فحص كابل DisplayPort والتأكد من إحكام التوصيل."
        }
    ]

    @classmethod
    def _tokenize(cls, text: str) -> List[str]:
        cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
        tokens = [t.strip() for t in cleaned.split() if len(t.strip()) > 2]
        # Basic Arabic stem/normalization (remove alef hamza, taa marbuta)
        normalized = []
        for t in tokens:
            t = t.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ة', 'ه')
            normalized.append(t)
        return normalized

    @classmethod
    def search(cls, query: str, top_k: int = 3) -> List[KnowledgeMatch]:
        query_tokens = set(cls._tokenize(query))
        if not query_tokens:
            return []

        results = []
        for art in cls.ARTICLES:
            score = 0.0
            corpus_tokens = set(cls._tokenize(art["title"] + " " + art["title_ar"] + " " + " ".join(art["keywords"]) + " " + art["root_cause"]))
            
            # Intersection match
            common = query_tokens.intersection(corpus_tokens)
            if common:
                # Weighted score based on Jaccard + keyword boost
                keyword_tokens = set(cls._tokenize(" ".join(art["keywords"])))
                keyword_hits = query_tokens.intersection(keyword_tokens)
                
                base_score = len(common) / (math.sqrt(len(query_tokens)) * math.sqrt(len(corpus_tokens)) + 1e-5)
                keyword_boost = len(keyword_hits) * 0.25
                total_score = min(0.99, base_score + keyword_boost)

                results.append(KnowledgeMatch(
                    articleId=art["id"],
                    title=f"{art['title']} | {art['title_ar']}",
                    relevanceScore=round(float(total_score), 3),
                    recommendedSolution=f"EN: {art['solution']}\n\nAR: {art['solution_ar']}",
                    rootCause=f"EN: {art['root_cause']} | AR: {art['root_cause_ar']}",
                    category=art["category"]
                ))

        # Sort descending by relevance
        results.sort(key=lambda x: x.relevanceScore, reverse=True)
        return results[:top_k]
