import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Ticket, PageResponse } from '../../../core/models/models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="ticket-list-page animate-fade-in">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">طابور التذاكر والطلبات</h1>
          <p class="text-sm text-secondary">
            إدارة ومتابعة طلبات الدعم الفني الداخلي واتفاقيات مستوى الخدمة (SLA).
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn btn-secondary" (click)="loadTickets()">
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
            إنشاء تذكرة
          </a>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="filter-card p-4 rounded-xl border mb-6 flex flex-wrap items-center justify-between gap-4">
        <!-- Search Input -->
        <div class="flex-1 min-w-[240px] relative">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (keyup.enter)="applyFilters()"
            placeholder="بحث بالعنوان، الوصف أو رقم التذكرة..." 
            class="input-field w-full pr-9"
          />
        </div>

        <!-- Filter Selects -->
        <div class="flex flex-wrap items-center gap-2.5">
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="select-field">
            <option value="">جميع الحالات</option>
            <option value="OPEN">Open (جديدة)</option>
            <option value="ASSIGNED">Assigned (مسندة)</option>
            <option value="IN_PROGRESS">In Progress (قيد المعالجة)</option>
            <option value="WAITING_FOR_USER">Waiting For User (بانتظار الموظف)</option>
            <option value="RESOLVED">Resolved (تم الحل)</option>
            <option value="CLOSED">Closed (مغلقة)</option>
            <option value="REOPENED">Reopened (معاد فتحها)</option>
          </select>

          <select [(ngModel)]="selectedPriority" (change)="applyFilters()" class="select-field">
            <option value="">جميع الأولويات</option>
            <option value="CRITICAL">Critical (حرجة)</option>
            <option value="HIGH">High (عالية)</option>
            <option value="MEDIUM">Medium (متوسطة)</option>
            <option value="LOW">Low (منخفضة)</option>
          </select>

          <select [(ngModel)]="selectedSla" (change)="applyFilters()" class="select-field">
            <option value="">جميع حالات SLA</option>
            <option value="WITHIN_SLA">ضمن المهلة (Within SLA)</option>
            <option value="AT_RISK">مهددة بالانقضاء (At Risk)</option>
            <option value="BREACHED">متجاوزة (Breached)</option>
          </select>

          @if (hasActiveFilters()) {
            <button class="btn btn-secondary btn-sm" (click)="resetFilters()">
              مسح التصفية
            </button>
          }
        </div>
      </div>

      <!-- Tickets Table -->
      <div class="card rounded-xl border overflow-hidden">
        @if (loading()) {
          <div class="p-12 text-center text-secondary text-sm">
            جاري تحميل التذاكر...
          </div>
        } @else if (pageData()?.content?.length === 0) {
          <div class="empty-state p-12 text-center text-secondary text-sm">
            لا توجد تذاكر تطابق معايير البحث.
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table w-full text-right text-xs">
              <thead>
                <tr>
                  <th style="width: 110px;">رقم التذكرة</th>
                  <th>عنوان الطلب والمشكلة</th>
                  <th style="width: 100px;">الأولوية</th>
                  <th style="width: 130px;">الحالة</th>
                  <th style="width: 130px;">حالة SLA</th>
                  <th style="width: 140px;">المسؤول</th>
                  <th style="width: 130px;">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody>
                @for (t of pageData()?.content; track t.publicId) {
                  <tr class="hover-row">
                    <td class="font-mono font-bold">
                      <a [routerLink]="['/tickets', t.publicId]" class="ticket-key-link">
                        {{ t.ticketNumber }}
                      </a>
                    </td>
                    <td>
                      <div class="flex flex-col">
                        <a [routerLink]="['/tickets', t.publicId]" class="ticket-title-link font-semibold text-sm">
                          {{ t.title }}
                        </a>
                        <div class="flex items-center gap-2 mt-0.5 text-secondary text-[11px]">
                          <span>{{ t.categoryName }}</span>
                          @if (t.serviceName) {
                            <span>• {{ t.serviceName }}</span>
                          }
                          @if (t.assignedTeamName) {
                            <span>• {{ t.assignedTeamName }}</span>
                          }
                        </div>
                      </div>
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
                    <td>
                      <div class="text-xs">
                        @if (t.assignedAgentFullName) {
                          <span class="font-medium">{{ t.assignedAgentFullName }}</span>
                        } @else {
                          <span class="text-secondary italic">غير مسند</span>
                        }
                      </div>
                    </td>
                    <td class="text-secondary">
                      {{ t.createdAt | date:'short' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="pagination-bar p-3.5 border-t flex justify-between items-center text-xs text-secondary">
            <div>
              صفحة {{ (pageData()?.pageNumber ?? 0) + 1 }} من {{ pageData()?.totalPages || 1 }} 
              ({{ pageData()?.totalElements ?? 0 }} تذكرة)
            </div>
            <div class="flex items-center gap-2">
              <button 
                class="btn btn-secondary btn-sm" 
                [disabled]="(pageData()?.pageNumber ?? 0) === 0"
                (click)="goToPage((pageData()?.pageNumber ?? 0) - 1)"
              >
                السابق
              </button>
              <button 
                class="btn btn-secondary btn-sm" 
                [disabled]="(pageData()?.pageNumber ?? 0) >= (pageData()?.totalPages ?? 1) - 1"
                (click)="goToPage((pageData()?.pageNumber ?? 0) + 1)"
              >
                التالي
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ticket-list-page {
      max-width: 1320px;
      margin: 0 auto;
    }
    .filter-card, .card {
      background: var(--bg-surface);
      border-color: var(--border-subtle);
    }
    .input-field, .select-field {
      height: 38px;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 0 0.75rem;
      font-size: 0.85rem;
    }
    .input-field:focus, .select-field:focus {
      outline: none;
      border-color: var(--accent-primary);
    }
    .data-table {
      border-collapse: collapse;
    }
    .data-table th {
      padding: 0.8rem 0.6rem;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.75rem;
    }
    .data-table td {
      padding: 0.8rem 0.6rem;
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
  `]
})
export class TicketListComponent implements OnInit {
  private api = inject(ApiService);
  private ws = inject(WebSocketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public auth = inject(AuthService);

  pageData = signal<PageResponse<Ticket> | null>(null);
  loading = signal<boolean>(false);

  searchQuery = '';
  selectedStatus = '';
  selectedPriority = '';
  selectedSla = '';
  currentPage = 0;

  constructor() {
    effect(() => {
      const event = this.ws.latestEvent();
      if (event) {
        this.loadTickets();
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['status']) this.selectedStatus = params['status'];
      if (params['priority']) this.selectedPriority = params['priority'];
      if (params['slaStatus']) this.selectedSla = params['slaStatus'];
      this.loadTickets();
    });
  }

  loadTickets() {
    this.loading.set(true);
    const filters: any = {};
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.selectedPriority) filters.priority = this.selectedPriority;
    if (this.selectedSla) filters.slaStatus = this.selectedSla;
    if (this.searchQuery) filters.search = this.searchQuery;

    this.api.getTickets(this.currentPage, 10, filters).subscribe({
      next: (res) => {
        this.pageData.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters() {
    this.currentPage = 0;
    this.loadTickets();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.selectedSla = '';
    this.currentPage = 0;
    this.router.navigate(['/tickets']);
    this.loadTickets();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedStatus || this.selectedPriority || this.selectedSla);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadTickets();
  }

  formatStatus(status: string): string {
    return status ? status.replace(/_/g, ' ') : '';
  }

  formatSla(sla: string): string {
    return sla ? sla.replace(/_/g, ' ') : '';
  }
}
