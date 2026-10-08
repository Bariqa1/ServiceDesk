import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Ticket, TicketStatus, UserSummary } from '../../../core/models/models';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    @if (ticket()) {
      <div class="ticket-detail-page animate-fade-in">
        <!-- Top Action Bar -->
        <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div class="flex items-center gap-3">
            <a routerLink="/tickets" class="btn btn-secondary btn-sm">
              ← الطابور
            </a>
            <div class="flex items-center gap-2">
              <span class="text-xl font-mono font-bold">{{ ticket()?.ticketNumber }}</span>
              <span class="badge" [ngClass]="'badge-status-' + ticket()?.status?.toLowerCase()">
                {{ formatStatus(ticket()?.status) }}
              </span>
              <span class="badge" [ngClass]="'badge-priority-' + ticket()?.priority?.toLowerCase()">
                {{ ticket()?.priority }}
              </span>
              <span class="badge" [ngClass]="'badge-sla-' + ticket()?.slaStatus?.toLowerCase()">
                {{ formatSla(ticket()?.slaStatus) }}
              </span>
            </div>
          </div>

          <!-- Transition Action Buttons -->
          <div class="flex items-center gap-2">
            @if (canTransitionTo('IN_PROGRESS')) {
              <button class="btn btn-primary btn-sm" (click)="transitionStatus('IN_PROGRESS')">
                بدء العمل (Start Working)
              </button>
            }
            @if (canTransitionTo('WAITING_FOR_USER')) {
              <button class="btn btn-secondary btn-sm" (click)="transitionStatus('WAITING_FOR_USER')">
                بانتظار الموظف
              </button>
            }
            @if (canTransitionTo('RESOLVED')) {
              <button class="btn btn-success btn-sm" (click)="openResolveDialog()">
                تحديد كمحلولة (Resolve)
              </button>
            }
            @if (canTransitionTo('CLOSED')) {
              <button class="btn btn-secondary btn-sm" (click)="transitionStatus('CLOSED')">
                إغلاق نهائي
              </button>
            }
            @if (canTransitionTo('REOPENED')) {
              <button class="btn btn-warning btn-sm" (click)="transitionStatus('REOPENED')">
                إعادة فتح
              </button>
            }
          </div>
        </div>

        <!-- Main Grid Layout -->
        <div class="grid grid-cols-1 lg-grid-cols-3 gap-6">
          <!-- Left Main Column (Details, Comments, WorkLogs, History) -->
          <div class="lg-col-span-2 flex flex-col gap-6">
            <!-- Ticket Info Card -->
            <div class="card p-6 rounded-xl border">
              <h1 class="text-xl font-bold mb-3">{{ ticket()?.title }}</h1>
              <div class="description-body text-sm leading-relaxed whitespace-pre-line p-4 rounded-lg bg-body-subtle border mb-4">
                {{ ticket()?.description }}
              </div>

              @if (ticket()?.resolutionSummary) {
                <div class="resolution-box p-4 rounded-lg border mb-4 bg-green-soft">
                  <div class="text-xs font-bold uppercase text-green mb-1">ملخص خطوات الحل (Resolution Summary)</div>
                  <div class="text-sm">{{ ticket()?.resolutionSummary }}</div>
                </div>
              }

              <div class="flex flex-wrap gap-4 text-xs text-secondary border-t pt-4">
                <div>مقدم الطلب: <span class="font-semibold text-primary-color">{{ ticket()?.requesterFullName }}</span></div>
                <div>البريد: <span class="font-semibold">{{ ticket()?.requesterEmail }}</span></div>
                <div>تاريخ الإنشاء: <span class="font-semibold">{{ ticket()?.createdAt | date:'medium' }}</span></div>
                @if (ticket()?.resolvedAt) {
                  <div>تاريخ الحل: <span class="font-semibold text-green">{{ ticket()?.resolvedAt | date:'medium' }}</span></div>
                }
              </div>
            </div>

            <!-- Tabbed Interaction Card -->
            <div class="card rounded-xl border overflow-hidden">
              <div class="tabs-header border-b flex">
                <button 
                  class="tab-btn" 
                  [class.active]="activeTab() === 'comments'" 
                  (click)="activeTab.set('comments')"
                >
                  النقاش والملاحظات ({{ ticket()?.comments?.length ?? 0 }})
                </button>
                <button 
                  class="tab-btn" 
                  [class.active]="activeTab() === 'worklogs'" 
                  (click)="activeTab.set('worklogs')"
                >
                  سجل ساعات العمل ({{ ticket()?.workLogs?.length ?? 0 }})
                </button>
                <button 
                  class="tab-btn" 
                  [class.active]="activeTab() === 'audit'" 
                  (click)="activeTab.set('audit')"
                >
                  سجل التتبع والتدقيق ({{ ticket()?.auditLogs?.length ?? 0 }})
                </button>
              </div>

              <div class="tab-content p-5">
                <!-- Comments Tab -->
                @if (activeTab() === 'comments') {
                  <div class="comments-list flex flex-col gap-4 mb-6">
                    @for (c of ticket()?.comments; track c.publicId) {
                      <div class="comment-item p-3.5 rounded-lg border" [class.internal-note]="c.internal">
                        <div class="flex justify-between items-center mb-1 text-xs">
                          <div class="flex items-center gap-2">
                            <span class="font-bold">{{ c.authorFullName }}</span>
                            @if (c.internal) {
                              <span class="badge badge-internal">ملاحظة داخلية (Internal)</span>
                            }
                          </div>
                          <span class="text-secondary">{{ c.createdAt | date:'short' }}</span>
                        </div>
                        <div class="text-sm whitespace-pre-line">{{ c.content }}</div>
                      </div>
                    } @empty {
                      <div class="text-center text-secondary text-sm py-4">لا توجد ملاحظات أو ردود بعد.</div>
                    }
                  </div>

                  <!-- Post Comment Form -->
                  <div class="comment-form-box p-4 rounded-xl border bg-body-subtle">
                    <div class="text-xs font-bold uppercase mb-2">إضافة رد أو ملاحظة داخلية</div>
                    <textarea 
                      [(ngModel)]="newCommentText" 
                      rows="3" 
                      placeholder="اكتب ردك أو تقريرك هنا..."
                      class="textarea-field w-full mb-3"
                    ></textarea>
                    <div class="flex justify-between items-center">
                      <label class="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" [(ngModel)]="isInternalNote" />
                        <span>ملاحظة داخلية (مرئية للمشرفين والفنيين فقط)</span>
                      </label>
                      <button class="btn btn-primary btn-sm" [disabled]="!newCommentText.trim() || postingComment()" (click)="addComment()">
                        إرسال الرد
                      </button>
                    </div>
                  </div>
                }

                <!-- WorkLogs Tab -->
                @if (activeTab() === 'worklogs') {
                  <div class="worklogs-list flex flex-col gap-3 mb-6">
                    @for (w of ticket()?.workLogs; track w.publicId) {
                      <div class="worklog-item p-3 rounded-lg border flex justify-between items-center text-xs">
                        <div>
                          <div class="font-bold text-sm">{{ w.agentFullName }} سجل {{ w.timeSpentMinutes }} دقيقة</div>
                          <div class="text-secondary mt-0.5">{{ w.description }}</div>
                        </div>
                        <span class="text-secondary">{{ w.loggedAt | date:'short' }}</span>
                      </div>
                    } @empty {
                      <div class="text-center text-secondary text-sm py-4">لا توجد ساعات عمل مسجلة حتى الآن.</div>
                    }
                  </div>

                  <!-- Log Work Form -->
                  <div class="worklog-form-box p-4 rounded-xl border bg-body-subtle">
                    <div class="text-xs font-bold uppercase mb-2">تسجيل وقت العمل الفعلي</div>
                    <div class="flex gap-3 mb-3">
                      <input 
                        type="number" 
                        [(ngModel)]="timeSpentMinutes" 
                        placeholder="الدقائق (مثال: 30)" 
                        class="input-field w-36"
                      />
                      <input 
                        type="text" 
                        [(ngModel)]="workLogDesc" 
                        placeholder="وصف الإجراء (مثال: فحص إعدادات التوجيه والشبكة)" 
                        class="input-field flex-1"
                      />
                    </div>
                    <div class="flex justify-end">
                      <button class="btn btn-primary btn-sm" [disabled]="!timeSpentMinutes || !workLogDesc.trim()" (click)="logWork()">
                        تسجيل الوقت
                      </button>
                    </div>
                  </div>
                }

                <!-- Audit History Tab -->
                @if (activeTab() === 'audit') {
                  <div class="audit-timeline flex flex-col gap-3">
                    @for (a of ticket()?.auditLogs; track a.publicId) {
                      <div class="audit-item p-3 rounded-lg border text-xs">
                        <div class="flex justify-between items-center mb-1">
                          <span class="font-bold text-primary-color">{{ a.action }}</span>
                          <span class="text-secondary">{{ a.timestamp | date:'short' }}</span>
                        </div>
                        <div class="text-secondary">
                          بواسطة <span class="font-semibold">{{ a.performedByFullName }}</span>
                          @if (a.details) {
                            — <span>{{ a.details }}</span>
                          }
                        </div>
                      </div>
                    } @empty {
                      <div class="text-center text-secondary text-sm py-4">لا يوجد سجل تدقيق متاح.</div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right Sidebar Column (SLA Timers, Routing, Metadata) -->
          <div class="flex flex-col gap-6">
            <!-- SLA Monitor Card -->
            <div class="card p-5 rounded-xl border">
              <h2 class="text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>صحة اتفاقية مستوى الخدمة</span>
                <span class="badge" [ngClass]="'badge-sla-' + ticket()?.slaStatus?.toLowerCase()">
                  {{ formatSla(ticket()?.slaStatus) }}
                </span>
              </h2>

              <!-- SLA Resolution Target -->
              <div class="sla-metric-box mb-4">
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span>الموعد النهائي للحل</span>
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
                  <span>الوقت المنقضي</span>
                  <span>{{ ticket()?.slaElapsedPercent }}%</span>
                </div>
              </div>

              <!-- SLA Response Target -->
              <div class="sla-metric-box mb-4">
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span>مهلة الاستجابة الأولى</span>
                  <span class="font-bold">
                    @if (ticket()?.firstRespondedAt) {
                      <span class="text-green">تمت الاستجابة</span>
                    } @else {
                      {{ ticket()?.responseDeadline | date:'short' }}
                    }
                  </span>
                </div>
              </div>

              @if (ticket()?.escalated) {
                <div class="escalation-tag p-2.5 rounded-lg bg-red-soft text-red text-xs font-bold flex items-center gap-2">
                  <span>⚠️ تم التصعيد التلقائي بسبب تجاوز مهلة الـ SLA</span>
                </div>
              }
            </div>

            <!-- Metadata & Assignment Card -->
            <div class="card p-5 rounded-xl border">
              <h2 class="text-sm font-bold uppercase tracking-wider mb-4">بيانات التوجيه والإسناد</h2>

              <div class="property-list flex flex-col gap-3 text-xs">
                <div class="flex justify-between py-1 border-b">
                  <span class="text-secondary">الفني المسؤول</span>
                  <span class="font-semibold">{{ ticket()?.assignedAgentFullName || 'غير مسند' }}</span>
                </div>

                <div class="flex justify-between py-1 border-b">
                  <span class="text-secondary">الفريق الداعم</span>
                  <span class="font-semibold">{{ ticket()?.assignedTeamName || 'عام' }}</span>
                </div>

                <div class="flex justify-between py-1 border-b">
                  <span class="text-secondary">التصنيف الرئيسي</span>
                  <span class="font-semibold">{{ ticket()?.categoryName }}</span>
                </div>

                <div class="flex justify-between py-1">
                  <span class="text-secondary">الخدمة الفرعية</span>
                  <span class="font-semibold">{{ ticket()?.serviceName || 'عام' }}</span>
                </div>
              </div>

              <!-- Quick Assign Dropdown for Leads / Agents -->
              @if (auth.isManager() || auth.isTeamLead() || auth.isAgent()) {
                <div class="divider my-4"></div>
                <div class="assign-action">
                  <label class="font-semibold text-xs text-secondary uppercase block mb-1">
                    إسناد التذكرة لفني
                  </label>
                  <div class="flex gap-2">
                    <select [(ngModel)]="selectedAgentPublicId" class="select-field flex-1 text-xs">
                      <option value="">اختر الفني</option>
                      @for (u of availableAgents(); track u.publicId) {
                        <option [value]="u.publicId">{{ u.fullName }} ({{ u.teamName || 'عام' }})</option>
                      }
                    </select>
                    <button class="btn btn-secondary btn-sm" [disabled]="!selectedAgentPublicId" (click)="assignTicket()">
                      إسناد
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Resolve Dialog Modal -->
        @if (showResolveModal()) {
          <div class="modal-backdrop">
            <div class="modal-card p-6 rounded-xl border">
              <h2 class="text-lg font-bold mb-2">تسجيل حل التذكرة</h2>
              <p class="text-xs text-secondary mb-4">
                يرجى كتابة ملخص الإجراء المتخذ لحل المشكلة لتوثيقها في قاعدة المعرفة.
              </p>
              <textarea 
                [(ngModel)]="resolutionSummaryText" 
                rows="4" 
                placeholder="مثال: تم إعادة تهيئة الصلاحيات وتحديث شهادة الاتصال..." 
                class="textarea-field w-full mb-4"
              ></textarea>
              <div class="flex justify-end gap-2">
                <button class="btn btn-secondary btn-sm" (click)="showResolveModal.set(false)">إلغاء</button>
                <button class="btn btn-success btn-sm" [disabled]="!resolutionSummaryText.trim()" (click)="confirmResolve()">
                  تأكيد وإغلاق المشكلة
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    } @else if (loading()) {
      <div class="p-16 text-center text-secondary">
        جاري تحميل تفاصيل التذكرة...
      </div>
    }
  `,
  styles: [`
    .ticket-detail-page {
      max-width: 1320px;
      margin: 0 auto;
    }
    .card {
      background: var(--bg-surface);
      border-color: var(--border-subtle);
    }
    .bg-body-subtle {
      background: var(--bg-primary);
    }
    .bg-green-soft {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.25);
    }
    .bg-red-soft {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.25);
    }
    .text-green { color: #10b981; }
    .text-red { color: #ef4444; }
    .tabs-header {
      background: var(--bg-surface);
    }
    .tab-btn {
      padding: 0.75rem 1.25rem;
      border: none;
      background: transparent;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 2px solid transparent;
      cursor: pointer;
    }
    .tab-btn.active {
      color: var(--accent-primary);
      border-bottom-color: var(--accent-primary);
    }
    .badge-internal {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }
    .internal-note {
      background: rgba(245, 158, 11, 0.04);
      border-color: rgba(245, 158, 11, 0.3);
    }
    .input-field, .select-field, .textarea-field {
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
    }
    .input-field:focus, .select-field:focus, .textarea-field:focus {
      outline: none;
      border-color: var(--accent-primary);
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
    .progress-green { background: #10b981; }
    .progress-orange { background: #f59e0b; }
    .progress-red { background: #ef4444; }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .modal-card {
      background: var(--bg-surface);
      border-color: var(--border-subtle);
      width: 90%;
      max-width: 500px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
    }
    .btn-success {
      background: #10b981;
      color: #fff;
    }
    .btn-warning {
      background: #f59e0b;
      color: #fff;
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
  `]
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private ws = inject(WebSocketService);
  public auth = inject(AuthService);

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

  canTransitionTo(targetStatus: TicketStatus): boolean {
    const current = this.ticket()?.status;
    if (!current) return false;

    switch (current) {
      case 'OPEN':
        return targetStatus === 'IN_PROGRESS' || targetStatus === 'ASSIGNED';
      case 'ASSIGNED':
        return targetStatus === 'IN_PROGRESS';
      case 'IN_PROGRESS':
        return targetStatus === 'WAITING_FOR_USER' || targetStatus === 'RESOLVED';
      case 'WAITING_FOR_USER':
        return targetStatus === 'IN_PROGRESS' || targetStatus === 'RESOLVED';
      case 'RESOLVED':
        return targetStatus === 'CLOSED' || targetStatus === 'REOPENED';
      case 'CLOSED':
        return targetStatus === 'REOPENED';
      case 'REOPENED':
        return targetStatus === 'IN_PROGRESS';
      default:
        return false;
    }
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

  formatStatus(status: string | undefined): string {
    return status ? status.replace(/_/g, ' ') : '';
  }

  formatSla(sla: string | undefined): string {
    return sla ? sla.replace(/_/g, ' ') : '';
  }
}
