import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardMetrics, Ticket, TicketEvent } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- Top Overview Bar -->
      <div class="page-header flex justify-between items-center mb-6">
        <div>
          <h1 class="page-title text-2xl font-bold">لوحة تحكم عمليات الخدمة والدعم (ITSM NOC)</h1>
          <p class="page-subtitle text-sm text-secondary">
            مراقبة طابور تذاكر الدعم الفني، قياس مؤشرات اتفاقيات مستوى الخدمة (SLA)، والتنبيهات المباشرة.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn btn-secondary" (click)="loadDashboard()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            تحديث
          </button>
          <a routerLink="/tickets/new" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            تذكرة جديدة
          </a>
        </div>
      </div>

      <!-- Live SLA Alert Banner if Breaches or At-Risk -->
      @if (metrics() && ((metrics()?.slaBreachedTickets ?? 0) > 0 || (metrics()?.slaAtRiskTickets ?? 0) > 0)) {
        <div class="sla-alert-card mb-6 p-4 rounded-xl border flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="breach-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <div class="font-bold text-sm">
                تنبيه اتفاقية مستوى الخدمة (SLA Alert)
              </div>
              <div class="text-xs text-secondary">
                يوجد <strong>{{ metrics()?.slaBreachedTickets }}</strong> تذكرة متجاوزة و <strong>{{ metrics()?.slaAtRiskTickets }}</strong> تذكرة مهددة بالوصول لمهلة الحل.
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a routerLink="/tickets" [queryParams]="{ slaStatus: 'BREACHED' }" class="btn btn-sm btn-outline-danger">
              عرض المتجاوزة
            </a>
            <a routerLink="/tickets" [queryParams]="{ slaStatus: 'AT_RISK' }" class="btn btn-sm btn-outline-warning">
              عرض المهددة
            </a>
          </div>
        </div>
      }

      <!-- KPI Metrics Grid -->
      <div class="grid grid-cols-1 md-grid-cols-4 gap-4 mb-6">
        <div class="kpi-card p-4 rounded-xl border">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-secondary">إجمالي التذاكر النشطة</span>
            <div class="kpi-icon-badge bg-blue-soft text-blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="6" x2="12" y2="12"></line>
                <line x1="12" y1="12" x2="16" y2="14"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-val text-2xl font-bold">{{ (metrics()?.openTickets ?? 0) + (metrics()?.inProgressTickets ?? 0) }}</div>
          <div class="kpi-sub text-xs text-secondary mt-1">
            {{ metrics()?.openTickets ?? 0 }} جديدة • {{ metrics()?.inProgressTickets ?? 0 }} قيد المعالجة
          </div>
        </div>

        <div class="kpi-card p-4 rounded-xl border">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-secondary">الحالات الحرجة (Critical)</span>
            <div class="kpi-icon-badge bg-red-soft text-red">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-val text-2xl font-bold text-red">{{ metrics()?.criticalTickets ?? 0 }}</div>
          <div class="kpi-sub text-xs text-secondary mt-1">
            مهلة استجابة 15 دقيقة • مهلة حل ساعتان
          </div>
        </div>

        <div class="kpi-card p-4 rounded-xl border">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-secondary">حالات SLA المهددة والمتجاوزة</span>
            <div class="kpi-icon-badge bg-orange-soft text-orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-val text-2xl font-bold flex items-baseline gap-2">
            <span class="text-red">{{ metrics()?.slaBreachedTickets ?? 0 }}</span>
            <span class="text-xs font-normal text-secondary">/ {{ metrics()?.slaAtRiskTickets ?? 0 }} مهددة</span>
          </div>
          <div class="kpi-sub text-xs text-secondary mt-1">
            فحص المحرك الآلي كل 60 ثانية
          </div>
        </div>

        <div class="kpi-card p-4 rounded-xl border">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-secondary">نسبة الالتزام بالـ SLA</span>
            <div class="kpi-icon-badge bg-green-soft text-green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-val text-2xl font-bold text-green">
            {{ metrics()?.slaComplianceRate ?? 100 }}%
          </div>
          <div class="kpi-sub text-xs text-secondary mt-1">
            {{ metrics()?.resolvedToday ?? 0 }} تذكرة حُلت اليوم بنجاح
          </div>
        </div>
      </div>

      <!-- Main Operational Breakdown Layout -->
      <div class="grid grid-cols-1 lg-grid-cols-3 gap-6 mb-6">
        <!-- Live Priority & Status Breakdown -->
        <div class="card p-5 rounded-xl border">
          <h2 class="text-base font-bold mb-4">توزيع الأولويات في الطابور</h2>
          
          <div class="breakdown-list flex flex-col gap-3">
            <div class="breakdown-row">
              <div class="flex justify-between text-xs font-medium mb-1">
                <span class="flex items-center gap-1.5"><span class="dot dot-red"></span> حرجة (Critical)</span>
                <span>{{ metrics()?.criticalTickets ?? 0 }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-bar bg-red" [style.width.%]="calcPercentage(metrics()?.criticalTickets)"></div>
              </div>
            </div>

            <div class="breakdown-row">
              <div class="flex justify-between text-xs font-medium mb-1">
                <span class="flex items-center gap-1.5"><span class="dot dot-orange"></span> عالية (High)</span>
                <span>{{ metrics()?.highPriorityTickets ?? 0 }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-bar bg-orange" [style.width.%]="calcPercentage(metrics()?.highPriorityTickets)"></div>
              </div>
            </div>

            <div class="breakdown-row">
              <div class="flex justify-between text-xs font-medium mb-1">
                <span class="flex items-center gap-1.5"><span class="dot dot-blue"></span> متوسطة (Medium)</span>
                <span>{{ (metrics()?.ticketsByPriority?.['MEDIUM'] ?? 0) }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-bar bg-blue" [style.width.%]="calcPercentage(metrics()?.ticketsByPriority?.['MEDIUM'])"></div>
              </div>
            </div>

            <div class="breakdown-row">
              <div class="flex justify-between text-xs font-medium mb-1">
                <span class="flex items-center gap-1.5"><span class="dot dot-gray"></span> منخفضة (Low)</span>
                <span>{{ (metrics()?.ticketsByPriority?.['LOW'] ?? 0) }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-bar bg-gray" [style.width.%]="calcPercentage(metrics()?.ticketsByPriority?.['LOW'])"></div>
              </div>
            </div>
          </div>

          <div class="divider my-4"></div>

          <div class="stats-summary-footer grid grid-cols-2 gap-3 text-center">
            <div class="p-2.5 rounded-lg bg-secondary-subtle">
              <div class="text-xs text-secondary">إجمالي التذاكر</div>
              <div class="text-lg font-bold">{{ metrics()?.totalTickets ?? 0 }}</div>
            </div>
            <div class="p-2.5 rounded-lg bg-secondary-subtle">
              <div class="text-xs text-secondary">المغلقة والمحلولة</div>
              <div class="text-lg font-bold">{{ (metrics()?.ticketsByStatus?.['RESOLVED'] ?? 0) + (metrics()?.ticketsByStatus?.['CLOSED'] ?? 0) }}</div>
            </div>
          </div>
        </div>

        <!-- Live Real-Time Feed (STOMP WebSockets) -->
        <div class="card p-5 rounded-xl border lg-col-span-2">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h2 class="text-base font-bold">طابور التذاكر الحية (Live Incident Stream)</h2>
              <p class="text-xs text-secondary">مزامنة فورية عبر STOMP WebSockets</p>
            </div>
            <a routerLink="/tickets" class="text-xs text-primary font-medium hover:underline">
              عرض الكل ({{ metrics()?.totalTickets ?? 0 }}) ←
            </a>
          </div>

          @if (recentTickets().length === 0) {
            <div class="empty-state p-8 text-center text-secondary text-sm">
              لا توجد تذاكر حالياً في الطابور.
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table w-full text-right text-xs">
                <thead>
                  <tr>
                    <th style="min-width: 140px; white-space: nowrap;">رقم التذكرة</th>
                    <th>العنوان والطلب</th>
                    <th style="min-width: 100px; white-space: nowrap;">الأولوية</th>
                    <th style="min-width: 110px; white-space: nowrap;">الحالة</th>
                    <th style="min-width: 110px; white-space: nowrap;">حالة SLA</th>
                    <th style="min-width: 130px; white-space: nowrap;">المسؤول</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of recentTickets(); track t.publicId) {
                    <tr class="hover-row">
                      <td class="font-mono font-semibold" style="white-space: nowrap;">
                        <a [routerLink]="['/tickets', t.publicId]" class="ticket-key-link">
                          {{ t.ticketNumber }}
                        </a>
                      </td>
                      <td class="max-w-xs truncate font-medium">
                        <a [routerLink]="['/tickets', t.publicId]" class="ticket-title-link">
                          {{ t.title }}
                        </a>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="'badge-priority-' + t.priority.toLowerCase()">
                          {{ t.priority }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="'badge-status-' + t.status.toLowerCase()">
                          {{ formatStatus(t.status) }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="'badge-sla-' + t.slaStatus.toLowerCase()">
                          {{ formatSla(t.slaStatus) }}
                        </span>
                      </td>
                      <td class="text-secondary">
                        {{ t.assignedAgentFullName || 'غير مسند' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      max-width: 1320px;
      margin: 0 auto;
    }
    .kpi-card {
      background: var(--bg-surface);
      border-color: var(--border-subtle);
      transition: transform 0.15s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
    }
    .kpi-icon-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sla-alert-card {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.25);
    }
    .breach-icon-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-outline-danger {
      border: 1px solid #ef4444;
      color: #ef4444;
      background: transparent;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .btn-outline-warning {
      border: 1px solid #f59e0b;
      color: #f59e0b;
      background: transparent;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .progress-track {
      height: 6px;
      background: var(--border-subtle);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot-red { background: #ef4444; }
    .dot-orange { background: #f59e0b; }
    .dot-blue { background: #3b82f6; }
    .dot-gray { background: #8E8E93; }
    .bg-red { background: #ef4444; }
    .bg-orange { background: #f59e0b; }
    .bg-blue { background: #3b82f6; }
    .bg-gray { background: #8E8E93; }
    .bg-red-soft { background: rgba(239, 68, 68, 0.12); }
    .bg-orange-soft { background: rgba(245, 158, 11, 0.12); }
    .bg-blue-soft { background: rgba(59, 130, 246, 0.12); }
    .bg-green-soft { background: rgba(16, 185, 129, 0.12); }
    .text-red { color: #ef4444; }
    .text-orange { color: #f59e0b; }
    .text-blue { color: #3b82f6; }
    .text-green { color: #10b981; }
    .bg-secondary-subtle {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
    }
    .card {
      background: var(--bg-surface);
      border-color: var(--border-subtle);
    }
    .data-table {
      border-collapse: collapse;
    }
    .data-table th {
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.75rem;
    }
    .data-table td {
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .hover-row:hover {
      background: rgba(125,125,125,0.05);
    }
    .ticket-key-link {
      color: var(--accent-primary);
      text-decoration: none;
    }
    .ticket-title-link {
      color: var(--text-primary);
      text-decoration: none;
    }
    .ticket-title-link:hover {
      color: var(--accent-primary);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .badge-priority-critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .badge-priority-high { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .badge-priority-medium { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .badge-priority-low { background: rgba(107, 114, 128, 0.15); color: #8E8E93; }

    .badge-status-open { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
    .badge-status-assigned { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
    .badge-status-in_progress { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
    .badge-status-waiting_for_user { background: rgba(107, 114, 128, 0.12); color: #8E8E93; }
    .badge-status-resolved { background: rgba(16, 185, 129, 0.12); color: #10b981; }
    .badge-status-closed { background: rgba(107, 114, 128, 0.12); color: #8E8E93; }
    .badge-status-reopened { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

    .badge-sla-within_sla { background: rgba(16, 185, 129, 0.12); color: #10b981; }
    .badge-sla-at_risk { background: rgba(245, 158, 11, 0.15); color: #f59e0b; font-weight: 700; }
    .badge-sla-breached { background: rgba(239, 68, 68, 0.18); color: #ef4444; font-weight: 700; }

    .md-grid-cols-4 {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .lg-grid-cols-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .lg-col-span-2 {
      grid-column: span 2 / span 2;
    }
    @media (max-width: 1024px) {
      .lg-grid-cols-3 { grid-template-columns: 1fr; }
      .lg-col-span-2 { grid-column: span 1 / span 1; }
    }
    @media (max-width: 768px) {
      .md-grid-cols-4 { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private ws = inject(WebSocketService);
  public auth = inject(AuthService);

  metrics = signal<DashboardMetrics | null>(null);
  recentTickets = signal<Ticket[]>([]);

  constructor() {
    effect(() => {
      const event = this.ws.latestEvent();
      if (event) {
        this.loadDashboard();
      }
    });
  }

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.api.getDashboardMetrics().subscribe(data => {
      this.metrics.set(data);
    });

    this.api.getTickets(0, 6).subscribe(res => {
      this.recentTickets.set(res.content);
    });
  }

  calcPercentage(count: number | undefined): number {
    const total = this.metrics()?.totalTickets ?? 1;
    if (!count || total === 0) return 0;
    return Math.min(100, Math.round((count / total) * 100));
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatSla(sla: string): string {
    return sla.replace(/_/g, ' ');
  }
}
