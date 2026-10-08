# ServiceDesk Requirements & Specification

## 1. Functional Requirements

### 1.1 Authentication & User Management
- Secure JWT-based authentication using HMAC-SHA384 tokens.
- Role-based authorization for 4 distinct personas (`EMPLOYEE`, `AGENT`, `TEAM_LEAD`, `SERVICE_MANAGER`).
- Team management with designated team leaders and department routing.

### 1.2 Ticket & Incident Lifecycle
- Categorization with two-level hierarchy (Category -> Service Item).
- Four priority levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Strict state machine validation preventing unauthorized state skips.
- Real-time comment threads with support for private internal notes.
- Work log tracking recording time spent in minutes per agent.
- Complete immutable audit logging of every status modification and assignment change.

### 1.3 Service Level Agreement (SLA) Engine
- Priority-specific SLA calculation for first response and resolution deadlines.
- Real-time SLA progress calculation (percentage elapsed).
- Automatic scheduled monitoring evaluating breach conditions every 60 seconds.
- Automated escalation flagging on breach with event broadcasting.

### 1.4 Real-Time WebSockets
- STOMP over WebSocket broker running at `/ws-servicedesk`.
- Instant push notifications on ticket creation, assignment, and status transitions (`/topic/tickets`).
- Instant push notifications on SLA breach alerts (`/topic/sla-alerts`).

---

## 2. Non-Functional Requirements
- **Performance:** Sub-100ms API response time with optimized JPA `@EntityGraph` and indexed queries.
- **Reliability:** Background scheduler isolated from web request threads.
- **Maintainability:** Modular clean architecture adhering to single-responsibility principle and DDD patterns.
- **Security:** CSRF protection, CORS policies, password hashing with BCrypt, strict input validation with Hibernate Validator.
