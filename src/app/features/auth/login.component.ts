import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApi } from '../../api/auth.api';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TopNavComponent } from '../layout/top-nav/top-nav.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent],
  template: `
    <app-top-nav [publicMode]="true"></app-top-nav>
    <section class="auth-page">
      <div class="auth-card">
        <div class="brand-head">
          <span class="brand-pill">MotoMint</span>
          <h2>Sign In</h2>
          <p class="subtitle">Continue to your marketplace dashboard.</p>
        </div>

        <div class="role-grid" aria-label="Select role">
          <button type="button" class="role-btn" [class.active]="selectedRole === 'ROLE_CUSTOMER'" (click)="selectedRole = 'ROLE_CUSTOMER'">
            Customer
          </button>
          <button type="button" class="role-btn" [class.active]="selectedRole === 'ROLE_DEALER'" (click)="selectedRole = 'ROLE_DEALER'">
            Dealer
          </button>
        </div>

        <form (ngSubmit)="doLogin()" #f="ngForm">
          <label>Email</label>
          <input [(ngModel)]="emailId" name="emailId" #emailCtrl="ngModel" type="email" required />
          <small class="field-error" *ngIf="emailCtrl.invalid && (emailCtrl.touched || f.submitted)">
            Enter a valid email address.
          </small>

          <label>Password</label>
          <input [(ngModel)]="password" name="password" #passwordCtrl="ngModel" type="password" required minlength="6" />
          <small class="field-error" *ngIf="passwordCtrl.invalid && (passwordCtrl.touched || f.submitted)">
            Password must be at least 6 characters.
          </small>

          <div class="auth-actions">
            <button type="submit" [disabled]="f.invalid || loading || !selectedRole">
              {{ loading ? 'Signing In...' : 'Login' }}
            </button>
            <button type="button" class="ghost-btn btn-ghost" (click)="goRegister()">Sign Up</button>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 70px);
      display: grid;
      place-items: center;
      padding: 1rem 0.8rem;
      background:
        radial-gradient(60rem 30rem at 10% -10%, var(--mm-bg-radial-a) 0%, transparent 58%),
        radial-gradient(60rem 30rem at 100% 100%, var(--mm-bg-radial-b) 0%, transparent 45%);
    }

    .auth-card {
      width: min(100%, 500px);
      background: var(--mm-surface);
      border: 1px solid var(--mm-border);
      border-radius: 18px;
      padding: 1.3rem;
      box-shadow: var(--mm-shadow-md);
    }

    .brand-head {
      margin-bottom: 0.8rem;
    }

    .brand-pill {
      display: inline-block;
      border-radius: 999px;
      background: var(--mm-surface-soft);
      border: 1px solid var(--mm-border);
      color: var(--mm-text);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      margin-bottom: 0.55rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: var(--mm-text-muted);
    }

    .role-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.45rem;
      margin: 1rem 0 1.1rem;
      background: var(--mm-surface-soft);
      border: 1px solid var(--mm-border);
      border-radius: 12px;
      padding: 0.3rem;
    }

    .role-btn {
      background: transparent;
      color: var(--mm-text);
      border-color: transparent;
      border-radius: 9px;
      font-size: 0.83rem;
      font-weight: 700;
      padding: 0.48rem 0.55rem;
    }

    .role-btn.active {
      background: var(--mm-primary-600);
      color: #fff;
      box-shadow: 0 6px 16px rgba(35, 75, 142, 0.25);
    }

    form {
      display: grid;
      gap: 0.52rem;
    }

    .auth-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.45rem;
    }

    .field-error {
      color: var(--mm-danger);
      font-size: 0.8rem;
      margin-top: -0.25rem;
    }

    @media (max-width: 520px) {
      .auth-card {
        padding: 1rem;
      }

      .role-grid {
        grid-template-columns: 1fr;
      }

      .auth-actions {
        flex-direction: column;
      }
    }
  `]
})
export class LoginComponent {
  emailId = '';
  password = '';
  selectedRole: 'ROLE_CUSTOMER' | 'ROLE_DEALER' | null = 'ROLE_CUSTOMER';
  loading = false;

  constructor(
    private api: AuthApi,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  doLogin() {
    if (!this.selectedRole) {
      this.toast.error('Please select a role to continue.');
      return;
    }

    const normalizedEmail = this.emailId.trim().toLowerCase();
    const rawPassword = this.password;

    if (!normalizedEmail || rawPassword.length === 0) {
      this.toast.error('Email and password are required.');
      this.password = '';
      return;
    }

    this.loading = true;
    this.api
      .login({ emailId: normalizedEmail, password: rawPassword })
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (res) => {
          if (res.role !== this.selectedRole) {
            this.auth.logout();
            this.toast.error(`Role mismatch. This account is ${res.role.replace('ROLE_', '')}.`);
            this.password = '';
            return;
          }

          this.auth.saveLogin(res);
          this.toast.success(res.message || 'Login successful');

          this.router.navigateByUrl(this.auth.getHomeRoute(res.role));
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(this.getFriendlyAuthError(err));
          this.password = '';
        }
      });
  }

  goRegister() {
    const role = this.selectedRole?.replace('ROLE_', '') || 'CUSTOMER';
    this.router.navigateByUrl(`/register?role=${role}`);
  }

  private getFriendlyAuthError(err: HttpErrorResponse): string {
    const backendText = this.extractBackendMessage(err);
    const rawMessage = backendText.toLowerCase();

    if (err.status === 0) return 'Server unreachable. Check if gateway is running.';
    if (rawMessage.includes('inactive') || rawMessage.includes('disabled')) {
      return 'Your account is inactive. Contact support.';
    }
    if (rawMessage.includes('user not found') || err.status === 404) {
      return 'Account not found. Please sign up.';
    }
    if (rawMessage.includes('bad credentials') || rawMessage.includes('invalid credentials') || err.status === 401) {
      return 'Incorrect password. Please try again.';
    }
    if (err.status === 409 || rawMessage.includes('already registered') || rawMessage.includes('duplicate')) {
      return 'Email already registered. Please login.';
    }

    return backendText || 'Unable to sign in right now. Please try again.';
  }

  private extractBackendMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string') return err.error;
    return (err.error?.message || err.message || '').toString();
  }
}
