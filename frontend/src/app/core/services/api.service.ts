import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Category,
  DashboardMetrics,
  PageResponse,
  ServiceEntity,
  Team,
  Ticket,
  TicketComment,
  UserSummary,
  WorkLog,
  AiAgentAnalysisResponse,
  AiAuditLog
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  // Dashboard
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.baseUrl}/dashboard`);
  }

  // Tickets
  getTickets(
    page: number = 0,
    size: number = 10,
    filters?: {
      status?: string;
      priority?: string;
      slaStatus?: string;
      categoryPublicId?: string;
      assignedAgentPublicId?: string;
      requesterPublicId?: string;
      search?: string;
    }
  ): Observable<PageResponse<Ticket>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.slaStatus) params = params.set('slaStatus', filters.slaStatus);
      if (filters.categoryPublicId) params = params.set('categoryPublicId', filters.categoryPublicId);
      if (filters.assignedAgentPublicId) params = params.set('assignedAgentPublicId', filters.assignedAgentPublicId);
      if (filters.requesterPublicId) params = params.set('requesterPublicId', filters.requesterPublicId);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<PageResponse<Ticket>>(`${this.baseUrl}/tickets`, { params });
  }

  getTicket(publicId: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl}/tickets/${publicId}`);
  }

  createTicket(payload: {
    title: string;
    description: string;
    priority: string;
    categoryPublicId: string;
    servicePublicId?: string;
  }): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/tickets`, payload);
  }

  assignTicket(publicId: string, payload: { agentPublicId: string; teamPublicId?: string }): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/tickets/${publicId}/assign`, payload);
  }

  updateTicketStatus(publicId: string, payload: { status: string; reason?: string }): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/tickets/${publicId}/status`, payload);
  }

  resolveTicket(publicId: string, payload: { resolutionSummary: string }): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/tickets/${publicId}/resolve`, payload);
  }

  addComment(publicId: string, payload: { content: string; internal: boolean }): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.baseUrl}/tickets/${publicId}/comments`, payload);
  }

  addWorkLog(publicId: string, payload: { timeSpentMinutes: number; description: string }): Observable<WorkLog> {
    return this.http.post<WorkLog>(`${this.baseUrl}/tickets/${publicId}/worklogs`, payload);
  }

  // Categories & Services
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  getServicesByCategory(categoryPublicId: string): Observable<ServiceEntity[]> {
    return this.http.get<ServiceEntity[]>(`${this.baseUrl}/categories/${categoryPublicId}/services`);
  }

  // Users & Teams
  getAgents(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/users/agents`);
  }

  getAllTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.baseUrl}/teams`);
  }

  // Autonomous Multi-Agent AI
  diagnoseTicketWithAi(publicId: string): Observable<AiAgentAnalysisResponse> {
    return this.http.post<AiAgentAnalysisResponse>(`${this.baseUrl}/tickets/${publicId}/ai/diagnose`, {});
  }

  approveAiProposal(publicId: string, action: string = 'RESOLVE', notes?: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/tickets/${publicId}/ai/approve`, { action, notes });
  }

  getTicketAiHistory(publicId: string): Observable<AiAuditLog[]> {
    return this.http.get<AiAuditLog[]>(`${this.baseUrl}/tickets/${publicId}/ai/history`);
  }
}
