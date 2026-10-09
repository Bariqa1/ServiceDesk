import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { Ticket, PageResponse } from '../../../core/models/models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="ticket-list-page animate-fade-in">
      <!-- Header -->
      <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight">{{ i18n.t('ticketList.title') }}</h1>
          <p class="text-xs text-secondary mt-0.5">
            {{ i18n.t('ticketList.subtitle') }}
          </p>
        </div>
        <div class="flex items-center gap-2.5">
          <button class="btn btn-secondary btn-sm" (click)="loadTickets()">
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

      <!-- Apple Minimalist Single Toolbar (Clean, Unified, Zero Waste) -->
      <div class="toolbar-bar flex flex-wrap items-center justify-between gap-3 mb-4 p-2 rounded-xl border">
        <div class="flex flex-wrap items-center gap-2 flex-1">
          <!-- Compact Search Box -->
          <div class="search-box relative">
            <div class="search-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (keyup.enter)="applyFilters()"
              (blur)="applyFilters()"
              [placeholder]="i18n.t('ticketList.searchPlaceholder')" 
              class="toolbar-search-input"
            />
          </div>

          <div class="toolbar-sep"></div>

          <!-- Inline Dropdowns -->
          <div class="flex flex-wrap items-center gap-2">
            <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="toolbar-select">
              <option value="">{{ i18n.t('ticketList.allStatuses') }}</option>
              <option value="OPEN">{{ i18n.formatStatus('OPEN') }}</option>
              <option value="ASSIGNED">{{ i18n.formatStatus('ASSIGNED') }}</option>
              <option value="IN_PROGRESS">{{ i18n.formatStatus('IN_PROGRESS') }}</option>
              <option value="WAITING_FOR_USER">{{ i18n.formatStatus('WAITING_FOR_USER') }}</option>
              <option value="RESOLVED">{{ i18n.formatStatus('RESOLVED') }}</option>
              <option value="CLOSED">{{ i18n.formatStatus('CLOSED') }}</option>
              <option value="REOPENED">{{ i18n.formatStatus('REOPENED') }}</option>
            </select>

            <select [(ngModel)]="selectedPriority" (change)="applyFilters()" class="toolbar-select">
              <option value="">{{ i18n.t('ticketList.allPriorities') }}</option>
              <option value="CRITICAL">{{ i18n.formatPriority('CRITICAL') }}</option>
              <option value="HIGH">{{ i18n.formatPriority('HIGH') }}</option>
              <option value="MEDIUM">{{ i18n.formatPriority('MEDIUM') }}</option>
              <option value="LOW">{{ i18n.formatPriority('LOW') }}</option>
            </select>

            <select [(ngModel)]="selectedSla" (change)="applyFilters()" class="toolbar-select">
              <option value="">{{ i18n.t('ticketList.allSla') }}</option>
              <option value="WITHIN_SLA">{{ i18n.formatSla('WITHIN_SLA') }}</option>
              <option value="AT_RISK">{{ i18n.formatSla('AT_RISK') }}</option>
              <option value="BREACHED">{{ i18n.formatSla('BREACHED') }}</option>
            </select>

            @if (hasActiveFilters()) {
              <button class="clear-filters-btn" (click)="resetFilters()" [title]="i18n.t('ticketList.clearFilters')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>{{ i18n.t('ticketList.clearFilters') }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Right Side: Count -->
        <div class="text-[11px] font-medium text-secondary px-2">
          {{ pageData()?.totalElements ?? 0 }} {{ i18n.t('nav.tickets') }}
        </div>
      </div>

      <!-- Tickets Table Card -->
      <div class="card rounded-xl border overflow-hidden">
        @if (loading()) {
          <div class="p-12 text-center text-secondary text-sm">
            {{ i18n.t('common.loading') }}
          </div>
        } @else if (pageData()?.content?.length === 0) {
          <div class="empty-state p-12 text-center text-secondary text-sm">
            {{ i18n.t('ticketList.noTickets') }}
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
                  <th style="width: 140px; white-space: nowrap;">{{ i18n.t('ticketList.colAssignee') }}</th>
                  <th style="width: 150px; white-space: nowrap;">{{ i18n.t('ticketList.colCreatedAt') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (t of pageData()?.content; track t.publicId) {
                  <tr class="hover-row">
                    <td class="font-mono font-bold" style="white-space: nowrap;">
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
                    <td style="white-space: nowrap;">
                      <div class="text-xs">
                        @if (t.assignedAgentFullName) {
                          <span class="font-medium text-primary">{{ t.assignedAgentFullName }}</span>
                        } @else {
                          <span class="text-tertiary italic">{{ i18n.t('common.unassigned') }}</span>
                        }
                      </div>
                    </td>
                    <td class="text-secondary" style="white-space: nowrap;">
                      {{ t.createdAt | date:'short' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="pagination-bar p-3 border-t flex justify-between items-center text-xs text-secondary">
            <div>
              {{ getPageInfo() }}
            </div>
            <div class="flex items-center gap-2">
              <button 
                class="btn btn-secondary btn-sm" 
                [disabled]="(pageData()?.pageNumber ?? 0) === 0"
                (click)="goToPage((pageData()?.pageNumber ?? 0) - 1)"
              >
                {{ i18n.t('ticketList.prev') }}
              </button>
              <button 
                class="btn btn-secondary btn-sm" 
                [disabled]="(pageData()?.pageNumber ?? 0) >= (pageData()?.totalPages ?? 1) - 1"
                (click)="goToPage((pageData()?.pageNumber ?? 0) + 1)"
              >
                {{ i18n.t('ticketList.next') }}
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ticket-list-page {
      width: 100%;
      padding-bottom: 24px;
    }
    .toolbar-bar {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-sm);
    }
    .search-box {
      width: 250px;
      max-width: 100%;
    }
    .search-icon {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      inset-inline-start: 10px;
      color: var(--text-tertiary);
      pointer-events: none;
      display: flex;
      align-items: center;
    }
    .toolbar-search-input {
      width: 100%;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      color: var(--text-primary);
      padding-inline-start: 30px;
      padding-inline-end: 10px;
      font-size: 0.8125rem;
      outline: none;
      transition: all var(--transition-fast);
      box-sizing: border-box;
      font-family: inherit;
    }
    .toolbar-search-input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-glow);
    }
    .toolbar-sep {
      width: 1px;
      height: 20px;
      background: var(--border-subtle);
      margin: 0 4px;
    }
    .toolbar-select {
      height: 32px;
      padding: 0 10px;
      padding-inline-end: 26px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.775rem;
      font-weight: 500;
      outline: none;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      transition: all var(--transition-fast);
      font-family: inherit;
      background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2386868B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 9px) center;
    }
    :host-context([dir="rtl"]) .toolbar-select {
      background-position: 9px center;
    }
    .toolbar-select:hover {
      border-color: var(--border-strong);
    }
    .toolbar-select:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-glow);
    }
    .clear-filters-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 32px;
      padding: 0 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: inherit;
    }
    .clear-filters-btn:hover {
      color: var(--sla-breached);
      border-color: var(--sla-breached-border);
      background: var(--sla-breached-bg);
    }
    .hover-row:hover {
      background: rgba(125,125,125,0.03);
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
  `]
})
export class TicketListComponent implements OnInit {
  private api = inject(ApiService);
  private ws = inject(WebSocketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public auth = inject(AuthService);
  public i18n = inject(I18nService);

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

  getPageInfo(): string {
    const page = (this.pageData()?.pageNumber ?? 0) + 1;
    const totalPages = this.pageData()?.totalPages || 1;
    const total = this.pageData()?.totalElements ?? 0;
    return this.i18n.t('ticketList.pageOf')
      .replace('{page}', String(page))
      .replace('{totalPages}', String(totalPages))
      .replace('{total}', String(total));
  }
}
