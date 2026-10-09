import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar-container glass-panel">
      <!-- Left / Brand Area -->
      <div class="navbar-left">
        <a routerLink="/dashboard" class="brand-logo">
          <div class="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span class="brand-name">{{ i18n.t('brand.name') }}</span>
        </a>
      </div>

      <!-- Right / Actions & Profile Area -->
      <div class="navbar-right">
        <!-- SLA Alerts Pill (Only shown if alerts exist) -->
        @if (wsService.slaAlerts().length > 0) {
          <a class="sla-alert-pill animate-fade-in" routerLink="/tickets" [queryParams]="{ slaStatus: 'AT_RISK' }">
            <span class="alert-dot"></span>
            <span class="alert-count">{{ wsService.slaAlerts().length }} {{ i18n.t('nav.slaAlerts') }}</span>
          </a>
        }

        <!-- Language Switcher (Apple Minimalist Pill) -->
        <button 
          class="lang-toggle-btn" 
          (click)="i18n.toggleLanguage()" 
          [title]="i18n.isArabic() ? 'Switch to English' : 'التحويل إلى العربية'"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span class="lang-text">{{ i18n.isArabic() ? 'English' : 'عربي' }}</span>
        </button>

        <!-- Theme Toggle Button -->
        <button 
          class="icon-btn" 
          (click)="themeService.toggleTheme()" 
          [title]="themeService.isDarkMode() ? i18n.t('nav.themeLight') : i18n.t('nav.themeDark')"
        >
          @if (themeService.isDarkMode()) {
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          } @else {
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          }
        </button>

        <!-- User Profile & Logout -->
        @if (authService.currentUser(); as user) {
          <div class="user-menu">
            <div class="user-avatar">{{ user.fullName.charAt(0) }}</div>
            <div class="user-info">
              <span class="user-name">{{ user.fullName }}</span>
              <span class="user-role">{{ getUserRoleDisplay(user) }}</span>
            </div>
            <button class="logout-btn" (click)="authService.logout()" [title]="i18n.t('nav.logout')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
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
      padding: 10px 24px;
      margin: 14px 24px 0 24px;
      border-radius: var(--radius-md);
      position: sticky;
      top: 14px;
      z-index: 100;
      box-sizing: border-box;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-sm);
    }
    .navbar-left, .navbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: var(--accent-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px var(--accent-glow);
    }
    .brand-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .lang-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: inherit;
    }
    .lang-toggle-btn:hover {
      border-color: var(--accent-primary);
      background: var(--accent-glow);
      color: var(--accent-primary);
    }
    .lang-text {
      line-height: 1;
    }
    .sla-alert-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: var(--sla-at-risk-bg);
      border: 1px solid var(--sla-at-risk-border);
      border-radius: var(--radius-full);
      font-size: 0.725rem;
      font-weight: 600;
      color: var(--sla-at-risk);
      cursor: pointer;
      text-decoration: none;
    }
    .alert-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sla-at-risk);
      box-shadow: 0 0 6px var(--sla-at-risk);
    }
    .icon-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .icon-btn:hover {
      background: var(--border-subtle);
      border-color: var(--border-strong);
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px 4px 6px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      box-shadow: var(--shadow-sm);
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
      font-size: 0.775rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      padding: 0 4px;
      text-align: start;
    }
    .user-name {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
    }
    .user-role {
      font-size: 0.65rem;
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .logout-btn {
      border: none;
      background: transparent;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      flex-shrink: 0;
    }
    .logout-btn:hover {
      color: var(--sla-breached);
      background: var(--sla-breached-bg);
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  wsService = inject(WebSocketService);
  i18n = inject(I18nService);

  constructor() {
    this.wsService.connect();
  }

  formatUserRole(role: string | undefined): string {
    return this.i18n.formatRole(role);
  }

  getUserRoleDisplay(user: any): string {
    if (!user) return '';
    if (this.i18n.isArabic()) {
      return this.formatUserRole(user.roles?.[0]);
    }
    return user.jobTitle || this.formatUserRole(user.roles?.[0]);
  }
}
