import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const SKIP_GLOBAL_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (req.context.get(SKIP_GLOBAL_ERROR_HANDLING)) {
        return throwError(() => err);
      }

      const url = req.url.toLowerCase();
      const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');
      const rawMessage = extractBackendMessage(err);
      const normalized = rawMessage.toLowerCase();

      // Auth pages map errors to user-friendly messages in their own components.
      if (isAuthRequest) {
        return throwError(() => err);
      }

      if (err.status === 0) {
        toast.error('Server unreachable. Check if gateway is running.');
      } else if (normalized.includes('inactive') || normalized.includes('disabled')) {
        toast.error('Your account is inactive. Contact support.');
      } else if (normalized.includes('user not found')) {
        toast.error('Account not found. Please sign up.');
      } else if (normalized.includes('bad credentials') || normalized.includes('invalid credentials')) {
        toast.error('Incorrect password. Please try again.');
      } else if (err.status === 409 || normalized.includes('already registered') || normalized.includes('duplicate')) {
        toast.error('Email already registered. Please login.');
      } else if (err.status === 401) {
        toast.error('Unauthorized. Please login and try again.');
        router.navigateByUrl('/login');
      } else if (err.status === 403) {
        toast.error(rawMessage || 'Forbidden. You do not have permission for this action.');
        router.navigateByUrl('/forbidden');
      } else if (err.status === 400) {
        toast.error(rawMessage || 'Invalid request. Please check your input and try again.');
      } else if (err.status === 404) {
        toast.error(rawMessage || 'Requested resource was not found.');
      } else {
        toast.error(rawMessage || 'Something went wrong. Please try again.');
      }
      return throwError(() => err);
    })
  );
};

function extractBackendMessage(err: HttpErrorResponse): string {
  if (typeof err.error === 'string') return err.error;
  return (err.error?.message || err.message || '').toString();
}
