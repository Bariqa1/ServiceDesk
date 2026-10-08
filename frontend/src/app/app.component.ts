import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    @if (auth.isLoggedIn()) {
      <div class="app-layout">
        <app-navbar />
        <div class="app-body">
          <app-sidebar />
          <main class="main-content">
            <router-outlet />
          </main>
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .app-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .main-content {
      flex: 1;
      padding: 1.5rem 2rem;
      overflow-y: auto;
      background: var(--bg-primary);
    }
  `]
})
export class AppComponent {
  public auth = inject(AuthService);
  public theme = inject(ThemeService);
}
