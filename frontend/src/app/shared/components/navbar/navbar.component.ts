import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar-container glass-panel">
      <div class="navbar-left">
        <a routerLink="/dashboard" class="brand-logo">
          <div class="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">ServiceDesk</span>
            <span class="brand-badge">Enterprise</span>
          </div>
        </a>

        <!-- WebSocket Real-time Live Status Indicator -->
        <div class="live-indicator" [class.connected]="wsService.isConnected()" [title]="wsService.isConnected() ? 'Real-time WebSocket Live' : 'WebSocket Reconnecting...'">
          <span class="pulse-dot"></span>
          <span class="live-text">{{ wsService.isConnected() ? 'تزامن فوري مباشر' : 'جاري الاتصال...' }}</span>
        </div>
      </div>

      <div class="navbar-right">
        <!-- SLA Alerts Notification Dropdown -->
        @if (wsService.slaAlerts().length > 0) {
          <div class="sla-alert-pill animate-fade-in" routerLink="/tickets" [queryParams]="{ slaStatus: 'AT_RISK' }">
            <span class="alert-icon">⚠️</span>
            <span class="alert-count">{{ wsService.slaAlerts().length }} تنبيه SLA</span>
          </div>
        }

        <!-- Theme Toggle Button -->
        <button class="icon-btn" (click)="themeService.toggleTheme()" [title]="themeService.isDarkMode() ? 'تبديل للوضع الفاتح' : 'تبديل للوضع الداكن'">
          @if (themeService.isDarkMode()) {
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          } @else {
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          }
        </button>

        <!-- User Profile & Logout -->
        @if (authService.currentUser(); as user) {
          <div class="user-menu">
            <div class="user-avatar">{{ user.fullName.charAt(0) }}</div>
            <div class="user-info">
              <span class="user-name">{{ user.fullName }}</span>
              <span class="user-role">{{ user.jobTitle || 'موظف' }}</span>
            </div>
            <button class="logout-btn icon-btn" (click)="authService.logout()" title="تسجيل الخروج">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      flex-shrink: 0;
    }
    .navbar-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 28px;
      margin: 16px 24px 0 24px;
      border-radius: var(--radius-md);
      position: sticky;
      top: 16px;
      z-index: 100;
      box-sizing: border-box;
    }
    .navbar-left, .navbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }
    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: var(--accent-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 14px var(--accent-glow);
    }
    .brand-text {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .brand-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .brand-badge {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--accent-primary);
      background: var(--accent-glow);
      padding: 2px 6px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
    }
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #8E8E93;
    }
    .live-indicator.connected .pulse-dot {
      background: var(--sla-within);
      box-shadow: 0 0 8px var(--sla-within);
    }
    .live-indicator.connected {
      color: var(--sla-within);
      border-color: var(--sla-within-border);
    }
    .sla-alert-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: var(--sla-at-risk-bg);
      border: 1px solid var(--sla-at-risk-border);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--sla-at-risk);
      cursor: pointer;
      text-decoration: none;
    }
    .icon-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .icon-btn:hover {
      background: var(--border-subtle);
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
    }
    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 700;
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .user-role {
      font-size: 0.6875rem;
      color: var(--text-secondary);
    }
    .logout-btn {
      border: none;
      background: transparent;
      width: 26px;
      height: 26px;
      color: var(--text-tertiary);
    }
    .logout-btn:hover {
      color: var(--sla-breached);
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  wsService = inject(WebSocketService);

  constructor() {
    this.wsService.connect();
  }
}
