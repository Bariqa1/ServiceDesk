import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { Ticket, TicketStatus, UserSummary } from '../../../core/models/models';
import { StateStepperComponent } from '../components/state-stepper/state-stepper.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StateStepperComponent],
  template: `
    @if (ticket()) {
      <div class="ticket-detail-page animate-fade-in">
        <!-- Top Action Bar -->
        <div class="top-nav-bar flex flex-wrap justify-between items-center gap-3 mb-4">
          <div class="flex items-center gap-3">
            <a routerLink="/tickets" class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                @if (i18n.isArabic()) {
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                } @else {
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                }
              </svg>
              <span>{{ i18n.t('ticketDetail.queue') }}</span>
            </a>

            <div class="flex items-center gap-2">
              <span class="ticket-id-badge font-mono font-bold">{{ ticket()?.ticketNumber }}</span>
              <span class="badge" [ngClass]="'badge-status-' + ticket()?.status?.toLowerCase()">
                {{ i18n.formatStatus(ticket()?.status) }}
              </span>
              <span class="badge" [ngClass]="'badge-priority-' + ticket()?.priority?.toLowerCase()">
                {{ i18n.formatPriority(ticket()?.priority) }}
              </span>
              <span class="badge" [ngClass]="'badge-sla-' + ticket()?.slaStatus?.toLowerCase()">
                {{ i18n.formatSla(ticket()?.slaStatus) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button class="btn btn-secondary btn-sm" (click)="loadTicket()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              <span>{{ i18n.t('ticketDetail.refresh') }}</span>
            </button>
          </div>
        </div>

        <!-- Interactive State Machine Stepper Component -->
        <app-state-stepper 
          [ticket]="ticket()"
          [isManager]="auth.isManager()"
          [isTeamLead]="auth.isTeamLead()"
          [isAgent]="auth.isAgent()"
          [isEmployee]="auth.isEmployee()"
          (transition)="transitionStatus($event)"
          (openResolve)="openResolveDialog()"
        />

        <!-- Main 2-Column Responsive Layout -->
        <div class="ticket-grid">
          <!-- Main Content Column (Details, Tabs, Comments, WorkLogs) -->
          <div class="main-column flex flex-col gap-4">
            <!-- Ticket Info Card -->
            <div class="card p-5 rounded-xl border">
              <h1 class="ticket-headline text-lg font-bold mb-2.5">{{ ticket()?.title }}</h1>
              
              <div class="description-body text-sm leading-relaxed whitespace-pre-line p-3.5 rounded-lg bg-subtle border mb-3.5">
                {{ ticket()?.description }}
              </div>

              @if (ticket()?.resolutionSummary) {
                <div class="resolution-box p-3.5 rounded-lg border mb-3.5 bg-green-soft">
                  <div class="text-xs font-bold uppercase text-green mb-1">{{ i18n.t('ticketDetail.resolutionSummary') }}</div>
                  <div class="text-sm">{{ ticket()?.resolutionSummary }}</div>
                </div>
              }

              <!-- Requester & Meta Strip -->
              <div class="meta-strip flex flex-wrap gap-4 text-xs text-secondary border-t pt-3">
                <div>{{ i18n.t('ticketDetail.requester') }}: <span class="font-semibold text-primary">{{ ticket()?.requesterFullName }}</span></div>
                <div>{{ i18n.t('ticketDetail.email') }}: <span class="font-semibold">{{ ticket()?.requesterEmail }}</span></div>
                <div>{{ i18n.t('ticketDetail.createdAt') }}: <span class="font-semibold">{{ ticket()?.createdAt | date:'short' }}</span></div>
                @if (ticket()?.resolvedAt) {
                  <div>{{ i18n.t('ticketDetail.resolvedAt') }}: <span class="font-semibold text-green">{{ ticket()?.resolvedAt | date:'short' }}</span></div>
                }
              </div>
            </div>

            <!-- Tabbed Interaction Card with Apple Segmented Control -->
            <div class="card rounded-xl border overflow-hidden">
              <div class="tabs-toolbar p-3 border-b flex items-center justify-between">
                <div class="segmented-control">
                  <button 
                    class="segmented-item" 
                    [class.active]="activeTab() === 'comments'" 
                    (click)="activeTab.set('comments')"
                  >
                    {{ i18n.t('ticketDetail.commentsTab') }} ({{ ticket()?.comments?.length ?? 0 }})
                  </button>
                  <button 
                    class="segmented-item" 
                    [class.active]="activeTab() === 'worklogs'" 
                    (click)="activeTab.set('worklogs')"
                  >
                    {{ i18n.t('ticketDetail.worklogsTab') }} ({{ ticket()?.workLogs?.length ?? 0 }})
                  </button>
                  <button 
                    class="segmented-item" 
                    [class.active]="activeTab() === 'audit'" 
                    (click)="activeTab.set('audit')"
                  >
                    {{ i18n.t('ticketDetail.auditTab') }} ({{ ticket()?.auditLogs?.length ?? 0 }})
                  </button>
                </div>
              </div>

              <div class="tab-content p-4">
                <!-- Comments Tab -->
                @if (activeTab() === 'comments') {
                  <div class="comments-list flex flex-col gap-3 mb-4">
                    @for (c of ticket()?.comments; track c.publicId) {
                      <div class="comment-item p-3 rounded-lg border" [class.internal-note]="c.internal">
                        <div class="flex justify-between items-center mb-1 text-xs">
                          <div class="flex items-center gap-2">
                            <span class="font-bold">{{ c.authorFullName }}</span>
                            @if (c.internal) {
                              <span class="badge badge-internal">{{ i18n.t('ticketDetail.internalBadge') }}</span>
                            }
                          </div>
                          <span class="text-secondary text-[11px]">{{ c.createdAt | date:'short' }}</span>
                        </div>
                        <div class="text-sm whitespace-pre-line">{{ c.content }}</div>
                      </div>
                    } @empty {
                      <div class="text-center text-secondary text-sm py-4">{{ i18n.t('ticketDetail.noComments') }}</div>
                    }
                  </div>

                  <!-- Post Comment Form -->
                  <div class="comment-form-box p-3.5 rounded-xl border bg-subtle">
                    <div class="text-xs font-semibold text-secondary uppercase mb-2">{{ i18n.t('ticketDetail.addComment') }}</div>
                    <textarea 
                      [(ngModel)]="newCommentText" 
                      rows="3" 
                      [placeholder]="i18n.t('ticketDetail.commentPlaceholder')"
                      class="textarea-field w-full mb-2.5"
                    ></textarea>
                    <div class="flex justify-between items-center">
                      <label class="flex items-center gap-2 text-xs cursor-pointer text-secondary">
                        <input type="checkbox" [(ngModel)]="isInternalNote" />
                        <span>{{ i18n.t('ticketDetail.internalNote') }}</span>
                      </label>
                      <button class="btn btn-primary btn-sm" [disabled]="!newCommentText.trim() || postingComment()" (click)="addComment()">
                        {{ i18n.t('ticketDetail.sendComment') }}
                      </button>
                    </div>
                  </div>
                }

                <!-- WorkLogs Tab -->
                @if (activeTab() === 'worklogs') {
                  <div class="worklogs-list flex flex-col gap-2.5 mb-4">
                    @for (w of ticket()?.workLogs; track w.publicId) {
                      <div class="worklog-item p-3 rounded-lg border flex justify-between items-center text-xs">
                        <div>
                          <div class="font-bold text-sm">{{ w.agentFullName }} • {{ w.timeSpentMinutes }} {{ i18n.t('common.minutes') }}</div>
                          <div class="text-secondary mt-0.5">{{ w.description }}</div>
                        </div>
                        <span class="text-secondary">{{ w.loggedAt | date:'short' }}</span>
                      </div>
                    } @empty {
                      <div class="text-center text-secondary text-sm py-4">{{ i18n.t('ticketDetail.noWorklogs') }}</div>
                    }
                  </div>

                  <!-- Log Work Form -->
                  <div class="worklog-form-box p-3.5 rounded-xl border bg-subtle">
                    <div class="text-xs font-semibold text-secondary uppercase mb-2">{{ i18n.t('ticketDetail.logWork') }}</div>
                    <div class="flex flex-wrap gap-2.5 mb-2.5">
                      <input 
                        type="number" 
                        [(ngModel)]="timeSpentMinutes" 
                        [placeholder]="i18n.t('ticketDetail.minutesPlaceholder')" 
                        class="input-field w-32"
                      />
                      <input 
                        type="text" 
                        [(ngModel)]="workLogDesc" 
                        [placeholder]="i18n.t('ticketDetail.workDescPlaceholder')" 
                        class="input-field flex-1 min-w-[200px]"
                      />
                    </div>
                    <div class="flex justify-end">
                      <button class="btn btn-primary btn-sm" [disabled]="!timeSpentMinutes || !workLogDesc.trim()" (click)="logWork()">
                        {{ i18n.t('ticketDetail.saveWork') }}
                      </button>
                    </div>
                  </div>
                }

                <!-- Audit History Tab -->
                @if (activeTab() === 'audit') {
                  <div class="audit-timeline flex flex-col gap-2.5">
                    @for (a of ticket()?.auditLogs; track a.publicId) {
                      <div class="audit-item p-3 rounded-lg border text-xs">
                        <div class="flex justify-between items-center mb-1">
                          <span class="font-bold text-primary">{{ a.action }}</span>
                          <span class="text-secondary text-[11px]">{{ a.timestamp | date:'short' }}</span>
                        </div>
                        <div class="text-secondary">
                          {{ i18n.t('ticketDetail.auditBy') }} <span class="font-semibold text-primary">{{ a.performedByFullName }}</span>
                          @if (a.details) {
                            — <span>{{ a.details }}</span>
                          }
                        </div>
                      </div>
                    } @empty {
                      <div class="text-center text-secondary text-sm py-4">{{ i18n.t('ticketDetail.noAudit') }}</div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Inspector Sidebar Column (Routing & Assignment FIRST, then SLA) -->
          <div class="sidebar-column flex flex-col gap-4">
            <!-- Assignment & Routing Card (PLACED FIRST TO PREVENT OVERFLOW CUTOFF) -->
            <div class="card p-4 rounded-xl border inspector-card">
              <h2 class="inspector-title text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{{ i18n.t('ticketDetail.detailsHeader') }}</span>
              </h2>

              <div class="property-list flex flex-col gap-2.5 text-xs">
                <!-- Assigned Agent -->
                <div class="flex justify-between items-center py-1 border-b">
                  <span class="text-secondary">{{ i18n.t('ticketDetail.assignee') }}</span>
                  <div class="flex items-center gap-1.5 font-semibold text-primary">
                    @if (ticket()?.assignedAgentFullName) {
                      <span class="agent-avatar-sm">{{ ticket()?.assignedAgentFullName?.charAt(0) }}</span>
                      <span>{{ ticket()?.assignedAgentFullName }}</span>
                    } @else {
                      <span class="text-tertiary italic">{{ i18n.t('common.unassigned') }}</span>
                    }
                  </div>
                </div>

                <!-- Support Team -->
                <div class="flex justify-between items-center py-1 border-b">
                  <span class="text-secondary">{{ i18n.t('ticketDetail.team') }}</span>
                  <span class="font-semibold text-primary">{{ ticket()?.assignedTeamName || i18n.t('common.general') }}</span>
                </div>

                <!-- Category -->
                <div class="flex justify-between items-center py-1 border-b">
                  <span class="text-secondary">{{ i18n.t('ticketDetail.category') }}</span>
                  <span class="font-semibold text-primary">{{ ticket()?.categoryName }}</span>
                </div>

                <!-- Sub-Service -->
                <div class="flex justify-between items-center py-1">
                  <span class="text-secondary">{{ i18n.t('ticketDetail.service') }}</span>
                  <span class="font-semibold text-primary">{{ ticket()?.serviceName || i18n.t('common.general') }}</span>
                </div>
              </div>

              <!-- Quick Assign Dropdown for Leads / Agents / Managers -->
              @if (auth.isManager() || auth.isTeamLead() || auth.isAgent()) {
                <div class="assign-action mt-3 pt-3 border-t">
                  <label class="font-semibold text-[11px] text-secondary uppercase block mb-1.5">
                    {{ i18n.t('ticketDetail.quickAssign') }}
                  </label>
                  <div class="flex gap-2">
                    <select [(ngModel)]="selectedAgentPublicId" class="select-field flex-1 text-xs">
                      <option value="">{{ i18n.t('ticketDetail.selectAgent') }}</option>
                      @for (u of availableAgents(); track u.publicId) {
                        <option [value]="u.publicId">{{ u.fullName }} ({{ u.teamName || i18n.t('common.general') }})</option>
                      }
                    </select>
                    <button class="btn btn-secondary btn-sm" [disabled]="!selectedAgentPublicId" (click)="assignTicket()">
                      {{ i18n.t('ticketDetail.assignBtn') }}
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- SLA Monitor Card (PLACED SECOND) -->
            <div class="card p-4 rounded-xl border inspector-card">
              <h2 class="inspector-title text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{ i18n.t('ticketDetail.slaHeader') }}</span>
                </span>
                <span class="badge" [ngClass]="'badge-sla-' + ticket()?.slaStatus?.toLowerCase()">
                  {{ i18n.formatSla(ticket()?.slaStatus) }}
                </span>
              </h2>

              <!-- SLA Resolution Target -->
              <div class="sla-metric-box mb-3">
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span class="text-secondary">{{ i18n.t('ticketDetail.resolutionDeadline') }}</span>
                  <span class="font-bold">{{ ticket()?.resolutionDeadline | date:'short' }}</span>
                </div>
                <div class="progress-track">
                  <div 
                    class="progress-bar" 
                    [ngClass]="getSlaProgressClass()" 
                    [style.width.%]="ticket()?.slaElapsedPercent || 50"
                  ></div>
                </div>
                <div class="flex justify-between text-[11px] text-secondary mt-1">
                  <span>{{ i18n.t('ticketDetail.elapsedTime') }}</span>
                  <span>{{ ticket()?.slaElapsedPercent }}%</span>
                </div>
              </div>

              <!-- SLA Response Target -->
              <div class="sla-metric-box">
                <div class="flex justify-between text-xs font-medium">
                  <span class="text-secondary">{{ i18n.t('ticketDetail.firstResponse') }}</span>
                  <span class="font-bold">
                    @if (ticket()?.firstRespondedAt) {
                      <span class="text-green">{{ i18n.t('ticketDetail.responded') }}</span>
                    } @else {
                      {{ ticket()?.responseDeadline | date:'short' }}
                    }
                  </span>
                </div>
              </div>

              @if (ticket()?.escalated) {
                <div class="escalation-tag mt-3 p-2.5 rounded-lg bg-red-soft text-red text-xs font-semibold flex items-center gap-2">
                  <span>⚠️ {{ i18n.t('ticketDetail.escalatedWarning') }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Resolve Dialog Modal -->
        @if (showResolveModal()) {
          <div class="modal-backdrop">
            <div class="modal-card p-5 rounded-xl border animate-fade-in">
              <h2 class="text-base font-bold mb-1.5">{{ i18n.t('modal.resolveTitle') }}</h2>
              <p class="text-xs text-secondary mb-3">
                {{ i18n.t('modal.resolveDesc') }}
              </p>
              <textarea 
                [(ngModel)]="resolutionSummaryText" 
                rows="4" 
                [placeholder]="i18n.t('modal.resolvePlaceholder')" 
                class="textarea-field w-full mb-3"
              ></textarea>
              <div class="flex justify-end gap-2">
                <button class="btn btn-secondary btn-sm" (click)="showResolveModal.set(false)">
                  {{ i18n.t('common.cancel') }}
                </button>
                <button class="btn btn-success btn-sm" [disabled]="!resolutionSummaryText.trim()" (click)="confirmResolve()">
                  {{ i18n.t('modal.confirmResolve') }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    } @else if (loading()) {
      <div class="p-16 text-center text-secondary text-sm">
        {{ i18n.t('common.loading') }}
      </div>
    }
  `,
  styles: [`
    .ticket-detail-page {
      max-width: 1280px;
      margin: 0 auto;
      padding-bottom: 24px;
    }
    .ticket-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .ticket-grid {
        grid-template-columns: 1fr;
      }
    }
    .ticket-id-badge {
      font-size: 1.15rem;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }
    .ticket-headline {
      color: var(--text-primary);
      letter-spacing: -0.015em;
    }
    .bg-subtle {
      background: var(--bg-primary);
    }
    .bg-green-soft {
      background: rgba(52, 199, 89, 0.1);
      border-color: rgba(52, 199, 89, 0.25);
    }
    .bg-red-soft {
      background: rgba(255, 59, 48, 0.1);
      border-color: rgba(255, 59, 48, 0.25);
    }
    .text-green { color: #34C759; }
    .text-red { color: #FF3B30; }

    .agent-avatar-sm {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 700;
    }

    .badge-internal {
      background: rgba(255, 149, 0, 0.12);
      color: #FF9500;
    }
    .internal-note {
      background: rgba(255, 149, 0, 0.04);
      border-color: rgba(255, 149, 0, 0.25);
    }

    .progress-track {
      height: 5px;
      background: var(--border-subtle);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }
    .progress-green { background: #34C759; }
    .progress-orange { background: #FF9500; }
    .progress-red { background: #FF3B30; }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .modal-card {
      background: var(--bg-card);
      border-color: var(--border-subtle);
      width: 90%;
      max-width: 480px;
      box-shadow: var(--shadow-lg);
    }
  `]
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private ws = inject(WebSocketService);
  public auth = inject(AuthService);
  public i18n = inject(I18nService);

  ticketPublicId = signal<string>('');
  ticket = signal<Ticket | null>(null);
  loading = signal<boolean>(false);
  activeTab = signal<'comments' | 'worklogs' | 'audit'>('comments');

  availableAgents = signal<UserSummary[]>([]);
  selectedAgentPublicId: string = '';

  // New comment state
  newCommentText = '';
  isInternalNote = false;
  postingComment = signal<boolean>(false);

  // New work log state
  timeSpentMinutes: number | null = null;
  workLogDesc = '';

  // Resolution modal state
  showResolveModal = signal<boolean>(false);
  resolutionSummaryText = '';

  constructor() {
    effect(() => {
      const event = this.ws.latestEvent();
      if (event && event.ticketPublicId === this.ticketPublicId()) {
        this.loadTicket();
      }
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['publicId']) {
        this.ticketPublicId.set(params['publicId']);
        this.loadTicket();
      }
    });

    this.api.getAgents().subscribe(agents => {
      this.availableAgents.set(agents);
    });
  }

  loadTicket() {
    this.loading.set(true);
    this.api.getTicket(this.ticketPublicId()).subscribe({
      next: (t) => {
        this.ticket.set(t);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  transitionStatus(status: TicketStatus) {
    this.api.updateTicketStatus(this.ticketPublicId(), { status }).subscribe(ticket => {
      this.ticket.set(ticket);
    });
  }

  openResolveDialog() {
    this.resolutionSummaryText = '';
    this.showResolveModal.set(true);
  }

  confirmResolve() {
    if (!this.resolutionSummaryText.trim()) return;
    this.api.resolveTicket(this.ticketPublicId(), { resolutionSummary: this.resolutionSummaryText }).subscribe(ticket => {
      this.ticket.set(ticket);
      this.showResolveModal.set(false);
    });
  }

  assignTicket() {
    if (!this.selectedAgentPublicId) return;
    this.api.assignTicket(this.ticketPublicId(), { agentPublicId: this.selectedAgentPublicId }).subscribe(ticket => {
      this.ticket.set(ticket);
    });
  }

  addComment() {
    if (!this.newCommentText.trim()) return;
    this.postingComment.set(true);
    this.api.addComment(this.ticketPublicId(), {
      content: this.newCommentText,
      internal: this.isInternalNote
    }).subscribe({
      next: (comment) => {
        const current = this.ticket();
        if (current) {
          this.ticket.set({
            ...current,
            comments: [...(current.comments || []), comment]
          });
        }
        this.newCommentText = '';
        this.isInternalNote = false;
        this.postingComment.set(false);
      },
      error: () => this.postingComment.set(false)
    });
  }

  logWork() {
    if (!this.timeSpentMinutes || !this.workLogDesc.trim()) return;
    this.api.addWorkLog(this.ticketPublicId(), {
      timeSpentMinutes: this.timeSpentMinutes,
      description: this.workLogDesc
    }).subscribe(workLog => {
      const current = this.ticket();
      if (current) {
        this.ticket.set({
          ...current,
          workLogs: [...(current.workLogs || []), workLog]
        });
      }
      this.timeSpentMinutes = null;
      this.workLogDesc = '';
    });
  }

  getSlaProgressClass(): string {
    const p = this.ticket()?.slaElapsedPercent ?? 0;
    if (p >= 100) return 'progress-red';
    if (p >= 75) return 'progress-orange';
    return 'progress-green';
  }
}
