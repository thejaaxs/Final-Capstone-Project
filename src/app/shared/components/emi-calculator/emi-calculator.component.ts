import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-emi-calculator',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="emi-backdrop" *ngIf="open" (click)="onBackdropClick($event)">
      <section class="emi-modal" role="dialog" aria-modal="true" aria-label="EMI Calculator">
        <header class="emi-header">
          <h3>EMI Calculator</h3>
          <button type="button" class="icon-btn" (click)="requestClose()" aria-label="Close EMI calculator">x</button>
        </header>

        <div class="emi-input-grid">
          <div class="field">
            <label>Principal (₹)</label>
            <input type="number" min="0" [(ngModel)]="principal" placeholder="Enter amount" />
          </div>

          <div class="field">
            <label>Down Payment (₹)</label>
            <input type="number" min="0" [(ngModel)]="downPayment" />
          </div>

          <div class="field">
            <label>Interest Rate (% p.a.)</label>
            <input type="number" min="0" step="0.1" [(ngModel)]="annualRate" />
          </div>

          <div class="field">
            <label>Processing Fee (₹)</label>
            <input type="number" min="0" [(ngModel)]="processingFee" />
          </div>
        </div>

        <div class="tenure-wrap">
          <div class="tenure-head">
            <label>Tenure</label>
            <strong>{{ months }} months</strong>
          </div>
          <input
            class="tenure-slider"
            type="range"
            min="6"
            max="84"
            step="6"
            [ngModel]="months"
            (ngModelChange)="setMonths($event)"
          />
          <select [ngModel]="months" (ngModelChange)="setMonths($event)">
            <option *ngFor="let option of tenureOptions" [ngValue]="option">{{ option }} months</option>
          </select>
        </div>

        <p class="validation" *ngIf="validationMessage">{{ validationMessage }}</p>

        <article class="result-card" [class.disabled]="!canCalculate">
          <div class="result-row">
            <span>Loan Amount</span>
            <b>{{ formatINR(loanAmount) }}</b>
          </div>
          <div class="result-row">
            <span>Monthly EMI</span>
            <b>{{ formatINR(monthlyEmi) }}</b>
          </div>
          <div class="result-row">
            <span>Total Interest</span>
            <b>{{ formatINR(totalInterest) }}</b>
          </div>
          <div class="result-row">
            <span>Total Payable</span>
            <b>{{ formatINR(totalPayable) }}</b>
          </div>
          <div class="result-row muted-row">
            <span>Processing Fee</span>
            <b>{{ formatINR(normalizedProcessingFee) }}</b>
          </div>
        </article>

        <article class="amortization" *ngIf="canCalculate">
          <h4>Month 1 Split</h4>
          <div class="result-row">
            <span>Interest</span>
            <b>{{ formatINR(firstMonthInterest) }}</b>
          </div>
          <div class="result-row">
            <span>Principal</span>
            <b>{{ formatINR(firstMonthPrincipal) }}</b>
          </div>
        </article>

        <footer class="actions">
          <button type="button" class="btn btn-ghost" (click)="requestClose()">Close</button>
        </footer>
      </section>
    </div>
  `,
  styleUrl: './emi-calculator.component.css'
})
export class EmiCalculatorComponent implements OnChanges {
  @Input() open = false;
  @Input() price: number | null = null;
  @Output() close = new EventEmitter<void>();

  principal: number | null = null;
  downPayment = 0;
  annualRate = 10.5;
  months = 36;
  processingFee = 0;
  readonly tenureOptions = Array.from({ length: 14 }, (_, i) => (i + 1) * 6);

  ngOnChanges(changes: SimpleChanges): void {
    const openedNow = changes['open']?.currentValue === true;
    const priceChanged = !!changes['price'];
    if (openedNow || priceChanged) {
      this.principal = this.validPrice(this.price) ? this.price : null;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.requestClose();
  }

  requestClose(): void {
    this.close.emit();
  }

  setMonths(value: unknown): void {
    this.months = this.normalizeMonths(value);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.requestClose();
  }

  get normalizedPrincipal(): number {
    return this.toNonNegativeNumber(this.principal);
  }

  get normalizedDownPayment(): number {
    return this.toNonNegativeNumber(this.downPayment);
  }

  get normalizedRate(): number {
    return this.toNonNegativeNumber(this.annualRate);
  }

  get normalizedProcessingFee(): number {
    return this.toNonNegativeNumber(this.processingFee);
  }

  get validationMessage(): string {
    if (this.normalizedPrincipal <= 0) return 'Enter principal amount to calculate EMI.';
    if (this.normalizedDownPayment > this.normalizedPrincipal) {
      return 'Down payment cannot be greater than principal.';
    }
    return '';
  }

  get canCalculate(): boolean {
    return this.validationMessage.length === 0;
  }

  get loanAmount(): number {
    if (!this.canCalculate) return 0;
    return Math.max(this.normalizedPrincipal - this.normalizedDownPayment, 0);
  }

  get monthlyEmi(): number {
    if (!this.canCalculate) return 0;
    const p = this.loanAmount;
    const n = this.normalizeMonths(this.months);
    if (p <= 0 || n <= 0) return 0;
    const r = this.normalizedRate / (12 * 100);
    if (r === 0) return p / n;

    const growth = Math.pow(1 + r, n);
    const denominator = growth - 1;
    if (denominator === 0) return 0;
    return (p * r * growth) / denominator;
  }

  get totalPayable(): number {
    if (!this.canCalculate) return 0;
    return this.monthlyEmi * this.normalizeMonths(this.months);
  }

  get totalInterest(): number {
    if (!this.canCalculate) return 0;
    return Math.max(this.totalPayable - this.loanAmount, 0);
  }

  get firstMonthInterest(): number {
    if (!this.canCalculate) return 0;
    const r = this.normalizedRate / (12 * 100);
    return this.loanAmount * r;
  }

  get firstMonthPrincipal(): number {
    if (!this.canCalculate) return 0;
    return Math.max(this.monthlyEmi - this.firstMonthInterest, 0);
  }

  formatINR(n: number): string {
    const value = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  private validPrice(value: number | null): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }

  private toNonNegativeNumber(value: unknown): number {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return 0;
    return num;
  }

  private normalizeMonths(value: unknown): number {
    const raw = Number(value);
    if (!Number.isFinite(raw)) return 36;
    const clamped = Math.min(84, Math.max(6, raw));
    return Math.round(clamped / 6) * 6;
  }
}
