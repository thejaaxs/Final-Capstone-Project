import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

interface LoanOffer {
  lender: string;
  rate: string;
  tenure: string;
  note: string;
}

@Component({
  standalone: true,
  selector: 'app-loan-info',
  imports: [CommonModule],
  template: `
    <article class="loan-card">
      <header class="loan-head">
        <div>
          <p class="eyebrow">Finance Guide</p>
          <h3>Popular Vehicle Loan Options</h3>
        </div>
      </header>

      <p class="intro">
        Compare a few common lender profiles before you talk to the dealer. These are sample offers for guidance only.
      </p>

      <div class="offer-list">
        <article class="offer-item" *ngFor="let offer of offers">
          <div class="offer-meta">
            <div>
              <h4>{{ offer.lender }}</h4>
              <p>{{ offer.note }}</p>
            </div>
            <button type="button" class="btn btn-ghost" (click)="showEligibilityHint(offer.lender)">
              Check Eligibility
            </button>
          </div>

          <div class="offer-stats">
            <div class="stat">
              <span>Starting rate</span>
              <strong>{{ offer.rate }}</strong>
            </div>
            <div class="stat">
              <span>Max tenure</span>
              <strong>{{ offer.tenure }}</strong>
            </div>
          </div>
        </article>
      </div>

      <p class="disclaimer">
        Indicative rates only. Final approval depends on lender terms, credit score, and eligibility.
      </p>
    </article>
  `,
  styleUrl: './loan-info.component.css'
})
export class LoanInfoComponent {
  readonly offers: LoanOffer[] = [
    {
      lender: 'SBI Vehicle Loan',
      rate: 'Starting from 9.25% p.a.',
      tenure: 'Up to 60 months',
      note: 'Rates may vary by credit score and eligibility.'
    },
    {
      lender: 'HDFC Auto Loan',
      rate: 'Starting from 9.50% p.a.',
      tenure: 'Up to 72 months',
      note: 'Rates may vary by credit score and eligibility.'
    },
    {
      lender: 'ICICI Two-Wheeler Loan',
      rate: 'Starting from 9.75% p.a.',
      tenure: 'Up to 60 months',
      note: 'Rates may vary by credit score and eligibility.'
    },
    {
      lender: 'Bajaj Finance Two-Wheeler Loan',
      rate: 'Starting from 10.25% p.a.',
      tenure: 'Up to 84 months',
      note: 'Rates may vary by credit score and eligibility.'
    },
  ];

  constructor(private toast: ToastService) {}

  showEligibilityHint(lender: string): void {
    this.toast.info(`Talk to the dealer to review ${lender} eligibility options.`);
  }
}
