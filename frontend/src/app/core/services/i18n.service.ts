import { Injectable, signal, computed } from '@angular/core';
import { TicketStatus, TicketPriority, SlaStatus } from '../models/models';

export type Language = 'ar' | 'en';

export interface Translations {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly STORAGE_KEY = 'servicedesk_lang';

  // Current language signal ('ar' or 'en')
  currentLang = signal<Language>(this.getInitialLanguage());

  // Direction signal: rtl for ar, ltr for en
  dir = computed<'rtl' | 'ltr'>(() => (this.currentLang() === 'ar' ? 'rtl' : 'ltr'));
  isArabic = computed<boolean>(() => this.currentLang() === 'ar');
  isEnglish = computed<boolean>(() => this.currentLang() === 'en');

  constructor() {
    this.applyLanguage(this.currentLang());
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    this.applyLanguage(lang);
  }

  toggleLanguage(): void {
    const nextLang: Language = this.currentLang() === 'ar' ? 'en' : 'ar';
    this.setLanguage(nextLang);
  }

  private getInitialLanguage(): Language {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') {
      return saved;
    }
    return 'ar';
  }

  private applyLanguage(lang: Language): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }

  // Translation lookup helper
  t(key: string): string {
    const lang = this.currentLang();
    const dict = lang === 'ar' ? AR_TRANSLATIONS : EN_TRANSLATIONS;
    return dict[key] || EN_TRANSLATIONS[key] || key;
  }

  // Status formatter
  formatStatus(status: TicketStatus | string | undefined | null): string {
    if (!status) return '';
    const key = `status.${status.toLowerCase()}`;
    return this.t(key);
  }

  // Priority formatter
  formatPriority(priority: TicketPriority | string | undefined | null): string {
    if (!priority) return '';
    const key = `priority.${priority.toLowerCase()}`;
    return this.t(key);
  }

  // SLA formatter
  formatSla(sla: SlaStatus | string | undefined | null): string {
    if (!sla) return '';
    const key = `sla.${sla.toLowerCase()}`;
    return this.t(key);
  }

  // Role formatter
  formatRole(role: string | undefined | null): string {
    if (!role) return '';
    const clean = role.toLowerCase().replace(/^role_/, '');
    const cleanKey = `role.${clean}`;
    const rawKey = `role.${role.toLowerCase()}`;
    const dict = this.currentLang() === 'ar' ? AR_TRANSLATIONS : EN_TRANSLATIONS;
    return dict[cleanKey] || dict[rawKey] || EN_TRANSLATIONS[cleanKey] || EN_TRANSLATIONS[rawKey] || clean;
  }
}

