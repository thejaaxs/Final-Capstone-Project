import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

const INR_SYMBOL = '\u20B9';

@Component({
  standalone: true,
  selector: 'app-emi-calculator',
  imports: [CommonModule, FormsModule],
  template: `
    <article class="emi-card">
      <header class="panel-head">
        <div>
          <p class="eyebrow">Affordability</p>
          <h3>EMI Calculator</h3>
        </div>
        <span class="info-chip">Informational only</span>
      </header>

      <p class="panel-copy">
        Estimate your monthly outflow before you book. This does not change booking, pricing, or payment flow.
      </p>

      <div class="input-grid">
        <label class="field field-full">
          <span>Vehicle Price ({{ rupeeSymbol }})</span>
          <input
            type="number"
            min="0"
            [ngModel]="vehiclePrice"
            (ngModelChange)="vehiclePrice = toNonNegativeNumber($event)"
            placeholder="Enter vehicle price"
          />
        </label>

        <label class="field">
          <span>Down Payment ({{ rupeeSymbol }})</span>
          <input
            type="number"
            min="0"
            [ngModel]="downPayment"
            (ngModelChange)="downPayment = toNonNegativeNumber($event)"
          />
        </label>

        <label class="field">
          <span>Interest Rate (% p.a.)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            [ngModel]="annualRate"
            (ngModelChange)="annualRate = toNonNegativeNumber($event)"
          />
        </label>

        <label class="field field-full">
          <span>Loan Tenure (months)</span>
          <div class="tenure-row">
            <input
              class="tenure-slider"
              type="range"
              min="6"
              max="84"
              step="1"
              [ngModel]="months"
              (ngModelChange)="months = normalizeMonths($event)"
            />
            <input
              class="tenure-input"
              type="number"
              min="6"
              max="84"
              [ngModel]="months"
              (ngModelChange)="months = normalizeMonths($event)"
            />
          </div>
        </label>

        <label class="field field-full">
          <span>Processing Fee ({{ rupeeSymbol }})</span>
          <input
            type="number"
            min="0"
            [ngModel]="processingFee"
            (ngModelChange)="processingFee = toNonNegativeNumber($event)"
          />
        </label>
      </div>

      <p class="validation-text" *ngIf="validationMessage">{{ validationMessage }}</p>

      <section class="result-shell" [class.disabled]="!canCalculate">
        <div class="hero-metric">
          <span>Monthly EMI</span>
          <strong>{{ formatCurrency(monthlyEmi) }}<small> / month</small></strong>
        </div>

        <div class="result-grid">
          <article class="result-tile">
            <span>Loan Amount</span>
            <strong>{{ formatCurrency(loanAmount) }}</strong>
          </article>
          <article class="result-tile">
            <span>Total Interest</span>
            <strong>{{ formatCurrency(totalInterest) }}</strong>
          </article>
          <article class="result-tile">
            <span>Total Amount Payable</span>
            <strong>{{ formatCurrency(totalAmountPayable) }}</strong>
          </article>
          <article class="result-tile">
            <span>Processing Fee</span>
            <strong>{{ formatCurrency(normalizedProcessingFee) }}</strong>
          </article>
        </div>
      </section>

      <p class="disclaimer">
        Indicative EMI only. Final loan amount, fees, and approval depend on lender terms.
      </p>
    </article>
  `,
  styleUrl: './emi-calculator.component.css'
})
export class EmiCalculatorComponent implements OnChanges {
  @Input() price: number | null = null;

  readonly rupeeSymbol = INR_SYMBOL;

  vehiclePrice: number | null = null;
  downPayment = 0;
  annualRate = 10.5;
  months = 36;
  processingFee = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['price']) {
      this.vehiclePrice = this.hasValidPrice(this.price) ? this.price : null;
    }
  }

  get normalizedPrice(): number {
    return this.toNonNegativeNumber(this.vehiclePrice);
  }

  get normalizedDownPayment(): number {
    return this.toNonNegativeNumber(this.downPayment);
  }

  get normalizedInterestRate(): number {
    return this.toNonNegativeNumber(this.annualRate);
  }

  get normalizedProcessingFee(): number {
    return this.toNonNegativeNumber(this.processingFee);
  }

  get validationMessage(): string {
    if (this.normalizedPrice <= 0) {
      return 'Vehicle price is required to calculate EMI.';
    }
    if (this.normalizedDownPayment > this.normalizedPrice) {
      return 'Down payment cannot be greater than vehicle price.';
    }
    return '';
  }

  get canCalculate(): boolean {
    return this.validationMessage.length === 0 && this.months >= 6 && this.months <= 84;
  }

  get loanAmount(): number {
    if (!this.canCalculate) return 0;
    return Math.max(this.normalizedPrice - this.normalizedDownPayment, 0);
  }

  get monthlyEmi(): number {
    if (!this.canCalculate) return 0;

    const p = this.loanAmount;
    const n = this.normalizeMonths(this.months);
    if (p <= 0 || n <= 0) return 0;

    const r = this.normalizedInterestRate / (12 * 100);
    if (r === 0) {
      return p / n;
    }

    const growth = Math.pow(1 + r, n);
    return (p * r * growth) / (growth - 1);
  }

  get totalInterest(): number {
    if (!this.canCalculate) return 0;
    return Math.max(this.monthlyEmi * this.normalizeMonths(this.months) - this.loanAmount, 0);
  }

  get totalAmountPayable(): number {
    if (!this.canCalculate) return 0;
    return this.loanAmount + this.totalInterest + this.normalizedProcessingFee;
  }

  formatCurrency(value: number): string {
    const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
    return `${this.rupeeSymbol} ${new Intl.NumberFormat('en-IN').format(safeValue)}`;
  }

  toNonNegativeNumber(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  }

  normalizeMonths(value: unknown): number {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) return 36;
    return Math.min(84, Math.max(6, parsed));
  }

  private hasValidPrice(value: number | null): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }
}
