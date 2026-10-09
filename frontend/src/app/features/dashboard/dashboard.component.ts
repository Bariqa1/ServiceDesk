import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { DashboardMetrics, Ticket } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- Top Overview Bar -->
      <div class="page-header flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 class="page-title text-xl font-bold tracking-tight">{{ i18n.t('dashboard.title') }}</h1>
          <p class="page-subtitle text-xs text-secondary mt-0.5">
            {{ i18n.t('dashboard.subtitle') }}
          </p>
        </div>
        <div class="flex items-center gap-2.5">
          <button class="btn btn-secondary btn-sm" (click)="loadDashboard()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>{{ i18n.t('common.refresh') }}</span>
          </button>
          <a routerLink="/tickets/new" class="btn btn-primary btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{{ i18n.t('nav.newTicket') }}</span>
          </a>
        </div>
      </div>

      <!-- Live SLA Alert Banner if Breaches or At-Risk -->
      @if (metrics() && ((metrics()?.slaBreachedTickets ?? 0) > 0 || (metrics()?.slaAtRiskTickets ?? 0) > 0)) {
        <div class="sla-alert-card p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="breach-icon-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <div class="font-bold text-xs text-primary">
                {{ i18n.t('dashboard.slaBannerTitle') }}
              </div>
              <div class="text-[11px] text-secondary">
                {{ i18n.t('dashboard.slaBannerDesc') }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a routerLink="/tickets" [queryParams]="{ slaStatus: 'BREACHED' }" class="btn btn-sm btn-outline-danger">
              {{ i18n.t('dashboard.showBreached') }} ({{ metrics()?.slaBreachedTickets }})
            </a>
            <a routerLink="/tickets" [queryParams]="{ slaStatus: 'AT_RISK' }" class="btn btn-sm btn-outline-warning">
              {{ i18n.t('dashboard.showAtRisk') }} ({{ metrics()?.slaAtRiskTickets }})
            </a>
          </div>
        </div>
      }

      <!-- KPI Metrics Grid (Apple Clean 4 Cards) -->
      <div class="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-4 gap-4">
        <div class="kpi-card p-4 rounded-xl border">
          <div class="flex justify-between items-start mb-1.5">
            <span class="text-xs font-semibold text-secondary">{{ i18n.t('dashboard.kpi.activeTickets') }}</span>
            <div class="kpi-icon-badge bg-blue-soft text-blue">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="6" x2="12" y2="12"></line>
                <line x1="12" y1="12" x2="16" y2="14"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-val text-2xl font-bold">{{ (metrics()?.openTickets ?? 0) + (metrics()?.inProgressTickets ?? 0) }}</div>
          <div class="kpi-sub text-[11px] text-secondary mt-0.5">
            {{ metrics()?.openTickets ?? 0 }} {{ i18n.t('status.open') }} • {{ metrics()?.inProgressTickets ?? 0 }} {{ i18n.t('status.in_progress') }}
          </div>
        </div>

        <div class="kpi-card p-4 rounded-xl border">
          <div class="flex justify-between items-start mb-1.5">
            <span class="text-xs font-semibold text-secondary">{{ i18n.t('dashboard.kpi.critical') }}</span>
            <div class="kpi-icon-badge bg-red-soft text-red">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-val text-2xl font-bold text-red">{{ metrics()?.criticalTickets ?? 0 }}</div>
          <div class="kpi-sub text-[11px] text-secondary mt-0.5">
            {{ i18n.t('dashboard.kpi.criticalSub') }}
          </div>
        </div>

        <div class="kpi-card p-4 rounded-xl border">
          <div class="flex justify-between items-start mb-1.5">
            <span class="text-xs font-semibold text-secondary">{{ i18n.t('dashboard.kpi.slaIssues') }}</span>
            <div class="kpi-icon-badge bg-orange-soft text-orange">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-val text-2xl font-bold flex items-baseline gap-2">
            <span class="text-red">{{ metrics()?.slaBreachedTickets ?? 0 }}</span>
            <span class="text-xs font-normal text-secondary">/ {{ metrics()?.slaAtRiskTickets ?? 0 }} {{ i18n.t('sla.at_risk') }}</span>
          </div>
          <div class="kpi-sub text-[11px] text-secondary mt-0.5">
            {{ i18n.t('dashboard.kpi.slaIssuesSub') }}
          </div>
        </div>

        <div class="kpi-card p-4 rounded-xl border">
          <div class="flex justify-between items-start mb-1.5">
            <span class="text-xs font-semibold text-secondary">{{ i18n.t('dashboard.kpi.compliance') }}</span>
            <div class="kpi-icon-badge bg-green-soft text-green">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-val text-2xl font-bold text-green">
            {{ metrics()?.slaComplianceRate ?? 100 }}%
          </div>
          <div class="kpi-sub text-[11px] text-secondary mt-0.5">
            {{ metrics()?.resolvedToday ?? 0 }} {{ i18n.t('dashboard.kpi.complianceSub') }}
          </div>
        </div>
      </div>

      <!-- Full-Width Recent Incidents Queue (CLEAN, WIDE, NO AWKWARD SIDE BLOCKS) -->
      <div class="card p-4 rounded-xl border">
        <!-- Table Header & Quick Priority Filter Pills -->
        <div class="flex flex-wrap justify-between items-center gap-3 mb-3.5 pb-2.5 border-b">
          <div class="flex items-center gap-2.5">
            <h2 class="text-sm font-bold text-primary">{{ i18n.t('dashboard.recentTickets') }}</h2>
          </div>

          <!-- Clean Inline Priority Quick Summary -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="priority-pill red-pill">
              {{ i18n.formatPriority('CRITICAL') }}: {{ metrics()?.criticalTickets ?? 0 }}
            </span>
            <span class="priority-pill orange-pill">
              {{ i18n.formatPriority('HIGH') }}: {{ metrics()?.highPriorityTickets ?? 0 }}
            </span>
            <span class="priority-pill blue-pill">
              {{ i18n.formatPriority('MEDIUM') }}: {{ (metrics()?.ticketsByPriority?.['MEDIUM'] ?? 0) }}
            </span>
            <span class="priority-pill gray-pill">
              {{ i18n.formatPriority('LOW') }}: {{ (metrics()?.ticketsByPriority?.['LOW'] ?? 0) }}
            </span>

            <div class="h-4 w-px bg-border-subtle mx-1"></div>

            <a routerLink="/tickets" class="text-xs text-primary font-semibold hover:underline">
              {{ i18n.t('common.viewAll') }} ({{ metrics()?.totalTickets ?? 0 }}) →
            </a>
          </div>
        </div>

        @if (recentTickets().length === 0) {
          <div class="empty-state p-8 text-center text-secondary text-sm">
            {{ i18n.t('common.empty') }}
          </div>
        } @else {
          <div class="table-responsive overflow-x-auto">
            <table class="data-table w-full text-xs">
              <thead>
                <tr>
                  <th style="width: 140px; white-space: nowrap;">{{ i18n.t('ticketList.colNumber') }}</th>
                  <th>{{ i18n.t('ticketList.colTitle') }}</th>
                  <th style="width: 100px; white-space: nowrap;">{{ i18n.t('ticketList.colPriority') }}</th>
                  <th style="width: 110px; white-space: nowrap;">{{ i18n.t('ticketList.colStatus') }}</th>
                  <th style="width: 110px; white-space: nowrap;">{{ i18n.t('ticketList.colSla') }}</th>
                  <th style="width: 150px; white-space: nowrap;">{{ i18n.t('ticketList.colAssignee') }}</th>
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
                    <td class="font-medium">
                      <a [routerLink]="['/tickets', t.publicId]" class="ticket-title-link">
                        {{ t.title }}
                      </a>
                    </td>
                    <td style="white-space: nowrap;">
                      <span class="badge" [ngClass]="'badge-priority-' + t.priority.toLowerCase()">
                        {{ i18n.formatPriority(t.priority) }}
                      </span>
                    </td>
                    <td style="white-space: nowrap;">
                      <span class="badge" [ngClass]="'badge-status-' + t.status.toLowerCase()">
                        {{ i18n.formatStatus(t.status) }}
                      </span>
                    </td>
                    <td style="white-space: nowrap;">
                      <span class="badge" [ngClass]="'badge-sla-' + t.slaStatus.toLowerCase()">
                        {{ i18n.formatSla(t.slaStatus) }}
                      </span>
                    </td>
                    <td class="text-secondary" style="white-space: nowrap;">
                      {{ t.assignedAgentFullName || i18n.t('common.unassigned') }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      padding-bottom: 32px;
    }
    .kpi-card {
      background: var(--bg-card);
      border-color: var(--border-subtle);
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }
    .kpi-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    .kpi-icon-badge {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sla-alert-card {
      background: rgba(255, 59, 48, 0.06);
      border-color: rgba(255, 59, 48, 0.2);
    }
    .breach-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 59, 48, 0.12);
      color: #FF3B30;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bg-red-soft { background: rgba(255, 59, 48, 0.1); }
    .bg-orange-soft { background: rgba(255, 149, 0, 0.1); }
    .bg-blue-soft { background: rgba(0, 113, 227, 0.1); }
    .bg-green-soft { background: rgba(52, 199, 89, 0.1); }
    .text-red { color: #FF3B30; }
    .text-orange { color: #FF9500; }
    .text-blue { color: #0071E3; }
    .text-green { color: #34C759; }

    .priority-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.6875rem;
      font-weight: 600;
    }
    .red-pill {
      background: rgba(255, 59, 48, 0.1);
      color: #FF3B30;
      border: 1px solid rgba(255, 59, 48, 0.2);
    }
    .orange-pill {
      background: rgba(255, 149, 0, 0.1);
      color: #FF9500;
      border: 1px solid rgba(255, 149, 0, 0.2);
    }
    .blue-pill {
      background: rgba(0, 113, 227, 0.1);
      color: #0071E3;
      border: 1px solid rgba(0, 113, 227, 0.2);
    }
    .gray-pill {
      background: rgba(142, 142, 147, 0.1);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
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

    @media (min-width: 640px) {
      .sm-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      .lg-grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private ws = inject(WebSocketService);
  public auth = inject(AuthService);
  public i18n = inject(I18nService);

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

    this.api.getTickets(0, 8).subscribe(res => {
      this.recentTickets.set(res.content);
    });
  }
}
