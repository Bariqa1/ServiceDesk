import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, RoleType, UserSummary } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'servicedesk_token';
  private readonly USER_KEY = 'servicedesk_user';

  currentUser = signal<UserSummary | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  isManager = computed(() => this.hasRole('ROLE_SERVICE_MANAGER'));
  isTeamLead = computed(() => this.hasRole('ROLE_TEAM_LEAD'));
  isAgent = computed(() => this.hasRole('ROLE_AGENT'));
  isEmployee = computed(() => this.hasRole('ROLE_EMPLOYEE'));

  constructor() {
    this.restoreSession();
  }

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/v1/auth/login', credentials).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasRole(role: RoleType): boolean {
    const user = this.currentUser();
    return user ? user.roles.includes(role) : false;
  }

  private restoreSession(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem(this.USER_KEY);
    if (token && userStr) {
      try {
        const user: UserSummary = JSON.parse(userStr);
        this.currentUser.set(user);
      } catch {
        this.logout();
      }
    }
  }
}
