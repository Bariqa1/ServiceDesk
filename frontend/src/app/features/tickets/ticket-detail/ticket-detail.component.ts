import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { Ticket, TicketStatus, UserSummary, AiAgentAnalysisResponse, AiAuditLog, AiTrajectoryStep } from '../../../core/models/models';
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

            <!-- Autonomous AI Agent Command Center Card -->
            <div class="card card-ai-agent p-5 rounded-xl border mb-1">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <div class="ai-avatar-glow flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z"/>
                      <path d="M18 8a6 6 0 0 1 6 6v2a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6v-2a6 6 0 0 1 6-6"/>
                      <path d="M9 16h6"/>
                      <path d="M12 12v4"/>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h2 class="text-sm font-bold text-primary">{{ i18n.t('aiAgent.header') }}</h2>
                      <span class="ai-status-tag">
                        <span class="pulsing-dot"></span>
                        {{ i18n.t('aiAgent.statusActive') }}
                      </span>
                    </div>
                    <p class="text-xs text-secondary mt-0.5">{{ i18n.t('aiAgent.subHeader') }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    class="btn btn-primary btn-sm btn-ai-pulse" 
                    [disabled]="aiRunning()" 
                    (click)="runAiDiagnosis()"
                  >
                    @if (aiRunning()) {
                      <span class="spinner-sm"></span>
                      <span>{{ i18n.t('aiAgent.running') }}</span>
                    } @else {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      <span>{{ i18n.t('aiAgent.runDiagnosis') }}</span>
                    }
                  </button>
                </div>
              </div>

              @if (aiAnalysis()) {
                <div class="ai-results-wrapper animate-fade-in flex flex-col gap-3 mt-4">
                  <!-- Metrics Strip -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div class="metric-pill p-2.5 rounded-lg border">
                      <div class="text-[11px] text-secondary font-medium">{{ i18n.t('aiAgent.confidence') }}</div>
                      <div class="text-base font-bold text-accent mt-0.5 flex items-center gap-1.5">
                        <span>{{ aiAnalysis()?.confidenceScore }}%</span>
                        <div class="mini-confidence-bar">
                          <div class="fill" [style.width.%]="aiAnalysis()?.confidenceScore"></div>
                        </div>
                      </div>
                    </div>
                    <div class="metric-pill p-2.5 rounded-lg border">
                      <div class="text-[11px] text-secondary font-medium">{{ i18n.t('aiAgent.predictedCategory') }}</div>
                      <div class="text-sm font-semibold text-primary mt-0.5">{{ aiAnalysis()?.predictedCategory }}</div>
                    </div>
                    <div class="metric-pill p-2.5 rounded-lg border">
                      <div class="text-[11px] text-secondary font-medium">{{ i18n.t('aiAgent.calculatedPriority') }}</div>
                      <div class="text-sm font-semibold text-primary mt-0.5">{{ aiAnalysis()?.calculatedPriority }}</div>
                    </div>
                    <div class="metric-pill p-2.5 rounded-lg border">
                      <div class="text-[11px] text-secondary font-medium">{{ i18n.t('aiAgent.suggestedTeam') }}</div>
                      <div class="text-sm font-semibold text-primary mt-0.5 truncate">{{ aiAnalysis()?.suggestedTeam }}</div>
                    </div>
                  </div>

                  <!-- Enterprise Guardrails Shield Card -->
                  @if (aiAnalysis()?.guardrailReport; as gr) {
                    <div class="guardrails-shield-card p-3.5 rounded-xl border" [class.guardrail-passed]="gr.status === 'PASSED'" [class.guardrail-sanitized]="gr.status === 'SANITIZED'" [class.guardrail-blocked]="gr.status === 'BLOCKED'">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <span class="text-base">🛡️</span>
                          <div>
                            <span class="text-xs font-bold text-primary">{{ i18n.t('aiAgent.guardrailsTitle') }}</span>
                            <p class="text-[11px] text-secondary">{{ i18n.t('aiAgent.guardrailsDesc') }}</p>
                          </div>
                        </div>
                        <div class="guardrail-status-badge font-semibold text-[11px] px-2.5 py-1 rounded-full border">
                          @if (gr.status === 'PASSED') {
                            <span class="text-emerald-500 font-bold">✓ {{ i18n.t('aiAgent.guardrailsPassed') }}</span>
                          } @else if (gr.status === 'SANITIZED') {
                            <span class="text-amber-500 font-bold">⚠️ {{ i18n.t('aiAgent.guardrailsSanitized') }}</span>
                          } @else {
                            <span class="text-rose-500 font-bold">🚨 {{ i18n.t('aiAgent.guardrailsBlocked') }}</span>
                          }
                        </div>
                      </div>

                      <!-- Guardrail Protection Chips -->
                      <div class="flex flex-wrap gap-1.5 mt-2.5">
                        <span class="guardrail-chip text-[11px] px-2 py-0.5 rounded-md border" [class.chip-alert]="gr.promptInjectionDetected" [class.chip-ok]="!gr.promptInjectionDetected">
                          {{ gr.promptInjectionDetected ? ('🚨 ' + i18n.t('aiAgent.guardrailsInjectionDetected')) : ('✓ ' + i18n.t('aiAgent.guardrailsCleanPill')) }}
                        </span>
                        @if (gr.secretsRedacted) {
                          <span class="guardrail-chip text-[11px] px-2 py-0.5 rounded-md border chip-warning">
                            🔒 {{ i18n.t('aiAgent.guardrailsSecretsMasked') }}
                          </span>
                        }
                        @if (gr.piiRedacted && !gr.secretsRedacted) {
                          <span class="guardrail-chip text-[11px] px-2 py-0.5 rounded-md border chip-warning">
                            👤 {{ i18n.t('aiAgent.guardrailsPiiMasked') }}
                          </span>
                        }
                        @if (gr.destructiveCommandsBlocked) {
                          <span class="guardrail-chip text-[11px] px-2 py-0.5 rounded-md border chip-alert">
                            🛑 {{ i18n.t('aiAgent.guardrailsDestructiveBlocked') }}
                          </span>
                        }
                        <span class="guardrail-chip text-[11px] px-2 py-0.5 rounded-md border text-secondary font-mono">
                          {{ i18n.t('aiAgent.guardrailsRiskScore') }}: {{ gr.riskScore }}%
                        </span>
                      </div>

                      <!-- Violation Details if any -->
                      @if (gr.violations && gr.violations.length > 0) {
                        <div class="mt-2.5 pt-2 border-t text-[11px] flex flex-col gap-1">
                          <span class="font-bold text-secondary">{{ i18n.t('aiAgent.guardrailsViolationsList') }}:</span>
                          @for (v of gr.violations; track v.details) {
                            <div class="flex items-center gap-2 p-1.5 rounded bg-card border font-mono">
                              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" [class.bg-rose-500]="v.severity === 'CRITICAL'" [class.bg-amber-500]="v.severity === 'HIGH' || v.severity === 'MEDIUM'">
                                {{ v.severity }}
                              </span>
                              <span class="font-semibold text-primary">{{ v.rule }}</span>
                              <span class="text-secondary truncate">{{ v.details }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }

                  <!-- Reasoning Trajectory Pipeline -->
                  <div class="trajectory-card p-3.5 rounded-xl border bg-subtle">

                    <div class="flex items-center justify-between mb-2.5">
                      <div class="text-xs font-bold text-primary flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        <span>{{ i18n.t('aiAgent.trajectoryTitle') }}</span>
                      </div>
                      <span class="text-[11px] text-secondary font-mono">{{ aiAnalysis()?.trajectory?.length }} steps verified</span>
                    </div>

                    <div class="trajectory-steps-list flex flex-col gap-2">
                      @for (step of aiAnalysis()?.trajectory; track step.stepIndex) {
                        <div 
                          class="step-row p-2.5 rounded-lg border transition-all cursor-pointer"
                          [class.expanded]="aiExpandedStep() === step.stepIndex"
                          (click)="toggleStep(step.stepIndex)"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                              <span class="step-num-badge font-mono">{{ step.stepIndex }}</span>
                              <span class="agent-tag">{{ step.agent }}</span>
                              <span class="text-xs font-semibold text-primary">{{ step.action }}</span>
                            </div>
                            <span class="text-[10px] text-secondary font-mono">{{ step.timestamp }}</span>
                          </div>

                          @if (aiExpandedStep() === step.stepIndex) {
                            <div class="step-details-body mt-2.5 pt-2.5 border-t text-xs flex flex-col gap-1.5 animate-fade-in">
                              <div class="thought-bubble p-2 rounded bg-card border">
                                <span class="font-bold text-accent">Thought:</span> {{ step.thought }}
                              </div>
                              @if (step.toolCalled) {
                                <div class="text-[11px] text-secondary font-mono">
                                  <span class="font-bold">Tool Executed:</span> {{ step.toolCalled }}
                                </div>
                              }
                              @if (step.observation) {
                                <div class="text-[11px] text-secondary font-mono">
                                  <span class="font-bold">Observation:</span> {{ step.observation }}
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Root Cause & Solution Cards -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="p-3.5 rounded-xl border bg-subtle">
                      <div class="text-xs font-bold text-primary mb-1 flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>{{ i18n.t('aiAgent.rootCauseTitle') }}</span>
                      </div>
                      <div class="text-xs text-secondary leading-relaxed whitespace-pre-line mt-1.5">
                        {{ aiAnalysis()?.rootCauseAnalysis }}
                      </div>
                    </div>

                    <div class="p-3.5 rounded-xl border bg-subtle">
                      <div class="text-xs font-bold text-primary mb-1 flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span>{{ i18n.t('aiAgent.solutionTitle') }}</span>
                      </div>
                      <div class="text-xs text-secondary leading-relaxed whitespace-pre-line mt-1.5 font-mono bg-card p-2 rounded border">
                        {{ aiAnalysis()?.proposedResolution }}
                      </div>
                    </div>
                  </div>

                  <!-- Human-in-the-Loop Action Card -->
                  @if (ticket()?.status !== 'RESOLVED' && ticket()?.status !== 'CLOSED') {
                    <div class="hitl-card p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3">
                      <div class="flex items-center gap-2.5 max-w-xl">
                        <div class="hitl-icon flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        </div>
                        <div>
                          <div class="text-xs font-bold text-primary">{{ i18n.t('aiAgent.hitlBanner') }}</div>
                          <div class="text-[11px] text-secondary mt-0.5">Automated decision gating guarantees SLA safety and verified technical resolution.</div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <button 
                          class="btn btn-primary btn-sm btn-approve-gradient" 
                          [disabled]="aiApproving()"
                          (click)="approveAiRecommendation('RESOLVE')"
                        >
                          @if (aiApproving()) {
                            <span class="spinner-sm"></span>
                            <span>{{ i18n.t('aiAgent.approving') }}</span>
                          } @else {
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>{{ i18n.t('aiAgent.approveBtn') }}</span>
                          }
                        </button>
                      </div>
                    </div>
                  } @else {
                    <div class="p-3 rounded-xl border bg-green-soft flex items-center gap-2 text-xs font-semibold text-green">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{{ i18n.t('aiAgent.approvedBadge') }}</span>
                    </div>
                  }
                </div>
              }
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

    /* Autonomous AI Agent Command Center Styles */
    .card-ai-agent {
      background: linear-gradient(135deg, var(--bg-card) 0%, rgba(139, 92, 246, 0.03) 100%);
      border-color: rgba(139, 92, 246, 0.22);
      box-shadow: 0 4px 20px -2px rgba(139, 92, 246, 0.06);
    }
    .ai-avatar-glow {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.35);
    }
    .ai-status-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 9999px;
      background: rgba(139, 92, 246, 0.12);
      color: #8B5CF6;
      font-size: 0.68rem;
      font-weight: 700;
    }
    .pulsing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #8B5CF6;
      animation: pulseDot 1.8s infinite;
    }
    @keyframes pulseDot {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }
    .btn-ai-pulse {
      background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
      border: none;
      color: #fff;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);
    }
    .btn-ai-pulse:hover:not(:disabled) {
      background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
    }
    .btn-approve-gradient {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      border: none;
      color: #fff;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }
    .btn-approve-gradient:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }
    .metric-pill {
      background: var(--bg-card);
      border-color: var(--border-subtle);
    }
    .guardrails-shield-card {
      background: var(--bg-card);
      border-color: var(--border-subtle);
      transition: all 0.2s ease;
    }
    .guardrails-shield-card.guardrail-passed {
      border-color: rgba(16, 185, 129, 0.3);
      background: linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.03) 100%);
    }
    .guardrails-shield-card.guardrail-sanitized {
      border-color: rgba(245, 158, 11, 0.3);
      background: linear-gradient(135deg, var(--bg-card) 0%, rgba(245, 158, 11, 0.03) 100%);
    }
    .guardrails-shield-card.guardrail-blocked {
      border-color: rgba(239, 68, 68, 0.4);
      background: linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%);
    }
    .guardrail-chip {
      background: var(--bg-card);
      border-color: var(--border-subtle);
    }
    .guardrail-chip.chip-ok {
      color: #10B981;
      border-color: rgba(16, 185, 129, 0.25);
    }
    .guardrail-chip.chip-warning {
      color: #F59E0B;
      border-color: rgba(245, 158, 11, 0.3);
      background: rgba(245, 158, 11, 0.05);
    }
    .guardrail-chip.chip-alert {
      color: #EF4444;
      border-color: rgba(239, 68, 68, 0.35);
      background: rgba(239, 68, 68, 0.08);
      font-weight: 700;
    }

    .mini-confidence-bar {
      width: 40px;
      height: 4px;
      background: var(--border-subtle);
      border-radius: 9999px;
      overflow: hidden;
    }
    .mini-confidence-bar .fill {
      height: 100%;
      background: #8B5CF6;
      border-radius: 9999px;
    }
    .step-row {
      background: var(--bg-card);
      border-color: var(--border-subtle);
    }
    .step-row:hover {
      border-color: rgba(139, 92, 246, 0.35);
    }
    .step-row.expanded {
      border-color: #8B5CF6;
      background: rgba(139, 92, 246, 0.02);
    }
    .step-num-badge {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--border-subtle);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 700;
    }
    .agent-tag {
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(139, 92, 246, 0.1);
      color: #8B5CF6;
      font-size: 0.65rem;
      font-weight: 700;
      font-family: monospace;
    }
    .hitl-card {
      background: rgba(16, 185, 129, 0.04);
      border-color: rgba(16, 185, 129, 0.25);
    }
    .hitl-icon {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: rgba(16, 185, 129, 0.15);
      color: #10B981;
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

  // AI Agent Signals
  aiAnalysis = signal<AiAgentAnalysisResponse | null>(null);
  aiRunning = signal<boolean>(false);
  aiApproving = signal<boolean>(false);
  aiHistory = signal<AiAuditLog[]>([]);
  aiExpandedStep = signal<number | null>(null);

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

    this.loadAiHistory();
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

  toggleStep(index: number) {
    this.aiExpandedStep.set(this.aiExpandedStep() === index ? null : index);
  }

  runAiDiagnosis() {
    this.aiRunning.set(true);
    this.api.diagnoseTicketWithAi(this.ticketPublicId()).subscribe({
      next: (res) => {
        this.aiAnalysis.set(res);
        this.aiRunning.set(false);
        this.loadAiHistory();
      },
      error: () => this.aiRunning.set(false)
    });
  }

  approveAiRecommendation(action: string = 'RESOLVE') {
    this.aiApproving.set(true);
    this.api.approveAiProposal(this.ticketPublicId(), action).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.aiApproving.set(false);
        this.loadTicket();
        this.loadAiHistory();
      },
      error: () => this.aiApproving.set(false)
    });
  }

  loadAiHistory() {
    this.api.getTicketAiHistory(this.ticketPublicId()).subscribe(history => {
      this.aiHistory.set(history);
      if (history && history.length > 0 && !this.aiAnalysis()) {
        const latest = history[0];
        try {
          const steps = JSON.parse(latest.trajectoryJson || '[]');
          this.aiAnalysis.set({
            ticketNumber: latest.ticketNumber,
            languageDetected: 'AR',
            predictedCategory: latest.predictedCategory,
            calculatedPriority: latest.calculatedPriority,
            urgencyScore: 80,
            confidenceScore: latest.confidenceScore,
            actionType: latest.actionType,
            requiresHumanApproval: latest.requiresHumanApproval,
            rootCauseAnalysis: latest.rootCauseAnalysis,
            proposedResolution: latest.proposedResolution,
            suggestedTeam: 'Support Team',
            slaBreachRisk: 'NOMINAL',
            trajectory: steps,
            knowledgeMatches: [],
            diagnosticResults: []
          });
        } catch (e) {}
      }
    });
  }
}
