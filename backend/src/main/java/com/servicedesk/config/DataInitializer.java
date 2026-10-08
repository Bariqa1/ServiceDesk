package com.servicedesk.config;

import com.servicedesk.ticket.entity.*;
import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.repository.*;
import com.servicedesk.user.entity.Role;
import com.servicedesk.user.entity.Team;
import com.servicedesk.user.entity.User;
import com.servicedesk.user.enums.RoleType;
import com.servicedesk.user.repository.RoleRepository;
import com.servicedesk.user.repository.TeamRepository;
import com.servicedesk.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final CategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;
    private final SlaPolicyRepository slaPolicyRepository;
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized with seed data, skipping.");
            return;
        }

        log.info("Seeding ServiceDesk Enterprise Data (Roles, Users, Teams, Categories, SLA Policies, Tickets)...");

        // 1. Roles
        Role employeeRole = roleRepository.save(Role.builder().name(RoleType.ROLE_EMPLOYEE).description("Regular business employee requester").build());
        Role agentRole = roleRepository.save(Role.builder().name(RoleType.ROLE_AGENT).description("IT support specialist and resolver").build());
        Role leadRole = roleRepository.save(Role.builder().name(RoleType.ROLE_TEAM_LEAD).description("Support team supervisor and dispatcher").build());
        Role managerRole = roleRepository.save(Role.builder().name(RoleType.ROLE_SERVICE_MANAGER).description("Executive service desk director").build());

        // 2. Teams
        Team netTeam = teamRepository.save(Team.builder().name("Network & Infrastructure").description("Core networking, switches, firewalls, and VPN").build());
        Team hwTeam = teamRepository.save(Team.builder().name("Hardware & End-User Support").description("Laptops, workstations, and office peripherals").build());
        Team appTeam = teamRepository.save(Team.builder().name("Enterprise Applications & ERP").description("Internal portal, Oracle ERP, and email").build());

        // 3. Users
        User managerUser = userRepository.save(User.builder()
                .username("manager")
                .email("manager@servicedesk.local")
                .fullName("سعود بن فهد السديري")
                .passwordHash(passwordEncoder.encode("Manager@2026"))
                .department("Information Technology")
                .jobTitle("Service Desk Director")
                .roles(Set.of(managerRole, leadRole, agentRole, employeeRole))
                .build());

        User leadUser = userRepository.save(User.builder()
                .username("lead")
                .email("lead@servicedesk.local")
                .fullName("نورة بنت عبدالله العتيبي")
                .passwordHash(passwordEncoder.encode("Lead@2026"))
                .department("IT Operations")
                .jobTitle("Technical Support Team Lead")
                .team(netTeam)
                .roles(Set.of(leadRole, agentRole, employeeRole))
                .build());
        netTeam.setLead(leadUser);
        teamRepository.save(netTeam);

        User agentUser1 = userRepository.save(User.builder()
                .username("agent")
                .email("agent@servicedesk.local")
                .fullName("عبدالعزيز بن راشد الحربي")
                .passwordHash(passwordEncoder.encode("Agent@2026"))
                .department("IT Operations")
                .jobTitle("Senior Network Engineer")
                .team(netTeam)
                .roles(Set.of(agentRole, employeeRole))
                .build());

        User agentUser2 = userRepository.save(User.builder()
                .username("agent_hw")
                .email("agent_hw@servicedesk.local")
                .fullName("فيصل بن محمد الدوسري")
                .passwordHash(passwordEncoder.encode("Agent@2026"))
                .department("IT Operations")
                .jobTitle("Hardware Specialist")
                .team(hwTeam)
                .roles(Set.of(agentRole, employeeRole))
                .build());

        User employeeUser = userRepository.save(User.builder()
                .username("employee")
                .email("employee@servicedesk.local")
                .fullName("ريما بنت خالد الشمري")
                .passwordHash(passwordEncoder.encode("Emp@2026"))
                .department("Financial Operations")
                .jobTitle("Financial Analyst")
                .roles(Set.of(employeeRole))
                .build());

        // 4. SLA Policies
        SlaPolicy slaCritical = slaPolicyRepository.save(SlaPolicy.builder()
                .priority(TicketPriority.CRITICAL)
                .responseTimeMinutes(15)
                .resolutionTimeMinutes(120) // 2h
                .warningThresholdPercent(75)
                .build());

        SlaPolicy slaHigh = slaPolicyRepository.save(SlaPolicy.builder()
                .priority(TicketPriority.HIGH)
                .responseTimeMinutes(30)
                .resolutionTimeMinutes(240) // 4h
                .warningThresholdPercent(75)
                .build());

        SlaPolicy slaMed = slaPolicyRepository.save(SlaPolicy.builder()
                .priority(TicketPriority.MEDIUM)
                .responseTimeMinutes(120) // 2h
                .resolutionTimeMinutes(480) // 8h
                .warningThresholdPercent(75)
                .build());

        SlaPolicy slaLow = slaPolicyRepository.save(SlaPolicy.builder()
                .priority(TicketPriority.LOW)
                .responseTimeMinutes(240) // 4h
                .resolutionTimeMinutes(1440) // 24h
                .warningThresholdPercent(75)
                .build());

        // 5. Categories & Services
        Category catNet = categoryRepository.save(Category.builder().name("الشبكات والاتصال").code("NET").description("خدمات الإنترنت، الشبكة الداخلية، والـ VPN").iconName("network").build());
        Category catHw = categoryRepository.save(Category.builder().name("الأجهزة والملحقات").code("HW").description("صيانة الحواسيب المحمولة والطابعات").iconName("laptop").build());
        Category catSw = categoryRepository.save(Category.builder().name("البرمجيات والأنظمة").code("SW").description("برامج الأعمال وأنظمة ERP والبريد").iconName("apps").build());
        Category catIam = categoryRepository.save(Category.builder().name("الصلاحيات والحسابات").code("IAM").description("إعادة تعيين كلمات المرور وإذن الوصول").iconName("shield").build());

        ServiceEntity srvVpn = serviceRepository.save(ServiceEntity.builder().name("تهيئة والاتصال بـ VPN").category(catNet).defaultPriority(TicketPriority.HIGH).build());
        ServiceEntity srvLaptop = serviceRepository.save(ServiceEntity.builder().name("طلب صيانة شاشة / جهاز").category(catHw).defaultPriority(TicketPriority.MEDIUM).build());
        ServiceEntity srvErp = serviceRepository.save(ServiceEntity.builder().name("ترقية صلاحيات نظام ERP").category(catIam).defaultPriority(TicketPriority.HIGH).build());
        ServiceEntity srvEmail = serviceRepository.save(ServiceEntity.builder().name("انقطاع مزامنة البريد الإلكتروني").category(catSw).defaultPriority(TicketPriority.MEDIUM).build());

        // 6. Seed Tickets with Realistic Lifecycle & SLA states
        Instant now = Instant.now();

        // Ticket 1: VPN Outage (High, In Progress, Within SLA)
        Ticket t1 = Ticket.builder()
                .ticketNumber("INC-2026-0001")
                .title("انقطاع الاتصال بشبكة VPN عند العمل عن بعد")
                .description("أواجه فشل في المصادقة عند محاولة الوصول إلى خوادم المحاسبة عبر بوابة Cisco AnyConnect VPN.")
                .status(TicketStatus.IN_PROGRESS)
                .priority(TicketPriority.HIGH)
                .requester(employeeUser)
                .assignedAgent(agentUser1)
                .assignedTeam(netTeam)
                .category(catNet)
                .service(srvVpn)
                .slaPolicy(slaHigh)
                .responseDeadline(now.plus(Duration.ofMinutes(25)))
                .resolutionDeadline(now.plus(Duration.ofMinutes(190)))
                .firstRespondedAt(now.minus(Duration.ofMinutes(10)))
                .slaStatus(SlaStatus.WITHIN_SLA)
                .build();
        t1.addComment(TicketComment.builder().ticket(t1).author(employeeUser).content("يرجى الإسراع لضرورة رفع الإقفال المالي اليوم.").internal(false).build());
        t1.addComment(TicketComment.builder().ticket(t1).author(agentUser1).content("تم استلام التذكرة وفحص شهادة المصادقة، جاري تحديث الحساب على الخادم.").internal(false).build());
        t1.addWorkLog(WorkLog.builder().ticket(t1).agent(agentUser1).timeSpentMinutes(30).description("فحص سجلات RADIUS والتحقق من صلاحيات المستخدم").build());
        t1.addAuditLog(AuditLog.builder().ticket(t1).performedBy(agentUser1).action("STATUS_CHANGED").oldValue("ASSIGNED").newValue("IN_PROGRESS").details("Agent started diagnostics").build());
        ticketRepository.save(t1);

        // Ticket 2: Laptop Broken Screen (Medium, Assigned, Within SLA)
        Ticket t2 = Ticket.builder()
                .ticketNumber("INC-2026-0002")
                .title("طلب استبدال شاشة كمبيوتر محمول متضررة")
                .description("شاشة اللابتوب Dell Latitude تعرض خطوط عمودية بعد السفر وتحتاج لصيانة أو استبدال.")
                .status(TicketStatus.ASSIGNED)
                .priority(TicketPriority.MEDIUM)
                .requester(employeeUser)
                .assignedAgent(agentUser2)
                .assignedTeam(hwTeam)
                .category(catHw)
                .service(srvLaptop)
                .slaPolicy(slaMed)
                .responseDeadline(now.plus(Duration.ofMinutes(90)))
                .resolutionDeadline(now.plus(Duration.ofMinutes(400)))
                .slaStatus(SlaStatus.WITHIN_SLA)
                .build();
        t2.addAuditLog(AuditLog.builder().ticket(t2).performedBy(leadUser).action("TICKET_ASSIGNED").oldValue("Unassigned").newValue(agentUser2.getFullName()).details("Assigned to HW specialist").build());
        ticketRepository.save(t2);

        // Ticket 3: ERP Access Permission (High, Resolved)
        Ticket t3 = Ticket.builder()
                .ticketNumber("INC-2026-0003")
                .title("منح صلاحية اعتماد الميزانية في نظام ERP")
                .description("تمت ترقية الدور الوظيفي وأحتاج تفعيل شاشة مدفوعات الموردين في وحدة Oracle Financials.")
                .status(TicketStatus.RESOLVED)
                .priority(TicketPriority.HIGH)
                .requester(employeeUser)
                .assignedAgent(agentUser1)
                .assignedTeam(appTeam)
                .category(catIam)
                .service(srvErp)
                .slaPolicy(slaHigh)
                .responseDeadline(now.minus(Duration.ofHours(4)))
                .resolutionDeadline(now.minus(Duration.ofHours(1)))
                .firstRespondedAt(now.minus(Duration.ofHours(3)))
                .resolvedAt(now.minus(Duration.ofMinutes(40)))
                .slaStatus(SlaStatus.WITHIN_SLA)
                .resolutionSummary("تمت المصادقة على طلب الترقية من مدير الإدارة وتفعيل دور Financial_Approver بنجاح.")
                .build();
        t3.addComment(TicketComment.builder().ticket(t3).author(agentUser1).content("تم منح الصلاحيات المطلوبة، يمكنك تسجيل الخروج وإعادة الدخول لتفعيلها.").internal(false).build());
        t3.addAuditLog(AuditLog.builder().ticket(t3).performedBy(agentUser1).action("TICKET_RESOLVED").oldValue("IN_PROGRESS").newValue("RESOLVED").details("Approved and applied").build());
        ticketRepository.save(t3);

        // Ticket 4: Email Sync Issue (Low, Open, At Risk)
        Ticket t4 = Ticket.builder()
                .ticketNumber("INC-2026-0004")
                .title("عدم وصول رسائل التنبيهات من البريد الخارجي")
                .description("رسائل البريد من الموردين تتأخر في الوصول إلى صندوق الوارد Outlook.")
                .status(TicketStatus.OPEN)
                .priority(TicketPriority.LOW)
                .requester(employeeUser)
                .category(catSw)
                .service(srvEmail)
                .slaPolicy(slaLow)
                .responseDeadline(now.minus(Duration.ofMinutes(10)))
                .resolutionDeadline(now.plus(Duration.ofMinutes(60)))
                .slaStatus(SlaStatus.AT_RISK)
                .build();
        t4.addAuditLog(AuditLog.builder().ticket(t4).action("SLA_WARNING_TRIGGERED").oldValue("WITHIN_SLA").newValue("AT_RISK").details("SLA elapsed > 75%").build());
        ticketRepository.save(t4);

        // Ticket 5: Critical Outage Breached & Escalated
        Ticket t5 = Ticket.builder()
                .ticketNumber("INC-2026-0005")
                .title("توقف بوابة الفواتير الإلكترونية ZATCA عن معالجة الطلبات")
                .description("بوابة الربط مع الفاتورة الإلكترونية تعطي خطأ 504 Gateway Timeout وتوقف إصدار الفواتير الضريبية.")
                .status(TicketStatus.IN_PROGRESS)
                .priority(TicketPriority.CRITICAL)
                .requester(employeeUser)
                .assignedAgent(agentUser1)
                .assignedTeam(netTeam)
                .category(catNet)
                .service(srvVpn)
                .slaPolicy(slaCritical)
                .responseDeadline(now.minus(Duration.ofHours(3)))
                .resolutionDeadline(now.minus(Duration.ofHours(1)))
                .firstRespondedAt(now.minus(Duration.ofHours(2)))
                .slaStatus(SlaStatus.BREACHED)
                .escalated(true)
                .escalationReason("Automated SLA Breach: Critical resolution deadline exceeded.")
                .build();
        t5.addAuditLog(AuditLog.builder().ticket(t5).action("SLA_BREACH_AUTO_ESCALATED").oldValue("AT_RISK").newValue("BREACHED").details("Auto-escalated to Service Manager due to SLA breach.").build());
        ticketRepository.save(t5);

        log.info("ServiceDesk initialization complete: 4 Users, 3 Teams, 5 Seed Tickets with SLA states.");
    }
}
