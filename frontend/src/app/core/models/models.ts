export type RoleType = 'ROLE_EMPLOYEE' | 'ROLE_AGENT' | 'ROLE_TEAM_LEAD' | 'ROLE_SERVICE_MANAGER';

export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SlaStatus = 'WITHIN_SLA' | 'AT_RISK' | 'BREACHED';

export interface UserSummary {
  publicId: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  teamName?: string;
  teamPublicId?: string;
  roles: RoleType[];
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface Team {
  publicId: string;
  name: string;
  description: string;
  leadFullName?: string;
  leadPublicId?: string;
  membersCount: number;
}

export interface Category {
  publicId: string;
  name: string;
  code: string;
  description: string;
  iconName?: string;
}

export interface ServiceEntity {
  publicId: string;
  name: string;
  description: string;
  categoryName: string;
  categoryPublicId: string;
  defaultPriority: TicketPriority;
}

export interface TicketComment {
  publicId: string;
  authorFullName: string;
  authorUsername: string;
  authorPublicId: string;
  content: string;
  internal: boolean;
  createdAt: string;
}

export interface WorkLog {
  publicId: string;
  agentFullName: string;
  agentPublicId: string;
  timeSpentMinutes: number;
  description: string;
  loggedAt: string;
}

export interface AuditLog {
  publicId: string;
  performedByFullName: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  timestamp: string;
}

export interface Ticket {
  publicId: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;

  requesterFullName: string;
  requesterEmail: string;
  requesterDepartment?: string;
  requesterPublicId: string;

  assignedAgentFullName?: string;
  assignedAgentPublicId?: string;
  assignedTeamName?: string;
  assignedTeamPublicId?: string;

  categoryName: string;
  categoryCode: string;
  categoryPublicId: string;
  serviceName?: string;
  servicePublicId?: string;

  slaStatus: SlaStatus;
  escalated: boolean;
  escalationReason?: string;
  responseDeadline?: string;
  resolutionDeadline?: string;
  slaElapsedPercent: number;
  firstRespondedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionSummary?: string;

  createdAt: string;
  updatedAt: string;

  comments?: TicketComment[];
  workLogs?: WorkLog[];
  auditLogs?: AuditLog[];
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  criticalTickets: number;
  highPriorityTickets: number;
  slaAtRiskTickets: number;
  slaBreachedTickets: number;
  resolvedToday: number;
  slaComplianceRate: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByCategory: Record<string, number>;
}

export interface TicketEvent {
  eventType: string;
  ticketPublicId: string;
  ticketNumber: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaStatus: SlaStatus;
  assignedAgentName: string;
  requesterName: string;
  message: string;
  timestamp: string;
}
