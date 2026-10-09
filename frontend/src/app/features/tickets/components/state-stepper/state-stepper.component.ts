import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket, TicketStatus } from '../../../../core/models/models';

export interface WorkflowStep {
  key: TicketStatus;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-state-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stepper-card card p-6 rounded-xl border">
      <!-- Stepper Header -->
      <div class="stepper-header flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="stepper-badge-title">مسار آلة الحالات (ITIL State Machine)</span>
            <div class="live-pulse-dot" [class.pulse-active]="ticket?.status !== 'CLOSED'"></div>
          </div>
          <p class="text-xs text-secondary">
            مخطط بصري تفاعلي يراقب انتقال التذكرة عبر محطات دورة العمل وفق قواعد التحقق الصارمة.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-secondary font-medium">الحالة الراهنة:</span>
          <span class="badge" [ngClass]="'badge-status-' + (ticket?.status?.toLowerCase() || 'open')">
            {{ formatStatus(ticket?.status) }}
          </span>
        </div>
      </div>

      <!-- Main Linear Timeline Pipeline -->
      <div class="stepper-track-container">
        <div class="stepper-track">
          @for (step of mainSteps; track step.key; let idx = $index; let last = $last) {
            <div 
              class="stepper-node" 
              [class.completed]="isStepCompleted(step.key)"
              [class.active]="isCurrentStep(step.key)"
              [class.actionable]="canTransitionTo(step.key)"
              [class.locked]="!isStepCompleted(step.key) && !isCurrentStep(step.key) && !canTransitionTo(step.key)"
            >
              <!-- Step Connector Line -->
              @if (!last) {
                <div 
                  class="connector-line" 
                  [class.connector-completed]="isConnectorActive(idx)"
                ></div>
              }

              <!-- Step Node Circle & Icon -->
              <div 
                class="node-circle" 
                [attr.title]="getStepTooltip(step.key)"
                (click)="onNodeClick(step.key)"
              >
                @if (isStepCompleted(step.key)) {
                  <!-- Completed Checkmark -->
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                } @else if (isCurrentStep(step.key)) {
                  <!-- Active Beacon Pulse -->
                  <div class="active-pulse-ring"></div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 2v3m0 14v3M2 12h3m14 0h3"></path>
                  </svg>
                } @else if (canTransitionTo(step.key)) {
                  <!-- Actionable Transition -->
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                } @else {
                  <!-- Locked / Future State -->
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                }
              </div>

              <!-- Step Label & Info -->
              <div class="node-meta text-center mt-3">
                <div class="node-title font-semibold text-xs">{{ step.title }}</div>
                <div class="node-subtitle text-[11px] text-secondary mt-0.5">{{ step.subtitle }}</div>

                <!-- Action Button for Available Next Steps -->
                @if (canTransitionTo(step.key)) {
                  <button 
                    type="button" 
                    class="step-action-btn mt-2" 
                    (click)="onNodeClick(step.key)"
                  >
                    <span>نقل إلى هنا</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                } @else if (isCurrentStep(step.key)) {
                  <div class="current-state-pill mt-2">
                    المرحلة الحالية
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Branching & Auxiliary States Panel -->
      <div class="branching-panel mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-secondary">حالات المسار الاستثنائي والتعليق:</span>
          <span class="text-[11px] text-tertiary">حالات فرعية يتم تفعيلها بانتظار إفادة الموظف أو إعادة الفتح</span>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- WAITING FOR USER Branch Button -->
          <div 
            class="branch-item"
            [class.branch-active]="ticket?.status === 'WAITING_FOR_USER'"
            [class.branch-available]="canTransitionTo('WAITING_FOR_USER')"
          >
            <div class="branch-info">
              <span class="branch-name">بانتظار الموظف (Waiting for User)</span>
              <span class="branch-desc">تعليق المهلة مؤقتاً لحين استلام رد الموظف</span>
            </div>

            @if (canTransitionTo('WAITING_FOR_USER')) {
              <button 
                type="button" 
                class="btn btn-secondary btn-sm"
                (click)="onNodeClick('WAITING_FOR_USER')"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>تعليق التذكرة</span>
              </button>
            } @else if (ticket?.status === 'WAITING_FOR_USER') {
              <span class="branch-status-pill active-warning">قيد التعليق حالياً</span>
            }
          </div>

          <!-- REOPENED Branch Button -->
          <div 
            class="branch-item"
            [class.branch-active]="ticket?.status === 'REOPENED'"
            [class.branch-available]="canTransitionTo('REOPENED')"
          >
            <div class="branch-info">
              <span class="branch-name">إعادة فتح (Reopened)</span>
              <span class="branch-desc">إذا لم يتم حل المشكلة بعد تحديدها كمحلولة</span>
            </div>

            @if (canTransitionTo('REOPENED')) {
              <button 
                type="button" 
                class="btn btn-warning btn-sm"
                (click)="onNodeClick('REOPENED')"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                <span>إعادة الفتح</span>
              </button>
            } @else if (ticket?.status === 'REOPENED') {
              <span class="branch-status-pill active-danger">معاد فتحها</span>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stepper-card {
      background: var(--bg-card);
      border-color: var(--border-subtle);
      position: relative;
      overflow: hidden;
    }

    .stepper-badge-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }

    .live-pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--sla-within);
      opacity: 0.5;
    }
    .live-pulse-dot.pulse-active {
      box-shadow: 0 0 8px var(--sla-within);
      opacity: 1;
      animation: pulseGlow 2s infinite;
    }

