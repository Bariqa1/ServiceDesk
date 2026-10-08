import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper animate-fade-in">
      <div class="login-card glass-panel">
        <div class="login-header">
          <div class="logo-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h1 class="login-title">ServiceDesk Enterprise</h1>
          <p class="login-subtitle">نظام إدارة طلبات وتذاكر الدعم الفني ومحرك اتفاقيات مستوى الخدمة (SLA)</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger animate-fade-in">
            {{ errorMessage() }}
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
              <span>جاري التحقق...</span>
            } @else {
              <span>تسجيل الدخول</span>
            }
          </button>
        </form>

        <!-- Quick Demo Accounts -->
        <div class="demo-section">
          <div class="demo-divider">
            <span>حسابات تجريبية سريعة</span>
          </div>

          <div class="demo-grid">
            <button class="demo-btn" (click)="quickLogin('manager', 'Manager@2026')">
              <span class="demo-role">مدير الخدمة</span>
              <span class="demo-user">manager</span>
            </button>
            <button class="demo-btn" (click)="quickLogin('lead', 'Lead@2026')">
              <span class="demo-role">مشرف الفريق</span>
              <span class="demo-user">lead</span>
            </button>
            <button class="demo-btn" (click)="quickLogin('agent', 'Agent@2026')">
              <span class="demo-role">مهندس الدعم</span>
              <span class="demo-user">agent</span>
            </button>
            <button class="demo-btn" (click)="quickLogin('employee', 'Emp@2026')">
              <span class="demo-role">موظف (طالب الخدمة)</span>
              <span class="demo-user">employee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 120px);
      padding: 24px;
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 36px 32px;
      border-radius: var(--radius-lg);
    }
    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo-circle {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      border-radius: var(--radius-md);
      background: var(--accent-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--accent-glow);
    }
    .login-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .login-subtitle {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .btn-block {
      width: 100%;
      padding: 11px;
      margin-top: 8px;
    }
    .alert {
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      margin-bottom: 16px;
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
      font-size: 0.725rem;
      color: var(--text-tertiary);
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
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: inherit;
    }
    .demo-btn:hover {
      border-color: var(--accent-primary);
      background: var(--accent-glow);
    }
    .demo-role {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .demo-user {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
      font-family: monospace;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

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
