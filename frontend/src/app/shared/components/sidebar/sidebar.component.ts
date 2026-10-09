import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-container glass-panel">
      <div class="sidebar-top">
        <nav class="sidebar-nav">
          <div class="nav-section-title">{{ i18n.t('nav.mainMenu') }}</div>

          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>{{ i18n.t('nav.dashboard') }}</span>
          </a>

          <a routerLink="/tickets" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>{{ i18n.t('nav.tickets') }}</span>
          </a>

          <a routerLink="/tickets/new" routerLinkActive="active" class="nav-item">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span>{{ i18n.t('nav.newTicket') }}</span>
          </a>

          @if (!authService.isEmployee()) {
            <div class="nav-section-title mt-5">{{ i18n.t('nav.operationalFilters') }}</div>

            <a routerLink="/tickets" [queryParams]="{ slaStatus: 'AT_RISK' }" class="nav-item filter-link">
              <span class="status-dot dot-risk"></span>
              <span>{{ i18n.t('nav.filterAtRisk') }}</span>
            </a>

            <a routerLink="/tickets" [queryParams]="{ slaStatus: 'BREACHED' }" class="nav-item filter-link">
              <span class="status-dot dot-breached"></span>
              <span>{{ i18n.t('nav.filterBreached') }}</span>
            </a>

            <a routerLink="/tickets" [queryParams]="{ priority: 'CRITICAL' }" class="nav-item filter-link">
              <span class="status-dot dot-critical"></span>
              <span>{{ i18n.t('nav.filterCritical') }}</span>
            </a>
          }
        </nav>
      </div>

      <!-- Bottom User Persona Badge -->
      @if (authService.currentUser(); as user) {
        <div class="persona-box">
          <div class="persona-title">{{ i18n.t('nav.currentRole') }}</div>
          <div class="persona-role">
            @if (authService.isManager()) {
              <span class="badge badge-assigned">{{ i18n.t('role.service_manager') }}</span>
            } @else if (authService.isTeamLead()) {
              <span class="badge badge-open">{{ i18n.t('role.team_lead') }}</span>
            } @else if (authService.isAgent()) {
              <span class="badge badge-in-progress">{{ i18n.t('role.support_agent') }}</span>
            } @else {
              <span class="badge badge-closed">{{ i18n.t('role.business_employee') }}</span>
            }
          </div>
        </div>
      }
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      width: 220px;
      flex-shrink: 0;
      height: 100%;
    }
    .sidebar-container {
      width: 100%;
      height: 100%;
      padding: 14px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }
    .sidebar-top {
      display: flex;
      flex-direction: column;
    }
    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      padding: 0 10px;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: all var(--transition-fast);
    }
    .nav-item:hover {
      background: var(--border-subtle);
      color: var(--text-primary);
    }
    .nav-item.active {
      background: var(--accent-glow);
      color: var(--accent-primary);
      font-weight: 600;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .dot-risk { background: var(--sla-at-risk); }
    .dot-breached { background: var(--sla-breached); }
    .dot-critical { background: var(--sla-breached); }

    .persona-box {
      padding: 10px 12px;
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
    }
    .persona-title {
      font-size: 0.65rem;
      color: var(--text-tertiary);
      margin-bottom: 4px;
      font-weight: 500;
    }
    .persona-role .badge {
      font-size: 0.7rem;
      padding: 2px 8px;
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  i18n = inject(I18nService);
}
