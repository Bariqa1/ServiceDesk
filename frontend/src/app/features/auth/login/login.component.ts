import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <!-- Ambient Glow Orbs -->
      <div class="ambient-glow glow-1"></div>
      <div class="ambient-glow glow-2"></div>

      <!-- Top Utility Bar (Theme Switcher) -->
      <div class="top-bar">
        <div class="app-chip">
          <span class="chip-status"></span>
          <span>Core Enterprise Architecture</span>
        </div>
        <button class="theme-toggle-btn" (click)="themeService.toggleTheme()" [title]="themeService.isDarkMode() ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'">
          @if (themeService.isDarkMode()) {
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            <span>فاتح</span>
          } @else {
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            <span>داكن</span>
          }
        </button>
      </div>

      <!-- Main Login Container -->
      <div class="login-card glass-panel animate-fade-in">
        <div class="login-header">
          <div class="logo-circle">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h1 class="login-title">ServiceDesk Enterprise</h1>
          <p class="login-subtitle">نظام إدارة طلبات وتذاكر الدعم الفني ومحرك اتفاقيات الـ SLA التلقائي</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger animate-fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label" for="username">اسم المستخدم</label>
            <input
              id="username"
              type="text"
              class="form-input"
              [(ngModel)]="username"
              name="username"
              placeholder="e.g. manager, lead, agent, employee"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">كلمة المرور</label>
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
              <span>جاري التحقق والربط...</span>
            } @else {
              <span>تسجيل الدخول للنظام</span>
            }
          </button>
        </form>

        <!-- 1-Click Fast Demo Logins -->
        <div class="demo-section">
          <div class="demo-divider">
            <span>تسجيل دخول تجريبي فوري (نقرة واحدة)</span>
          </div>

          <div class="demo-grid">
            <button type="button" class="demo-btn manager-btn" (click)="quickLogin('manager', 'Manager@2026')">
              <div class="demo-meta">
                <span class="demo-role">مدير الخدمة</span>
                <span class="demo-user">manager</span>
              </div>
              <span class="demo-badge">كامل الصلاحيات</span>
            </button>

            <button type="button" class="demo-btn lead-btn" (click)="quickLogin('lead', 'Lead@2026')">
              <div class="demo-meta">
                <span class="demo-role">رئيس الفريق</span>
                <span class="demo-user">lead</span>
              </div>
              <span class="demo-badge">إدارة وتوزيع</span>
            </button>

            <button type="button" class="demo-btn agent-btn" (click)="quickLogin('agent', 'Agent@2026')">
              <div class="demo-meta">
                <span class="demo-role">فني الدعم</span>
                <span class="demo-user">agent</span>
              </div>
              <span class="demo-badge">معالجة وتحديث</span>
            </button>

            <button type="button" class="demo-btn emp-btn" (click)="quickLogin('employee', 'Emp@2026')">
              <div class="demo-meta">
                <span class="demo-role">الموظف</span>
                <span class="demo-user">employee</span>
              </div>
              <span class="demo-badge">طالب الخدمة</span>
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
      filter: blur(120px);
      pointer-events: none;
      z-index: 0;
      opacity: 0.18;
    }
    .glow-1 {
      width: 480px;
      height: 480px;
      background: #0071E3;
      top: -100px;
      right: -100px;
    }
    .glow-2 {
      width: 420px;
      height: 420px;
      background: #AF52DE;
      bottom: -80px;
      left: -80px;
    }

    .top-bar {
      position: absolute;
      top: 24px;
      left: 32px;
      right: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }

    .app-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      box-shadow: var(--shadow-sm);
    }
    .chip-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--sla-within);
      box-shadow: 0 0 8px var(--sla-within);
    }

    .theme-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-fast);
      font-family: inherit;
    }
    .theme-toggle-btn:hover {
      border-color: var(--accent-primary);
      background: var(--accent-glow);
    }

    .login-card {
      width: 100%;
      max-width: 460px;
      padding: 40px 36px;
      border-radius: var(--radius-lg);
      position: relative;
      z-index: 1;
      backdrop-filter: blur(20px);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-strong);
      background: var(--bg-card);
    }

    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .logo-circle {
      width: 54px;
      height: 54px;
      margin: 0 auto 16px;
      border-radius: var(--radius-md);
      background: var(--accent-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px var(--accent-glow);
    }

    .login-title {
      font-size: 1.45rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .login-subtitle {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .form-input {
      width: 100%;
      padding: 10px 14px;
      background: var(--bg-input);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.875rem;
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
      padding: 12px;
      margin-top: 8px;
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      margin-bottom: 18px;
    }
    .alert-danger {
      background: var(--sla-breached-bg);
      border: 1px solid var(--sla-breached-border);
      color: var(--sla-breached);
    }

    .demo-section {
      margin-top: 28px;
    }

    .demo-divider {
      text-align: center;
      position: relative;
      margin-bottom: 16px;
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
      padding: 0 12px;
      font-size: 0.725rem;
      color: var(--text-tertiary);
      font-weight: 500;
    }

    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .demo-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: inherit;
      text-align: right;
    }
    .demo-btn:hover {
      border-color: var(--accent-primary);
      background: var(--accent-glow);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .demo-meta {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .demo-role {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .demo-user {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
      font-family: 'JetBrains Mono', monospace;
    }
    .demo-badge {
      font-size: 0.65rem;
      font-weight: 500;
      color: var(--accent-primary);
      background: var(--accent-glow);
      padding: 2px 6px;
      border-radius: var(--radius-full);
      align-self: flex-start;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);

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
        this.errorMessage.set(err.error?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    });
  }

  quickLogin(u: string, p: string): void {
    this.username = u;
    this.password = p;
    this.onSubmit();
  }
}
