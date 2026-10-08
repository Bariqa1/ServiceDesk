# ServiceDesk REST API Specification

Base URL: `/api/v1`

## 1. Authentication Endpoints
- `POST /auth/login` - Authenticate user and receive JWT bearer token.
- `POST /auth/register` - Register a new employee account.
- `GET /auth/me` - Get profile of the currently authenticated user.

## 2. Dashboard Endpoints
- `GET /dashboard` - Get executive operational KPIs, queue distribution, and SLA compliance metrics.

## 3. Ticket Management Endpoints
- `GET /tickets` - Paginated ticket listing with search and multi-criteria filters (`status`, `priority`, `slaStatus`, `categoryPublicId`, `assignedAgentPublicId`).
- `GET /tickets/{publicId}` - Get full ticket details with comments, work logs, and audit trail.
- `POST /tickets` - Create a new incident or service request.
- `POST /tickets/{publicId}/assign` - Assign ticket to an agent or team.
- `PATCH /tickets/{publicId}/status` - Transition ticket status through the state machine.
- `POST /tickets/{publicId}/resolve` - Mark ticket as resolved with resolution notes.
- `POST /tickets/{publicId}/comments` - Add a public reply or internal note.
- `POST /tickets/{publicId}/worklogs` - Log time spent on ticket.

## 4. Master Data Endpoints
- `GET /categories` - List all support categories.
- `GET /categories/{publicId}/services` - List service items under a category.
- `GET /teams` - List support teams and assigned leads.
- `GET /users/agents` - List active support agents.

## 5. WebSocket STOMP Topics
- `ws://localhost:8081/ws-servicedesk` - STOMP connection endpoint.
- `/topic/tickets` - Broadcast feed for ticket creation and lifecycle events.
- `/topic/sla-alerts` - Broadcast feed for automated SLA breaches and escalations.
