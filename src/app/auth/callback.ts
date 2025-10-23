import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-callback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #000;">
      <div style="width: 48px; height: 48px; border: 4px solid #333; border-top-color: #4da6ff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
  `,
  styles: [`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CallbackComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.auth.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) this.router.navigate(['/']);
    });
  }
}