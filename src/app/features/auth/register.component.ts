import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthApi } from '../../api/auth.api';
import { CustomersApi } from '../../api/customers.service';
import { DealersApi } from '../../api/dealers.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthResponse, RegisterRequest } from '../../shared/models/auth.model';
import { Customer } from '../../shared/models/customer.model';
import { Observable, catchError, finalize, map, of, switchMap, throwError } from 'rxjs';
import { TopNavComponent } from '../layout/top-nav/top-nav.component';

type ProfileSetupResult = 'DEALER' | 'CUSTOMER' | 'PROFILE_FAILED' | 'USER_ONLY';

interface PendingProfileSetup {
  token: string;
  emailId: string;
  userType: RegisterRequest['userType'];
  fullName: string;
  mobileNo: string;
  address: string;
}

const PENDING_PROFILE_KEY = 'pending_profile_setup_v1';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, TopNavComponent],
  template: `
    <app-top-nav [publicMode]="true"></app-top-nav>
    <section class="auth-page">
      <div class="auth-card">
        <div class="brand-head">
          <span class="brand-pill">MotoMint</span>
          <h2>Create Account</h2>
          <p class="subtitle">Join the two-wheeler marketplace in a minute.</p>
        </div>

        <form (ngSubmit)="submit()" #f="ngForm">
          <label>Role</label>
          <div class="role-grid" aria-label="Select role">
            <button type="button" class="role-btn" [class.active]="model.userType === 'CUSTOMER'" (click)="model.userType = 'CUSTOMER'">
              Customer
            </button>
            <button type="button" class="role-btn" [class.active]="model.userType === 'DEALER'" (click)="model.userType = 'DEALER'">
              Dealer
            </button>
          </div>

          <label>Full Name</label>
          <input [(ngModel)]="model.fullName" name="fullName" #fullNameCtrl="ngModel" required minlength="3" />
          <small class="field-error" *ngIf="fullNameCtrl.invalid && (fullNameCtrl.touched || f.submitted)">
            Full name must be at least 3 characters.
          </small>

          <label>Email</label>
          <input [(ngModel)]="model.emailId" name="emailId" #emailCtrl="ngModel" type="email" required />
          <small class="field-error" *ngIf="emailCtrl.invalid && (emailCtrl.touched || f.submitted)">
            Enter a valid email address.
          </small>

          <label>Mobile</label>
          <input [(ngModel)]="model.mobileNo" name="mobileNo" #mobileCtrl="ngModel" required pattern="^[0-9]{10}$" />
          <small class="field-error" *ngIf="mobileCtrl.invalid && (mobileCtrl.touched || f.submitted)">
            Enter a valid 10-digit mobile number.
          </small>

          <label>Address</label>
          <textarea [(ngModel)]="model.address" name="address" #addressCtrl="ngModel" rows="3" required minlength="5"></textarea>
          <small class="field-error" *ngIf="addressCtrl.invalid && (addressCtrl.touched || f.submitted)">
            Address must be at least 5 characters.
          </small>

          <label>Password</label>
          <input
            [(ngModel)]="model.password"
            name="password"
            #passwordCtrl="ngModel"
            type="password"
            [required]="!isPendingRetryForCurrentForm()"
            minlength="6"
          />
          <small class="field-error" *ngIf="passwordCtrl.invalid && (passwordCtrl.touched || f.submitted)">
            Password must be at least 6 characters.
          </small>

          <div class="auth-actions">
            <button type="submit" [disabled]="f.invalid || loading">
              {{
                loading
                  ? (isPendingRetryForCurrentForm() ? 'Retrying Profile...' : 'Creating...')
                  : (isPendingRetryForCurrentForm() ? 'Retry Profile Setup' : 'Create Account')
              }}
            </button>
            <button type="button" class="ghost-btn btn-ghost" (click)="goLogin()">Back to Login</button>
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
      width: min(100%, 540px);
      background: var(--mm-surface);
      border: 1px solid var(--mm-border);
      border-radius: 18px;
      padding: 1.25rem;
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
      margin: 0.2rem 0 0.35rem;
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
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .auth-actions {
      display: flex;
      gap: 0.52rem;
      margin-top: 0.4rem;
    }

    .field-error {
      color: var(--mm-danger);
      font-size: 0.8rem;
      margin-top: -0.2rem;
    }

    @media (max-width: 560px) {
      .auth-card {
        padding: 1rem;
      }

      .auth-actions {
        flex-direction: column;
      }
    }
  `]
})
export class RegisterComponent {
  model: RegisterRequest = {
    fullName: '',
    emailId: '',
    mobileNo: '',
    address: '',
    userType: 'CUSTOMER',
    password: ''
  };
  loading = false;
  private pendingProfile: PendingProfileSetup | null = null;