    @keyframes pulseGlow {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.6; }
    }

    .stepper-track-container {
      width: 100%;
      overflow-x: auto;
      padding: 10px 4px 6px 4px;
    }

    .stepper-track {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      min-width: 650px;
      position: relative;
    }

    .stepper-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      flex: 1;
      z-index: 2;
    }

    .connector-line {
      position: absolute;
      top: 20px;
      left: -50%;
      right: 50%;
      height: 3px;
      background: var(--border-strong);
      z-index: -1;
      transition: background var(--transition-normal);
    }

    .connector-completed {
      background: var(--accent-primary);
      box-shadow: 0 0 8px var(--accent-glow);
    }

    .node-circle {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-surface);
      border: 2px solid var(--border-strong);
      color: var(--text-tertiary);
      cursor: default;
      transition: all var(--transition-fast);
      position: relative;
    }

    /* Completed State Node */
    .stepper-node.completed .node-circle {
      background: var(--accent-primary);
      border-color: var(--accent-primary);
      color: #FFFFFF;
      box-shadow: 0 0 14px var(--accent-glow);
    }

    /* Current Active Node */
    .stepper-node.active .node-circle {
      background: var(--bg-surface);
      border-color: var(--accent-primary);
      color: var(--accent-primary);
      box-shadow: 0 0 20px var(--accent-glow);
      transform: scale(1.08);
    }

    .active-pulse-ring {
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: 2px solid var(--accent-primary);
      opacity: 0.4;
      animation: pulseRing 2s infinite ease-out;
    }

    @keyframes pulseRing {
      0% { transform: scale(0.9); opacity: 0.7; }
      100% { transform: scale(1.3); opacity: 0; }
    }

    /* Actionable Step Node */
    .stepper-node.actionable .node-circle {
      border: 2px dashed var(--accent-primary);
      color: var(--accent-primary);
      background: var(--accent-glow);
      cursor: pointer;
    }
    .stepper-node.actionable .node-circle:hover {
      background: var(--accent-primary);
      color: #fff;
      transform: scale(1.1);
      box-shadow: 0 0 16px var(--accent-glow);
    }

    /* Locked Step Node */
    .stepper-node.locked .node-circle {
      opacity: 0.5;
      background: var(--bg-primary);
    }

    .node-meta {
      width: 100%;
      max-width: 140px;
    }

    .node-title {
      color: var(--text-primary);
    }

    .step-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #FFFFFF;
      background: var(--accent-primary);
      border: none;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all var(--transition-fast);
      box-shadow: 0 2px 8px var(--accent-glow);
      font-family: inherit;
    }
    .step-action-btn:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }

    .current-state-pill {
      display: inline-block;
      padding: 2px 8px;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--accent-primary);
      background: var(--accent-glow);
      border-radius: var(--radius-full);
    }

    /* Branching Panel */
    .branching-panel {
      border-color: var(--border-subtle);
    }

    .branch-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }

    .branch-info {
      display: flex;
      flex-direction: column;
    }
    .branch-name {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .branch-desc {
      font-size: 0.6875rem;
      color: var(--text-secondary);
    }

    .branch-status-pill {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: var(--radius-full);
    }
    .active-warning {
      background: var(--sla-at-risk-bg);
      color: var(--sla-at-risk);
      border: 1px solid var(--sla-at-risk-border);
    }
    .active-danger {
      background: var(--sla-breached-bg);
      color: var(--sla-breached);
      border: 1px solid var(--sla-breached-border);
    }
  `]
})
export class StateStepperComponent {
  @Input() ticket: Ticket | null = null;
  @Input() isManager: boolean = false;
  @Input() isTeamLead: boolean = false;
  @Input() isAgent: boolean = false;
  @Input() isEmployee: boolean = false;

  @Output() transition = new EventEmitter<TicketStatus>();
  @Output() openResolve = new EventEmitter<void>();

  // Primary ITIL sequence
  readonly mainSteps: WorkflowStep[] = [
    {
      key: 'OPEN',
      title: 'جديدة',
      subtitle: 'Open Incident',
      description: 'تسجيل البلاغ في النظام وبدء احتساب مهلة الاستجابة',
      icon: 'sparkle'
    },
    {
      key: 'ASSIGNED',
      title: 'مسندة',
      subtitle: 'Assigned to Agent',
      description: 'تم توجيه التذكرة إلى فني أو فريق دعم معتمد',
      icon: 'user'
    },
    {
      key: 'IN_PROGRESS',
      title: 'قيد المعالجة',
      subtitle: 'In Progress (Active)',
      description: 'الفني يجري الفحوصات التقنية ويعمل على الإصلاح',
      icon: 'cog'
    },
    {
      key: 'RESOLVED',
      title: 'تم الحل',
      subtitle: 'Resolved & Fixed',
      description: 'تم إصلاح العطل وتوثيق ملخص خطوات الحل',
      icon: 'check'
    },
    {
      key: 'CLOSED',
      title: 'مغلقة نهائياً',
      subtitle: 'Closed & Archived',
      description: 'إغلاق نهائي بعد تأكيد العميل أو انقضاء مهلة الاعتراض',
      icon: 'archive'
    }
  ];

  isCurrentStep(status: TicketStatus): boolean {
    return this.ticket?.status === status;
  }

  isStepCompleted(status: TicketStatus): boolean {
    if (!this.ticket) return false;
    const current = this.ticket.status;

    // Linear order mapping
    const order: Record<TicketStatus, number> = {
      'OPEN': 1,
      'ASSIGNED': 2,
      'IN_PROGRESS': 3,
      'WAITING_FOR_USER': 3, // parallel to in progress
      'RESOLVED': 4,
      'CLOSED': 5,
      'REOPENED': 3 // repeats cycle
    };

    const currentOrder = order[current] || 0;
    const stepOrder = order[status] || 0;

    return stepOrder < currentOrder;
  }

  isConnectorActive(stepIndex: number): boolean {
    if (!this.ticket) return false;
    const currentStep = this.mainSteps[stepIndex];
    return this.isStepCompleted(this.mainSteps[stepIndex + 1]?.key || 'OPEN');
  }

  canTransitionTo(targetStatus: TicketStatus): boolean {
    if (!this.ticket) return false;
    const current = this.ticket.status;
    if (current === targetStatus) return false;

    // Employee permissions
    if (this.isEmployee && !this.isManager && !this.isAgent && !this.isTeamLead) {
      if (current === 'RESOLVED') {
        return targetStatus === 'CLOSED' || targetStatus === 'REOPENED';
      }
      return false;
    }

    // Backend validated state transitions
    switch (current) {
      case 'OPEN':
        return targetStatus === 'ASSIGNED' || targetStatus === 'IN_PROGRESS' || targetStatus === 'CLOSED';
      case 'ASSIGNED':
        return targetStatus === 'IN_PROGRESS' || targetStatus === 'WAITING_FOR_USER' || targetStatus === 'CLOSED';
      case 'IN_PROGRESS':
        return targetStatus === 'WAITING_FOR_USER' || targetStatus === 'RESOLVED' || targetStatus === 'CLOSED';
      case 'WAITING_FOR_USER':
        return targetStatus === 'IN_PROGRESS' || targetStatus === 'RESOLVED' || targetStatus === 'CLOSED';
      case 'RESOLVED':
        return targetStatus === 'CLOSED' || targetStatus === 'REOPENED';
      case 'REOPENED':
        return targetStatus === 'IN_PROGRESS' || targetStatus === 'ASSIGNED' || targetStatus === 'RESOLVED';
      case 'CLOSED':
        return false;
      default:
        return false;
    }
  }

  onNodeClick(status: TicketStatus): void {
    if (!this.canTransitionTo(status)) return;

    if (status === 'RESOLVED') {
      this.openResolve.emit();
    } else {
      this.transition.emit(status);
    }
  }

  getStepTooltip(status: TicketStatus): string {
    if (this.isCurrentStep(status)) return 'المرحلة الحالية قيد المعالجة';
    if (this.isStepCompleted(status)) return 'تم اجتياز هذه المرحلة بنجاح';
    if (this.canTransitionTo(status)) return `انقر للانتقال المباشر إلى: ${status}`;
    return 'غير متاح حالياً وفق قواعد آلة الحالات (ITIL State Guards)';
  }

  formatStatus(status: string | undefined): string {
    return status ? status.replace(/_/g, ' ') : '';
  }
}
