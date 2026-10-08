import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-container glass-panel">
      <nav class="sidebar-nav">
        <div class="nav-section-title">القائمة الرئيسية</div>

        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>لوحة المؤشرات</span>
        </a>

        <a routerLink="/tickets" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>التذاكر والطلبات</span>
        </a>

        <a routerLink="/tickets/new" routerLinkActive="active" class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          <span>إنشاء تذكرة جديدة</span>
        </a>

        @if (!authService.isEmployee()) {
          <div class="nav-section-title" style="margin-top: 24px;">الفلاتر التشغيلية</div>

          <a routerLink="/tickets" [queryParams]="{ slaStatus: 'AT_RISK' }" class="nav-item filter-link">
            <span class="status-dot dot-risk"></span>
            <span>تذاكر مهددة (At Risk)</span>
          </a>

          <a routerLink="/tickets" [queryParams]="{ slaStatus: 'BREACHED' }" class="nav-item filter-link">
            <span class="status-dot dot-breached"></span>
            <span>تذاكر متجاوزة SLA</span>
          </a>

          <a routerLink="/tickets" [queryParams]="{ priority: 'CRITICAL' }" class="nav-item filter-link">
            <span class="status-dot dot-critical"></span>
            <span>حالات حرجة (Critical)</span>
          </a>
        }
      </nav>

      <!-- Bottom User Persona Badge -->
      @if (authService.currentUser(); as user) {
        <div class="persona-box">
          <div class="persona-title">الدور التشغيلي الحالي</div>
          <div class="persona-role">
            @if (authService.isManager()) {
              <span class="badge badge-assigned">Service Manager</span>
            } @else if (authService.isTeamLead()) {
              <span class="badge badge-open">Team Lead</span>
            } @else if (authService.isAgent()) {
              <span class="badge badge-in-progress">Support Agent</span>
            } @else {
              <span class="badge badge-closed">Business Employee</span>
            }
          </div>
        </div>
      }
    </aside>
  `,
  styles: [`
    .sidebar-container {
      width: 250px;
      height: calc(100vh - 105px);
      position: sticky;
      top: 90px;
      margin-right: 24px;
      padding: 20px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      padding: 0 10px;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all var(--transition-fast);
    }
    .nav-item:hover {
      background: var(--bg-surface);
      color: var(--text-primary);
    }
    .nav-item.active {
      background: var(--accent-glow);
      color: var(--accent-primary);
      font-weight: 600;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-risk { background: var(--sla-at-risk); }
    .dot-breached { background: var(--sla-breached); }
    .dot-critical { background: var(--sla-breached); }

    .persona-box {
      padding: 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
    }
    .persona-title {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
      margin-bottom: 6px;
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
}