  constructor(
    private api: AuthApi,
    private customersApi: CustomersApi,
    private dealersApi: DealersApi,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    const role = this.route.snapshot.queryParamMap.get('role');
    if (role === 'CUSTOMER' || role === 'DEALER') {
      this.model.userType = role;
    }

    const restoredPending = this.readPendingProfile();
    if (restoredPending) {
      this.pendingProfile = restoredPending;
      this.model = {
        ...this.model,
        fullName: restoredPending.fullName,
        emailId: restoredPending.emailId,
        mobileNo: restoredPending.mobileNo,
        address: restoredPending.address,
        userType: restoredPending.userType,
        password: ''
      };
    }
  }

  submit() {
    const normalizedModel: RegisterRequest = {
      ...this.model,
      fullName: this.model.fullName.trim(),
      emailId: this.model.emailId.trim().toLowerCase(),
      mobileNo: this.model.mobileNo.trim(),
      address: this.model.address.trim(),
      password: this.model.password.trim(),
    };

    this.model = normalizedModel;
    if (this.hasPendingProfileForModel(normalizedModel) && this.pendingProfile) {
      const retryContext = this.pendingProfile;
      this.loading = true;
      this.createDomainProfileIfNeeded(retryContext).pipe(
        finalize(() => {
          this.loading = false;
        })
      ).subscribe({
        next: (profileType) => this.handleProfileSetupResult(profileType, retryContext),
        error: (err: HttpErrorResponse) => {
          this.toast.error(this.getFriendlyRegisterError(err));
        }
      });
      return;
    }

    this.loading = true;
    this.api.register(normalizedModel).pipe(
      map((registerRes) => this.toPendingProfile(normalizedModel, registerRes.token)),
      catchError((err: HttpErrorResponse) => {
        if (!this.isDuplicateConflict(err) || !this.canHaveDomainProfile(normalizedModel.userType)) {
          return throwError(() => err);
        }

        // Existing user: recover by login and retry only profile setup.
        return this.api.login({ emailId: normalizedModel.emailId, password: normalizedModel.password }).pipe(
          switchMap((loginRes) => {
            const expectedRole = `ROLE_${normalizedModel.userType}` as AuthResponse['role'];
            if (loginRes.role !== expectedRole) {
              return throwError(() => err);
            }
            return of(this.toPendingProfile(normalizedModel, loginRes.token));
          }),
          catchError(() => throwError(() => err))
        );
      }),
      switchMap((pending) => this.createDomainProfileIfNeeded(pending).pipe(
        map((profileType) => ({ profileType, pending }))
      )),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: ({ profileType, pending }) => {
        this.handleProfileSetupResult(profileType, pending);
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(this.getFriendlyRegisterError(err));
        this.model.password = '';
      }
    });
  }

  goLogin() {
    this.router.navigateByUrl('/login');
  }

  isPendingRetryForCurrentForm(): boolean {
    const normalizedEmail = this.model.emailId.trim().toLowerCase();
    return !!this.pendingProfile
      && normalizedEmail.length > 0
      && this.pendingProfile.emailId === normalizedEmail
      && this.pendingProfile.userType === this.model.userType;
  }

  private hasPendingProfileForModel(model: RegisterRequest): boolean {
    return !!this.pendingProfile
      && this.pendingProfile.emailId === model.emailId
      && this.pendingProfile.userType === model.userType;
  }

  private toPendingProfile(model: RegisterRequest, token: string): PendingProfileSetup {
    return {
      token,
      emailId: model.emailId,
      userType: model.userType,
      fullName: model.fullName,
      mobileNo: model.mobileNo,
      address: model.address
    };
  }

  private canHaveDomainProfile(userType: RegisterRequest['userType']): boolean {
    return userType === 'CUSTOMER' || userType === 'DEALER';
  }

  private handleProfileSetupResult(profileType: ProfileSetupResult, pending: PendingProfileSetup) {
    if (profileType === 'PROFILE_FAILED') {
      this.savePendingProfile(pending);
      this.toast.error('Account created, but profile setup failed. Retry will call profile setup only.');
      return;
    }

    this.clearPendingProfile();
    if (profileType === 'DEALER') {
      this.toast.success('Registration successful. User and dealer profile created.');
    } else if (profileType === 'CUSTOMER') {
      this.toast.success('Registration successful. User and customer profile created.');
    } else {
      this.toast.success('Registration successful. Please login with your new account.');
    }
    this.router.navigateByUrl('/login');
  }

  private getFriendlyRegisterError(err: HttpErrorResponse): string {
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
    if (this.isDuplicateConflict(err) || err.status === 409) {
      return 'Email already registered. Please login.';
    }
    if (err.status === 400) {
      return backendText || 'Please check your input and try again.';
    }

    return backendText || 'Unable to create account right now. Please try again.';
  }

  private createDomainProfileIfNeeded(pending: PendingProfileSetup): Observable<ProfileSetupResult> {
    if (pending.userType === 'DEALER') {
      const primaryName = pending.fullName;
      const fallbackName = this.buildDealerFallbackName(pending.fullName, pending.emailId);
      const createDealer = (dealerName: string) => this.dealersApi.add({
        dealerName,
        email: pending.emailId,
        contactNumber: pending.mobileNo,
        address: pending.address
      }, pending.token).pipe(
        switchMap(() => of<ProfileSetupResult>('DEALER'))
      );

      return createDealer(primaryName).pipe(
        catchError((err: HttpErrorResponse) => {
          if (this.isDuplicateConflict(err) && fallbackName.toLowerCase() !== primaryName.toLowerCase()) {
            return createDealer(fallbackName).pipe(
              catchError((retryErr: HttpErrorResponse) => this.resolveDealerConflictByEmailOrFail(retryErr, pending.token, pending.emailId))
            );
          }

          return this.resolveDealerConflictByEmailOrFail(err, pending.token, pending.emailId);
        })
      );
    }

    if (pending.userType === 'CUSTOMER') {
      const customerPayload: Customer = this.buildCustomerPayload(pending);

      return this.customersApi.add(customerPayload, pending.token).pipe(
        switchMap(() => of<'CUSTOMER'>('CUSTOMER')),
        catchError((err: HttpErrorResponse) => this.resolveCustomerCreationByEmailOrFail(err, pending.token, pending.emailId))
      );
    }

    return of<ProfileSetupResult>('USER_ONLY');
  }

  private isDuplicateConflict(err: HttpErrorResponse): boolean {
    const conflictMessage = (err.error?.message || '').toString().toLowerCase();
    const looksLikeDuplicate = conflictMessage.includes('already exists')
      || conflictMessage.includes('already registered')
      || conflictMessage.includes('duplicate');
    return [400, 409].includes(err.status) && looksLikeDuplicate;
  }

  private resolveDealerConflictByEmailOrFail(err: HttpErrorResponse, token: string, emailId: string): Observable<ProfileSetupResult> {
    const shouldCheckByEmail = this.isDuplicateConflict(err) || [500, 502, 503, 504].includes(err.status);
    if (!shouldCheckByEmail) {
      return of<ProfileSetupResult>('PROFILE_FAILED');
    }

    return this.dealersApi.list(token).pipe(
      map((rows) => rows.some((d) => d.email?.toLowerCase() === emailId.toLowerCase())),
      map((existsByEmail) => {
        if (existsByEmail) {
          return 'DEALER' as ProfileSetupResult;
        }
        return 'PROFILE_FAILED' as ProfileSetupResult;
      }),
      catchError(() => {
        return of<ProfileSetupResult>('PROFILE_FAILED');
      })
    );
  }

  private resolveCustomerCreationByEmailOrFail(err: HttpErrorResponse, token: string, emailId: string): Observable<ProfileSetupResult> {
    const shouldCheckByEmail = this.isDuplicateConflict(err) || [500, 502, 503, 504].includes(err.status);
    if (!shouldCheckByEmail) {
      return of<ProfileSetupResult>('PROFILE_FAILED');
    }

    return this.customersApi.list(token).pipe(
      map((rows) => rows.some((c) => c.email?.toLowerCase() === emailId.toLowerCase())),
      map((existsByEmail) => {
        if (existsByEmail) {
          return 'CUSTOMER' as ProfileSetupResult;
        }
        return 'PROFILE_FAILED' as ProfileSetupResult;
      }),
      catchError(() => {
        return of<ProfileSetupResult>('PROFILE_FAILED');
      })
    );
  }

  private buildDealerFallbackName(fullName: string, emailId: string): string {
    const handle = emailId
      .split('@')[0]
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 10);
    return handle ? `${fullName} (${handle})` : fullName;
  }

  private buildCustomerPayload(pending: PendingProfileSetup): Customer {
    return {
      customerName: pending.fullName,
      address: pending.address,
      email: pending.emailId,
      contactNumber: pending.mobileNo
    };
  }

  private savePendingProfile(pending: PendingProfileSetup) {
    this.pendingProfile = pending;
    localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(pending));
  }

  private clearPendingProfile() {
    this.pendingProfile = null;
    localStorage.removeItem(PENDING_PROFILE_KEY);
  }

  private readPendingProfile(): PendingProfileSetup | null {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as PendingProfileSetup;
      const isValid = typeof parsed.token === 'string'
        && typeof parsed.emailId === 'string'
        && typeof parsed.fullName === 'string'
        && typeof parsed.mobileNo === 'string'
        && typeof parsed.address === 'string'
        && (parsed.userType === 'CUSTOMER' || parsed.userType === 'DEALER');
      if (!isValid) {
        localStorage.removeItem(PENDING_PROFILE_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(PENDING_PROFILE_KEY);
      return null;
    }
  }

  private extractBackendMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string') return err.error;
    return (err.error?.message || err.message || '').toString();
  }
}