// Arabic Translations
const AR_TRANSLATIONS: Translations = {
  // Brand & Common
  'brand.name': 'ServiceDesk',
  'common.refresh': 'تحديث',
  'common.cancel': 'إلغاء',
  'common.save': 'حفظ',
  'common.submit': 'إرسال',
  'common.create': 'إنشاء',
  'common.search': 'بحث...',
  'common.all': 'الكل',
  'common.edit': 'تعديل',
  'common.delete': 'حذف',
  'common.actions': 'الإجراءات',
  'common.loading': 'جاري التحميل...',
  'common.empty': 'لا توجد بيانات متاحة.',
  'common.back': 'رجوع',
  'common.close': 'إغلاق',
  'common.confirm': 'تأكيد',
  'common.date': 'التاريخ',
  'common.minutes': 'دقيقة',
  'common.hours': 'ساعات',
  'common.unassigned': 'غير مسند',
  'common.general': 'عام',
  'common.viewAll': 'عرض الكل',

  // Navigation & Navbar
  'nav.dashboard': 'لوحة المؤشرات',
  'nav.tickets': 'التذاكر والطلبات',
  'nav.newTicket': 'إنشاء تذكرة جديدة',
  'nav.mainMenu': 'القائمة الرئيسية',
  'nav.operationalFilters': 'الفلاتر التشغيلية',
  'nav.filterAtRisk': 'تذاكر مهددة بالانقضاء',
  'nav.filterBreached': 'تذاكر متجاوزة الـ SLA',
  'nav.filterCritical': 'تذاكر حرجة (Critical)',
  'nav.currentRole': 'الدور التشغيلي الحالي',
  'nav.logout': 'تسجيل الخروج',
  'nav.themeDark': 'الوضع الداكن',
  'nav.themeLight': 'الوضع الفاتح',
  'nav.slaAlerts': 'تنبيه SLA',

  // Statuses
  'status.open': 'جديدة',
  'status.assigned': 'مسندة',
  'status.in_progress': 'قيد المعالجة',
  'status.waiting_for_user': 'بانتظار الموظف',
  'status.resolved': 'تم الحل',
  'status.closed': 'مغلقة',
  'status.reopened': 'معاد فتحها',

  // Priorities
  'priority.critical': 'حرجة',
  'priority.high': 'عالية',
  'priority.medium': 'متوسطة',
  'priority.low': 'منخفضة',

  // SLA Statuses
  'sla.within_sla': 'ضمن المهلة',
  'sla.at_risk': 'مهددة بالانقضاء',
  'sla.breached': 'متجاوزة المهلة',

  // Roles
  'role.service_manager': 'مدير الخدمة',
  'role.manager': 'مدير الخدمة',
  'role.team_lead': 'رئيس الفريق',
  'role.lead': 'رئيس الفريق',
  'role.support_agent': 'فني الدعم',
  'role.agent': 'فني الدعم',
  'role.business_employee': 'موظف أعمال',
  'role.employee': 'موظف',

  // Dashboard
  'dashboard.title': 'لوحة المؤشرات',
  'dashboard.subtitle': 'مراقبة طابور تذاكر الدعم الفني، قياس مؤشرات الـ SLA، والتنبيهات المباشرة.',
  'dashboard.kpi.activeTickets': 'إجمالي التذاكر النشطة',
  'dashboard.kpi.activeTicketsSub': 'جديدة وقيد المعالجة',
  'dashboard.kpi.critical': 'الحالات الحرجة',
  'dashboard.kpi.criticalSub': 'استجابة 15 دقيقة • حل ساعتان',
  'dashboard.kpi.slaIssues': 'حالات SLA المهددة والمتجاوزة',
  'dashboard.kpi.slaIssuesSub': 'فحص آلي مستمر بالخلفية',
  'dashboard.kpi.compliance': 'نسبة الالتزام بالـ SLA',
  'dashboard.kpi.complianceSub': 'تذكرة حُلت اليوم بنجاح',
  'dashboard.priorityBreakdown': 'توزيع الأولويات في الطابور',
  'dashboard.totalTickets': 'إجمالي التذاكر',
  'dashboard.closedAndResolved': 'المغلقة والمحلولة',
  'dashboard.recentTickets': 'أحدث التذاكر في الطابور',
  'dashboard.recentTicketsSub': '',
  'dashboard.slaBannerTitle': 'تنبيه اتفاقية مستوى الخدمة (SLA Alert)',
  'dashboard.slaBannerDesc': 'توجد تذاكر متجاوزة أو مهددة بتجاوز مهلة الـ SLA المحددة.',
  'dashboard.showBreached': 'عرض المتجاوزة',
  'dashboard.showAtRisk': 'عرض المهددة',

  // Ticket List
  'ticketList.title': 'طابور التذاكر والطلبات',
  'ticketList.subtitle': 'إدارة ومتابعة طلبات الدعم الفني الداخلي ومطابقة اتفاقيات مستوى الخدمة.',
  'ticketList.searchPlaceholder': 'بحث بالرقم، العنوان، أو الوصف...',
  'ticketList.allStatuses': 'جميع الحالات',
  'ticketList.allPriorities': 'جميع الأولويات',
  'ticketList.allSla': 'جميع حالات SLA',
  'ticketList.clearFilters': 'إعادة ضبط',
  'ticketList.colNumber': 'رقم التذكرة',
  'ticketList.colTitle': 'عنوان الطلب والمشكلة',
  'ticketList.colPriority': 'الأولوية',
  'ticketList.colStatus': 'الحالة',
  'ticketList.colSla': 'حالة SLA',
  'ticketList.colAssignee': 'الفني المسؤول',
  'ticketList.colCreatedAt': 'تاريخ الإنشاء',
  'ticketList.pageOf': 'صفحة {page} من {totalPages} ({total} تذكرة)',
  'ticketList.prev': 'السابق',
  'ticketList.next': 'التالي',
  'ticketList.noTickets': 'لا توجد تذاكر تطابق معايير البحث.',

  // Ticket Detail
  'ticketDetail.queue': 'طابور التذاكر',
  'ticketDetail.refresh': 'تحديث',
  'ticketDetail.requester': 'مقدم الطلب',
  'ticketDetail.email': 'البريد',
  'ticketDetail.createdAt': 'تاريخ الإنشاء',
  'ticketDetail.resolvedAt': 'تاريخ الحل',
  'ticketDetail.resolutionSummary': 'ملخص خطوات الحل',
  'ticketDetail.commentsTab': 'الملاحظات والنقاش',
  'ticketDetail.worklogsTab': 'سجل ساعات العمل',
  'ticketDetail.auditTab': 'سجل التتبع والتدقيق',
  'ticketDetail.noComments': 'لا توجد ملاحظات أو ردود بعد.',
  'ticketDetail.addComment': 'إضافة رد أو ملاحظة',
  'ticketDetail.commentPlaceholder': 'اكتب ردك أو تقريرك هنا...',
  'ticketDetail.internalNote': 'ملاحظة داخلية (مرئية للفريق الفني فقط)',
  'ticketDetail.sendComment': 'إرسال الرد',
  'ticketDetail.internalBadge': 'داخلية',
  'ticketDetail.noWorklogs': 'لا توجد ساعات عمل مسجلة حتى الآن.',
  'ticketDetail.logWork': 'تسجيل وقت العمل الفعلي',
  'ticketDetail.minutesPlaceholder': 'الدقائق (مثال: 30)',
  'ticketDetail.workDescPlaceholder': 'وصف الإجراء الفني المنفذ...',
  'ticketDetail.saveWork': 'تسجيل الوقت',
  'ticketDetail.noAudit': 'لا يوجد سجل تدقيق متاح.',
  'ticketDetail.auditBy': 'بواسطة',

  // Ticket Detail - Sidebar Inspector
  'ticketDetail.detailsHeader': 'بيانات التوجيه والإسناد',
  'ticketDetail.assignee': 'الفني المسؤول',
  'ticketDetail.team': 'الفريق الداعم',
  'ticketDetail.category': 'التصنيف الرئيسي',
  'ticketDetail.service': 'الخدمة الفرعية',
  'ticketDetail.quickAssign': 'إسناد التذكرة لفني',
  'ticketDetail.selectAgent': 'اختر الفني...',
  'ticketDetail.assignBtn': 'إسناد',

  // Ticket Detail - SLA Inspector
  'ticketDetail.slaHeader': 'صحة اتفاقية مستوى الخدمة',
  'ticketDetail.resolutionDeadline': 'الموعد النهائي للحل',
  'ticketDetail.elapsedTime': 'الوقت المنقضي',
  'ticketDetail.firstResponse': 'مهلة الاستجابة الأولى',
  'ticketDetail.responded': 'تمت الاستجابة',
  'ticketDetail.escalatedWarning': 'تم التصعيد التلقائي بسبب تجاوز مهلة الـ SLA',

  // State Stepper
  'stepper.title': 'مسار آلة الحالات (ITIL State Machine)',
  'stepper.desc': 'مخطط بصري تفاعلي يراقب انتقال التذكرة عبر محطات دورة العمل وفق قواعد التحقق الصارمة.',
  'stepper.currentStage': 'المرحلة الحالية',
  'stepper.moveHere': 'نقل إلى هنا',
  'stepper.branchHeader': 'المسارات الاستثنائية والتعليق:',
  'stepper.branchDesc': 'تعليق المهلة بانتظار إفادة الموظف أو إعادة الفتح بعد الحل',
  'stepper.waitingForUser': 'بانتظار الموظف (Waiting for User)',
  'stepper.waitingForUserDesc': 'تعليق احتساب المهلة مؤقتاً لحين استلام رد الموظف',
  'stepper.suspendBtn': 'تعليق التذكرة',
  'stepper.suspendedBadge': 'قيد التعليق حالياً',
  'stepper.reopen': 'إعادة فتح (Reopen)',
  'stepper.reopenDesc': 'إذا تكررت المشكلة أو لم يتم الحل بالشكل المطلوب',
  'stepper.reopenBtn': 'إعادة الفتح',
  'stepper.reopenedBadge': 'معاد فتحها',
  'stepper.stepOpen': 'جديدة',
  'stepper.stepOpenSub': 'Open Incident',
  'stepper.stepAssigned': 'مسندة',
  'stepper.stepAssignedSub': 'Assigned to Agent',
  'stepper.stepInProgress': 'قيد المعالجة',
  'stepper.stepInProgressSub': 'In Progress',
  'stepper.stepResolved': 'تم الحل',
  'stepper.stepResolvedSub': 'Resolved & Fixed',
  'stepper.stepClosed': 'مغلقة نهائياً',
  'stepper.stepClosedSub': 'Closed & Archived',

  // Resolve Modal
  'modal.resolveTitle': 'توثيق وتسجيل حل التذكرة',
  'modal.resolveDesc': 'يرجى كتابة ملخص الإجراء التقني المتخذ لحل المشكلة لتوثيقها في قاعدة المعرفة.',
  'modal.resolvePlaceholder': 'مثال: تم إعادة تهيئة الصلاحيات وتحديث إعدادات خادم الاتصال...',
  'modal.confirmResolve': 'تأكيد وإغلاق المشكلة',

  // AI Agentic Command Center
  'aiAgent.header': 'مركز الذكاء الاصطناعي المستقل (Agentic AI)',
  'aiAgent.subHeader': 'نظام متعدد الوكلاء (Multi-Agent State Machine) للفرز والتشخيص والاستجابة الفورية مع معيار التحقق البشري (HITL).',
  'aiAgent.runDiagnosis': 'تشغيل شبكة الوكلاء (Run AI Diagnosis)',
  'aiAgent.running': 'جاري استدعاء الأدوات وتحليل مسار التفكير...',
  'aiAgent.statusActive': 'الوكيل المستقل نشط',
  'aiAgent.confidence': 'نسبة الثقة',
  'aiAgent.predictedCategory': 'التصنيف المكتشف',
  'aiAgent.calculatedPriority': 'الأولوية المحسوبة',
  'aiAgent.suggestedTeam': 'الفريق الموجه إليه',
  'aiAgent.trajectoryTitle': 'مسار تفكير الوكلاء (Reasoning Trajectory)',
  'aiAgent.trajectoryDesc': 'سجل تفاعلي يعرض كل خطوة اتخذها الوكلاء مع الأدوات المستدعاة والملاحظات.',
  'aiAgent.rootCauseTitle': 'السبب الجذري المستنتج (RCA)',
  'aiAgent.solutionTitle': 'الحل الموصى به والخطوات التنفيذية',
  'aiAgent.hitlBanner': 'بوابة الرقابة البشرية (Human-in-the-Loop): يتطلب هذا الإجراء موافقة الفني لضمان الجودة قبل تطبيقه.',
  'aiAgent.approveBtn': 'اعتماد الحل وإغلاق التذكرة (Approve & Resolve)',
  'aiAgent.approving': 'جاري اعتماد وتطبيق الحل...',
  'aiAgent.approvedBadge': 'تم اعتماد هذا الحل من قبل الفني',
  'aiAgent.toolsUsed': 'الأدوات المشغلة',
  'aiAgent.kbMatched': 'المقالات المتطابقة من قاعدة المعرفة',

  // Ticket Create
  'ticketCreate.title': 'إنشاء طلب أو بلاغ عطل جديد',
  'ticketCreate.back': 'العودة للطابور',
  'ticketCreate.titleLabel': 'عنوان البلاغ / الطلب *',
  'ticketCreate.titlePlaceholder': 'مثال: انقطاع الاتصال بشبكة VPN الخاصة بمقر العمل',
  'ticketCreate.categoryLabel': 'التصنيف الرئيسي *',
  'ticketCreate.selectCategory': 'اختر التصنيف...',
  'ticketCreate.serviceLabel': 'الخدمة الفرعية',
  'ticketCreate.selectService': 'اختر الخدمة الفرعية...',
  'ticketCreate.priorityLabel': 'مستوى الأولوية والخطورة *',
  'ticketCreate.slaCommitment': 'مهلة الحل المستهدفة:',
  'ticketCreate.slaMonitoring': 'المراقبة الآلية للتصعيد مفعلة',
  'ticketCreate.descLabel': 'تفاصيل البلاغ والأعراض الظاهرة *',
  'ticketCreate.descPlaceholder': 'يرجى ذكر رمز الخطأ، خطوات إعادة المشكلة، وتأثيرها على سير العمل...',
  'ticketCreate.submitBtn': 'إنشاء التذكرة الآن',
  'ticketCreate.submitting': 'جاري الإنشاء...',

  // Login
  'login.title': 'ServiceDesk',
  'login.subtitle': 'نظام إدارة طلبات وتذاكر الدعم الفني ومحرك اتفاقيات الـ SLA التلقائي',
  'login.username': 'اسم المستخدم',
  'login.usernamePlaceholder': 'manager, lead, agent, employee',
  'login.password': 'كلمة المرور',
  'login.submit': 'تسجيل الدخول',
  'login.submitting': 'جاري التحقق والربط...',
  'login.demoSection': 'تسجيل دخول تجريبي فوري (نقرة واحدة)',
  'login.roleManager': 'مدير الخدمة',
  'login.roleManagerBadge': 'كامل الصلاحيات',
  'login.roleLead': 'رئيس الفريق',
  'login.roleLeadBadge': 'إدارة وتوزيع',
  'login.roleAgent': 'فني الدعم',
  'login.roleAgentBadge': 'معالجة وتحديث',
  'login.roleEmployee': 'الموظف',
  'login.roleEmployeeBadge': 'طالب الخدمة'
};

