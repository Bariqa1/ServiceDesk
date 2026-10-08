# ServiceDesk Architecture Documentation

## 1. System Overview
ServiceDesk is an enterprise IT service management and incident lifecycle platform built on Java 21, Spring Boot 3, and Angular 18 (Zoneless Signals). The platform automates ITIL-aligned support workflows, enforces rigid state machines, computes real-time SLA deadlines with automated background breach escalations, and broadcasts ticket events via WebSockets (STOMP).

```
+-----------------------------------------------------------------------------------+
|                                  Browser / Client                                 |
|          Angular 18+ (Zoneless Signals, RxJS, STOMP WebSocket Client)             |
+-----------------------------------------------------------------------------------+
                                         |
                       HTTP / REST       | WebSocket (STOMP)
                    (JWT Bearer Token)   |  /ws-servicedesk
                                         v
+-----------------------------------------------------------------------------------+
|                               Spring Boot 3 Backend                               |
|                                                                                   |
|  +------------------+   +-------------------+   +------------------------------+  |
|  | Security Filter  |   | Controllers (v1)  |   | WebSocket Broker (/topic)    |  |
|  |  (JJWT HMAC-384) |-->|  REST Endpoints   |   |  - /topic/tickets            |  |
|  +------------------+   +-------------------+   |  - /topic/sla-alerts         |  |
|                                   |             +------------------------------+  |
|                                   v                            ^                  |
|                         +-------------------+                  |                  |
|                         |  Business Logic   |------------------+                  |
|                         | - TicketService   |                                     |
|                         | - SlaService      |                                     |
|                         | - UserService     |                                     |
|                         +-------------------+                                     |
|                                   |                                               |
|                                   v                                               |
|                         +-------------------+                                     |
|                         | Spring Data JPA   |                                     |
|                         | Hibernate Entities|                                     |
|                         +-------------------+                                     |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
                         +-------------------------------+
                         | PostgreSQL / H2 in-memory DB  |
                         +-------------------------------+
```

---

## 2. Domain Model & State Machine
Tickets transition through strict ITIL lifecycle states:

```
[ OPEN ] --------> [ ASSIGNED ] --------> [ IN_PROGRESS ] --------> [ RESOLVED ] --------> [ CLOSED ]
   |                                            |                        |
   |                                            v                        v
   +----------------------------------> [ WAITING_FOR_USER ]       [ REOPENED ]
```

### State Transition Validation Rules:
- `OPEN` -> `ASSIGNED`, `IN_PROGRESS`
- `ASSIGNED` -> `IN_PROGRESS`
- `IN_PROGRESS` -> `WAITING_FOR_USER`, `RESOLVED`
- `WAITING_FOR_USER` -> `IN_PROGRESS`, `RESOLVED`
- `RESOLVED` -> `CLOSED`, `REOPENED`
- `CLOSED` -> `REOPENED`
- `REOPENED` -> `IN_PROGRESS`

---

## 3. SLA Calculation & Scheduled Escalation Engine
- **SLA Policies:**
  - `CRITICAL`: First response 15 min, Resolution 2 hours
  - `HIGH`: First response 30 min, Resolution 4 hours
  - `MEDIUM`: First response 2 hours, Resolution 8 hours
  - `LOW`: First response 4 hours, Resolution 24 hours
- **SLA Status:**
  - `WITHIN_SLA`: Elapsed time < 75% of target
  - `AT_RISK`: Elapsed time >= 75% of target
  - `BREACHED`: Elapsed time >= 100% of target
- **Automated Escalation Scheduler:**
  - A `@Scheduled(fixedRate = 60000)` background task evaluates active open tickets.
  - Automatically flags breached tickets, marks `escalated = true`, records audit trail entries, and pushes real-time alert events to STOMP topic `/topic/sla-alerts`.

---

## 4. Role-Based Access Control (RBAC)
| Role | Code | Permissions |
|---|---|---|
| Business Employee | `ROLE_EMPLOYEE` | Create tickets, view own tickets, add comments |
| Support Agent | `ROLE_AGENT` | View queue, accept tickets, update status, log work time |
| Team Lead | `ROLE_TEAM_LEAD` | Assign tickets within team, monitor team SLA performance |
| Service Manager | `ROLE_SERVICE_MANAGER` | Full operational control, SLA overrides, team configuration |
