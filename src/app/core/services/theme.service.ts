import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'mm_theme_mode_v1';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isDarkSubject = new BehaviorSubject<boolean>(false);
  readonly isDark$ = this.isDarkSubject.asObservable();

  constructor() {
    this.applySavedTheme();
  }

  isDark(): boolean {
    return this.isDarkSubject.value;
  }

  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode): void {
    this.persistMode(mode);
    this.applyMode(mode);
  }

  private applySavedTheme(): void {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const mode: ThemeMode = saved === 'dark' ? 'dark' : 'light';
    this.applyMode(mode);
  }

  private applyMode(mode: ThemeMode): void {
    const isDark = mode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
    this.isDarkSubject.next(isDark);
  }

  private persistMode(mode: ThemeMode): void {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
}