// English Translations
const EN_TRANSLATIONS: Translations = {
  // Brand & Common
  'brand.name': 'ServiceDesk',
  'common.refresh': 'Refresh',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.submit': 'Submit',
  'common.create': 'Create',
  'common.search': 'Search...',
  'common.all': 'All',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.actions': 'Actions',
  'common.loading': 'Loading...',
  'common.empty': 'No data available.',
  'common.back': 'Back',
  'common.close': 'Close',
  'common.confirm': 'Confirm',
  'common.date': 'Date',
  'common.minutes': 'mins',
  'common.hours': 'hours',
  'common.unassigned': 'Unassigned',
  'common.general': 'General',
  'common.viewAll': 'View All',

  // Navigation & Navbar
  'nav.dashboard': 'Dashboard',
  'nav.tickets': 'Tickets & Requests',
  'nav.newTicket': 'New Ticket',
  'nav.mainMenu': 'Main Menu',
  'nav.operationalFilters': 'Operational Filters',
  'nav.filterAtRisk': 'At Risk Tickets',
  'nav.filterBreached': 'SLA Breached Tickets',
  'nav.filterCritical': 'Critical Incidents',
  'nav.currentRole': 'Current Role',
  'nav.logout': 'Sign Out',
  'nav.themeDark': 'Dark Mode',
  'nav.themeLight': 'Light Mode',
  'nav.slaAlerts': 'SLA Alert',

  // Statuses
  'status.open': 'Open',
  'status.assigned': 'Assigned',
  'status.in_progress': 'In Progress',
  'status.waiting_for_user': 'Waiting for User',
  'status.resolved': 'Resolved',
  'status.closed': 'Closed',
  'status.reopened': 'Reopened',

  // Priorities
  'priority.critical': 'Critical',
  'priority.high': 'High',
  'priority.medium': 'Medium',
  'priority.low': 'Low',

  // SLA Statuses
  'sla.within_sla': 'Within SLA',
  'sla.at_risk': 'At Risk',
  'sla.breached': 'Breached',

  // Roles
  'role.service_manager': 'Service Manager',
  'role.manager': 'Service Manager',
  'role.team_lead': 'Team Lead',
  'role.lead': 'Team Lead',
  'role.support_agent': 'Support Agent',
  'role.agent': 'Support Agent',
  'role.business_employee': 'Business Employee',
  'role.employee': 'Employee',

  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Monitor incident queue, track real-time SLA metrics, and operational performance.',
  'dashboard.kpi.activeTickets': 'Total Active Tickets',
  'dashboard.kpi.activeTicketsSub': 'Open & In Progress',
  'dashboard.kpi.critical': 'Critical Incidents',
  'dashboard.kpi.criticalSub': '15m Response • 2h Resolution',
  'dashboard.kpi.slaIssues': 'At-Risk & Breached SLA',
  'dashboard.kpi.slaIssuesSub': 'Automated scheduler monitoring',
  'dashboard.kpi.compliance': 'SLA Compliance Rate',
  'dashboard.kpi.complianceSub': 'resolved tickets today',
  'dashboard.priorityBreakdown': 'Queue Priority Breakdown',
  'dashboard.totalTickets': 'Total Tickets',
  'dashboard.closedAndResolved': 'Resolved & Closed',
  'dashboard.recentTickets': 'Recent Incidents Queue',
  'dashboard.recentTicketsSub': '',
  'dashboard.slaBannerTitle': 'SLA Service Alert',
  'dashboard.slaBannerDesc': 'There are incidents that have breached or are near breaching SLA resolution targets.',
  'dashboard.showBreached': 'View Breached',
  'dashboard.showAtRisk': 'View At Risk',

  // Ticket List
  'ticketList.title': 'Incident & Request Queue',
  'ticketList.subtitle': 'Manage and track IT service requests with automated SLA compliance governance.',
  'ticketList.searchPlaceholder': 'Search by number, title, or description...',
  'ticketList.allStatuses': 'All Statuses',
  'ticketList.allPriorities': 'All Priorities',
  'ticketList.allSla': 'All SLA States',
  'ticketList.clearFilters': 'Reset Filters',
  'ticketList.colNumber': 'Ticket ID',
  'ticketList.colTitle': 'Subject & Incident Summary',
  'ticketList.colPriority': 'Priority',
  'ticketList.colStatus': 'Status',
  'ticketList.colSla': 'SLA Health',
  'ticketList.colAssignee': 'Assigned Agent',
  'ticketList.colCreatedAt': 'Created At',
  'ticketList.pageOf': 'Page {page} of {totalPages} ({total} tickets)',
  'ticketList.prev': 'Previous',
  'ticketList.next': 'Next',
  'ticketList.noTickets': 'No tickets found matching current filters.',

  // Ticket Detail
  'ticketDetail.queue': 'Tickets Queue',
  'ticketDetail.refresh': 'Refresh',
  'ticketDetail.requester': 'Requester',
  'ticketDetail.email': 'Email',
  'ticketDetail.createdAt': 'Created At',
  'ticketDetail.resolvedAt': 'Resolved At',
  'ticketDetail.resolutionSummary': 'Resolution Summary',
  'ticketDetail.commentsTab': 'Discussion & Notes',
  'ticketDetail.worklogsTab': 'Work Logs',
  'ticketDetail.auditTab': 'Audit History',
  'ticketDetail.noComments': 'No comments or notes posted yet.',
  'ticketDetail.addComment': 'Add Note / Response',
  'ticketDetail.commentPlaceholder': 'Write your reply or incident notes here...',
  'ticketDetail.internalNote': 'Internal note (visible only to support staff)',
  'ticketDetail.sendComment': 'Post Reply',
  'ticketDetail.internalBadge': 'Internal',
  'ticketDetail.noWorklogs': 'No work time logged yet.',
  'ticketDetail.logWork': 'Log Work Time',
  'ticketDetail.minutesPlaceholder': 'Minutes (e.g. 30)',
  'ticketDetail.workDescPlaceholder': 'Technical work performed summary...',
  'ticketDetail.saveWork': 'Log Time',
  'ticketDetail.noAudit': 'No audit logs recorded.',
  'ticketDetail.auditBy': 'by',

  // Ticket Detail - Sidebar Inspector
  'ticketDetail.detailsHeader': 'Routing & Assignment',
  'ticketDetail.assignee': 'Assigned Agent',
  'ticketDetail.team': 'Support Team',
  'ticketDetail.category': 'Category',
  'ticketDetail.service': 'Sub-Service',
  'ticketDetail.quickAssign': 'Reassign Ticket',
  'ticketDetail.selectAgent': 'Select agent...',
  'ticketDetail.assignBtn': 'Assign',

  // Ticket Detail - SLA Inspector
  'ticketDetail.slaHeader': 'SLA Health & Commitments',
  'ticketDetail.resolutionDeadline': 'Resolution Deadline',
  'ticketDetail.elapsedTime': 'Elapsed Time',
  'ticketDetail.firstResponse': 'First Response Target',
  'ticketDetail.responded': 'Responded',
  'ticketDetail.escalatedWarning': 'Incident auto-escalated due to SLA breach',

  // State Stepper
  'stepper.title': 'ITIL State Machine Pipeline',
  'stepper.desc': 'Interactive lifecycle pipeline tracking incident transitions according to ITIL workflow guards.',
  'stepper.currentStage': 'Current Stage',
  'stepper.moveHere': 'Move Here',
  'stepper.branchHeader': 'Auxiliary & Exception Branches:',
  'stepper.branchDesc': 'Suspend SLA while waiting for user info or reopen upon recurrence',
  'stepper.waitingForUser': 'Waiting for User',
  'stepper.waitingForUserDesc': 'SLA timer paused until requester provides requested information',
  'stepper.suspendBtn': 'Suspend Ticket',
  'stepper.suspendedBadge': 'Currently Suspended',
  'stepper.reopen': 'Reopened',
  'stepper.reopenDesc': 'If issue recurs or resolution did not resolve root cause',
  'stepper.reopenBtn': 'Reopen',
  'stepper.reopenedBadge': 'Reopened',
  'stepper.stepOpen': 'Open',
  'stepper.stepOpenSub': 'Logged',
  'stepper.stepAssigned': 'Assigned',
  'stepper.stepAssignedSub': 'Routed to Agent',
  'stepper.stepInProgress': 'In Progress',
  'stepper.stepInProgressSub': 'Active Remediation',
  'stepper.stepResolved': 'Resolved',
  'stepper.stepResolvedSub': 'Fix Documented',
  'stepper.stepClosed': 'Closed',
  'stepper.stepClosedSub': 'Archived',

  // Resolve Modal
  'modal.resolveTitle': 'Document Incident Resolution',
  'modal.resolveDesc': 'Provide technical resolution notes to document the fix in the knowledge base.',
  'modal.resolvePlaceholder': 'e.g. Cleared network cache, re-authenticated VPN credentials...',
  'modal.confirmResolve': 'Confirm & Resolve Incident',

  // AI Agentic Command Center
  'aiAgent.header': 'Autonomous AI Agent Command Center',
  'aiAgent.subHeader': 'Multi-Agent State Machine for autonomous triage, vector RAG retrieval, diagnostic probing, and Human-in-the-Loop (HITL) resolution.',
  'aiAgent.runDiagnosis': 'Run Agentic Diagnosis',
  'aiAgent.running': 'Executing Multi-Agent Graph & Tool Probing...',
  'aiAgent.statusActive': 'Autonomous Agent Online',
  'aiAgent.confidence': 'Confidence Score',
  'aiAgent.predictedCategory': 'Predicted Category',
  'aiAgent.calculatedPriority': 'Calculated Priority',
  'aiAgent.suggestedTeam': 'Dispatched Team',
  'aiAgent.trajectoryTitle': 'Multi-Agent Reasoning Trajectory',
  'aiAgent.trajectoryDesc': 'Step-by-step trace showing each sub-agent action, tool execution, and observation.',
  'aiAgent.rootCauseTitle': 'Root Cause Analysis (RCA)',
  'aiAgent.solutionTitle': 'Recommended Action Plan & Solution',
  'aiAgent.hitlBanner': 'Human-in-the-Loop Gatekeeper: Safety policy requires technician review and approval before execution.',
  'aiAgent.approveBtn': 'Approve & Resolve Ticket',
  'aiAgent.approving': 'Approving & Applying Solution...',
  'aiAgent.approvedBadge': 'Solution Approved by Technician',
  'aiAgent.toolsUsed': 'Diagnostic Tools Probed',
  'aiAgent.kbMatched': 'Matched Knowledge Base Runbooks',

  // Ticket Create
  'ticketCreate.title': 'Create New Service Request or Incident',
  'ticketCreate.back': 'Back to Queue',
  'ticketCreate.titleLabel': 'Incident / Request Title *',
  'ticketCreate.titlePlaceholder': 'e.g. Cannot connect to enterprise VPN after credential update',
  'ticketCreate.categoryLabel': 'Category *',
  'ticketCreate.selectCategory': 'Select category...',
  'ticketCreate.serviceLabel': 'Sub-Service',
  'ticketCreate.selectService': 'Select sub-service...',
  'ticketCreate.priorityLabel': 'Priority & Urgency *',
  'ticketCreate.slaCommitment': 'Target SLA Deadline:',
  'ticketCreate.slaMonitoring': 'Automated escalation monitoring enabled',
  'ticketCreate.descLabel': 'Incident Details & Description *',
  'ticketCreate.descPlaceholder': 'Please describe the issue, error codes, steps to reproduce, and impact...',
  'ticketCreate.submitBtn': 'Submit Ticket Now',
  'ticketCreate.submitting': 'Submitting...',

  // Login
  'login.title': 'ServiceDesk',
  'login.subtitle': 'Internal IT Service Management platform with automated SLA engine',
  'login.username': 'Username',
  'login.usernamePlaceholder': 'manager, lead, agent, employee',
  'login.password': 'Password',
  'login.submit': 'Sign In',
  'login.submitting': 'Authenticating...',
  'login.demoSection': 'Instant 1-Click Demo Logins',
  'login.roleManager': 'Service Manager',
  'login.roleManagerBadge': 'Full Control',
  'login.roleLead': 'Team Lead',
  'login.roleLeadBadge': 'Routing & Triage',
  'login.roleAgent': 'Support Agent',
  'login.roleAgentBadge': 'Remediation',
  'login.roleEmployee': 'Employee',
  'login.roleEmployeeBadge': 'Service Requester'
};
