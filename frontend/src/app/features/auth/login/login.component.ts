import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <!-- Ambient Glow Orbs -->
      <div class="ambient-glow glow-1"></div>
      <div class="ambient-glow glow-2"></div>

      <!-- Top Utility Bar (Language & Theme Switcher) -->
      <div class="top-bar">
        <div class="brand-chip">
          <div class="logo-chip-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>ServiceDesk</span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Language Toggle Button -->
          <button 
            class="top-toggle-btn" 
            (click)="i18n.toggleLanguage()" 
            [title]="i18n.isArabic() ? 'Switch to English' : 'التحويل إلى العربية'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>{{ i18n.isArabic() ? 'English' : 'عربي' }}</span>
          </button>

          <!-- Theme Toggle Button -->
          <button 
            class="top-toggle-btn" 
            (click)="themeService.toggleTheme()" 
            [title]="themeService.isDarkMode() ? i18n.t('nav.themeLight') : i18n.t('nav.themeDark')"
          >
            @if (themeService.isDarkMode()) {
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            }
          </button>
        </div>
      </div>

      <!-- Main Login Container (Apple Minimalist Frosted Card) -->
      <div class="login-card glass-panel animate-fade-in">
        <div class="login-header">
          <div class="logo-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 class="login-title">{{ i18n.t('login.title') }}</h1>
          <p class="login-subtitle">{{ i18n.t('login.subtitle') }}</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger animate-fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label" for="username">{{ i18n.t('login.username') }}</label>
            <input
              id="username"
              type="text"
              class="form-input"
              [(ngModel)]="username"
              name="username"
              [placeholder]="i18n.t('login.usernamePlaceholder')"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">{{ i18n.t('login.password') }}</label>
            <input
              id="password"
              type="password"
              class="form-input"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading()">
            @if (isLoading()) {
              <span>{{ i18n.t('login.submitting') }}</span>
            } @else {
              <span>{{ i18n.t('login.submit') }}</span>
            }
          </button>
        </form>

        <!-- 1-Click Fast Demo Logins -->
        <div class="demo-section">
          <div class="demo-divider">
            <span>{{ i18n.t('login.demoSection') }}</span>
          </div>

          <div class="demo-grid">
            <button type="button" class="demo-btn" (click)="quickLogin('manager', 'Manager@2026')">
              <div class="demo-meta">
                <span class="demo-role">{{ i18n.t('login.roleManager') }}</span>
                <span class="demo-user">manager</span>
              </div>
              <span class="demo-badge">{{ i18n.t('login.roleManagerBadge') }}</span>
            </button>

            <button type="button" class="demo-btn" (click)="quickLogin('lead', 'Lead@2026')">
              <div class="demo-meta">
                <span class="demo-role">{{ i18n.t('login.roleLead') }}</span>
                <span class="demo-user">lead</span>
              </div>
              <span class="demo-badge">{{ i18n.t('login.roleLeadBadge') }}</span>
            </button>

            <button type="button" class="demo-btn" (click)="quickLogin('agent', 'Agent@2026')">
              <div class="demo-meta">
                <span class="demo-role">{{ i18n.t('login.roleAgent') }}</span>
                <span class="demo-user">agent</span>
              </div>
              <span class="demo-badge">{{ i18n.t('login.roleAgentBadge') }}</span>
            </button>

            <button type="button" class="demo-btn" (click)="quickLogin('employee', 'Emp@2026')">
              <div class="demo-meta">
                <span class="demo-role">{{ i18n.t('login.roleEmployee') }}</span>
                <span class="demo-user">employee</span>
              </div>
              <span class="demo-badge">{{ i18n.t('login.roleEmployeeBadge') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
      background-color: var(--bg-primary);
    }

    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(140px);
      pointer-events: none;
      z-index: 0;
      opacity: 0.15;
    }
    .glow-1 {
      width: 440px;
      height: 440px;
      background: #0071E3;
      top: -80px;
      right: -80px;
    }
    .glow-2 {
      width: 380px;
      height: 380px;
      background: #AF52DE;
      bottom: -60px;
      left: -60px;
    }

    .top-bar {
      position: absolute;
      top: 20px;
      left: 28px;
      right: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }

    .brand-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
    }
    .logo-chip-icon {
      width: 20px;
      height: 20px;
      border-radius: 5px;
      background: var(--accent-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .top-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 0.775rem;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-fast);
      font-family: inherit;
    }
    .top-toggle-btn:hover {
      border-color: var(--accent-primary);
      background: var(--accent-glow);
      color: var(--accent-primary);
    }

    .login-card {
      width: 100%;
      max-width: 430px;
      padding: 34px 30px;
      border-radius: var(--radius-lg);
      position: relative;
      z-index: 1;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-subtle);
      background: var(--bg-card);
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .logo-circle {
      width: 48px;
      height: 48px;
      margin: 0 auto 12px;
      border-radius: 12px;
      background: var(--accent-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px var(--accent-glow);
    }

    .login-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .login-subtitle {
      font-size: 0.775rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .form-input {
      width: 100%;
      padding: 9px 12px;
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.8125rem;
      font-family: inherit;
      transition: all var(--transition-fast);
    }
    .form-input:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .btn-block {
      width: 100%;
      padding: 10px;
      margin-top: 4px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.775rem;
      margin-bottom: 16px;
    }
    .alert-danger {
      background: var(--sla-breached-bg);
      border: 1px solid var(--sla-breached-border);
      color: var(--sla-breached);
    }

    .demo-section {
      margin-top: 24px;
    }

    .demo-divider {
      text-align: center;
      position: relative;
      margin-bottom: 14px;
    }
    .demo-divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border-subtle);
    }
    .demo-divider span {
      position: relative;
      background: var(--bg-card);
      padding: 0 10px;
      font-size: 0.7rem;
      color: var(--text-tertiary);
      font-weight: 500;
    }

    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .demo-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: inherit;
      text-align: start;
    }
    .demo-btn:hover {
      border-color: var(--accent-primary);
      background: var(--accent-glow);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .demo-meta {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .demo-role {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .demo-user {
      font-size: 0.65rem;
      color: var(--text-tertiary);
      font-family: 'JetBrains Mono', monospace;
    }
    .demo-badge {
      font-size: 0.625rem;
      font-weight: 500;
      color: var(--accent-primary);
      background: var(--accent-glow);
      padding: 1px 5px;
      border-radius: var(--radius-full);
      align-self: flex-start;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);
  public i18n = inject(I18nService);

  username = '';
  password = '';
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || (this.i18n.isArabic() ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password'));
      }
    });
  }

  quickLogin(u: string, p: string): void {
    this.username = u;
    this.password = p;
    this.onSubmit();
  }
}
