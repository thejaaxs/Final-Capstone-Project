import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-badge',
  imports: [CommonModule],
  template: `<span class="mm-badge" [ngClass]="badgeClass">{{ label }}</span>`,
  styles: [`
    .mm-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 0.22rem 0.58rem;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 1px solid transparent;
      line-height: 1;
    }

    .mm-pending {
      color: #865300;
      background: #fff3d6;
      border-color: #f8e2ad;
    }

    .mm-requested {
      color: #865300;
      background: #fff3d6;
      border-color: #f8e2ad;
    }

    .mm-accepted {
      color: #1d4ed8;
      background: #e9f1ff;
      border-color: #c8dbff;
    }

    .mm-confirmed,
    .mm-paid,
    .mm-available,
    .mm-active {
      color: #146438;
      background: #e5f7ee;
      border-color: #bde8d1;
    }

    .mm-rejected {
      color: #9b1030;
      background: #ffe9ef;
      border-color: #ffc8d5;
    }

    .mm-cancelled,
    .mm-unpaid,
    .mm-out_of_stock,
    .mm-inactive {
      color: #9b1030;
      background: #ffe9ef;
      border-color: #ffc8d5;
    }

    .mm-info,
    .mm-booked {
      color: #1f3f7b;
      background: #e8f0ff;
      border-color: #cddcf9;
    }
  `]
})
export class BadgeComponent {
  @Input() value = '';
  @Input() text = '';

  get normalized(): string {
    return (this.value || this.text || 'INFO').toUpperCase();
  }

  get label(): string {
    return this.text || this.normalized.replaceAll('_', ' ');
  }

  get badgeClass(): string {
    return `mm-${this.normalized.toLowerCase()}`;
  }
}
