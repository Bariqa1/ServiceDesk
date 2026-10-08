# ServiceDesk

ServiceDesk is an enterprise IT Service Management (ITSM) and Incident Lifecycle platform built with Java 21, Spring Boot 3, and Angular 18. The system enforces ITIL support workflows, automated SLA tracking, background escalation engines, and real-time STOMP WebSocket synchronization.

---

## Key Features

- **ITIL Incident Lifecycle Management**: Structured state machine transitioning tickets through `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`, and `REOPENED`.
- **Automated SLA Calculation & Escalation**: Dynamic resolution and response deadline calculation per priority level with automated background scheduler evaluating breach conditions every 60 seconds.
- **Real-Time WebSocket Synchronization**: STOMP message broker broadcasting live ticket events and SLA breach alerts without polling.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Business Employees, Support Agents, Team Leads, and Service Managers.
- **Internal Collaboration & Work Logs**: Threaded comments with private internal note toggles and agent time tracking.
- **Immutable Audit Logging**: Automatic history tracking of every assignment, status change, and SLA escalation.
- **Apple-Minimalist Frontend**: High-contrast, responsive user interface with live SLA progress indicators and Light/Dark themes.

---

## Technology Stack

### Backend
- **Java 21 LTS**
- **Spring Boot 3.3.4** (Spring Web, Spring Security, Spring Data JPA, Spring WebSocket)
- **Database**: PostgreSQL 16 (Production) / H2 in-memory (Testing)
- **Security**: JWT Authentication (HMAC-SHA384) + BCrypt Password Encoder
- **Messaging**: Spring STOMP WebSocket Broker (`/ws-servicedesk`)
- **Testing**: JUnit 5, Mockito, AssertJ, MockMvc

### Frontend
- **Angular 18+** (Zoneless Architecture, Signals, RxJS)
- **WebSockets**: `@stomp/stompjs` client
- **Styling**: Vanilla CSS Apple-minimalist Design System (Light/Dark mode)

---

## Project Structure

```
ServiceDesk/
├── backend/
│   ├── src/main/java/com/servicedesk/
│   │   ├── common/             # Base entities, DTOs, GlobalExceptionHandler
│   │   ├── config/             # SecurityConfig, WebSocketConfig, DataInitializer
│   │   ├── dashboard/          # Dashboard metrics controller & service
│   │   ├── masterdata/         # Categories, Services, Teams controllers & entities
│   │   ├── security/           # JWT provider, filter, UserPrincipal
│   │   ├── sla/                # SlaCalculationService, SlaMonitoringService, SlaScheduler
│   │   ├── ticket/             # TicketController, TicketService, Entities, DTOs
│   │   ├── user/               # UserController, UserService, Role, User
│   │   └── websocket/          # STOMP broadcaster & TicketEventDTO
│   └── src/test/java/          # JUnit 5 & Mockito test suite
├── frontend/
│   ├── src/app/
│   │   ├── core/               # AuthService, ApiService, WebSocketService, Models
│   │   ├── features/           # Dashboard, TicketList, TicketDetail, TicketCreate, Login
│   │   └── shared/             # Navbar, Sidebar, ThemeService
├── docs/                       # Architecture, Requirements, and API documentation
└── docker-compose.yml          # Container configuration for PostgreSQL
```

---

## Getting Started

### Prerequisites
- JDK 21+
- Apache Maven 3.9+
- Node.js 20+ and npm 10+
- PostgreSQL 16+ (or use built-in H2 test profile)

### 1. Database Setup
Using Docker Compose:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
mvn clean spring-boot:run
```
Backend will start on `http://localhost:8081`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend will start on `http://localhost:4201`.

---

## Pre-Configured Demo Credentials

| Role | Username | Password | Operational Scope |
|---|---|---|---|
| Service Manager | `manager` | `Manager@2026` | Full operational oversight, SLA configuration |
| Team Lead | `lead` | `Lead@2026` | Team dispatching, SLA queue monitoring |
| Support Agent | `agent` | `Agent@2026` | Incident triage, status transitions, work logging |
| Employee | `employee` | `Emp@2026` | Incident creation, ticket tracking |

---

## Automated Test Execution

Run the backend unit and integration test suite:
```bash
cd backend
mvn clean test
```

Build the frontend bundle:
```bash
cd frontend
npm run build
```

---

## License
MIT License.
