import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { DealerChatApi } from '../../api/dealer-chat.api';
import { AuthService } from '../../core/services/auth.service';
import { ChatResponse, ChatSession, VehicleRecommendation } from '../../shared/models/dealer-chat.model';

interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  recommendations: VehicleRecommendation[] | null;
}

@Component({
  standalone: true,
  selector: 'app-dealer-chat-widget',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-widget" *ngIf="isVisible">
      <section class="chat-panel" *ngIf="isOpen" aria-label="MotoMint Assistant">
        <header class="chat-header">
          <div>
            <p class="eyebrow">Smart Help</p>
            <h3>MotoMint Assistant</h3>
          </div>
          <div class="chat-header-actions">
            <button
              type="button"
              class="icon-btn"
              (click)="restartConversation()"
              [disabled]="isLoading"
              aria-label="Restart conversation"
              title="Restart"
            >
              &#8635;
            </button>
            <button
              type="button"
              class="icon-btn"
              (click)="toggleOpen()"
              aria-label="Close assistant"
              title="Close"
            >
              &times;
            </button>
          </div>
        </header>

        <div class="message-viewport" #messageViewport>
          <div class="message-list">
            <article
              *ngFor="let entry of messages; trackBy: trackMessage"
              class="message-block"
              [class.user]="entry.sender === 'user'"
              [class.bot]="entry.sender === 'bot'"
            >
              <div class="message-bubble">
                <p>{{ entry.text }}</p>
              </div>

              <div class="recommendations" *ngIf="entry.recommendations?.length">
                <article class="recommendation-card" *ngFor="let vehicle of entry.recommendations">
                  <img
                    [src]="vehicle.imageUrl || fallbackImage"
                    [alt]="vehicle.name"
                    class="recommendation-image"
                  />
                  <div class="recommendation-body">
                    <span class="recommendation-brand">{{ vehicle.brand }}</span>
                    <h4>{{ vehicle.name }}</h4>
                    <p class="recommendation-price">{{ formatCurrency(vehicle.price) }}</p>
                    <div class="recommendation-meta">
                      <span>Mileage: {{ vehicle.mileage }} km/l</span>
                      <span>Ride: {{ vehicle.rideType || 'General' }}</span>
                    </div>
                    <button
                      *ngIf="canViewVehicle(vehicle)"
                      type="button"
                      class="btn btn-ghost recommendation-btn"
                      (click)="viewVehicle(vehicle.id)"
                    >
                      View Vehicle
                    </button>
                  </div>
                </article>
              </div>
            </article>

            <article class="message-block bot loading-block" *ngIf="isLoading">
              <div class="message-bubble typing-bubble">
                <p>Typing...</p>
              </div>
            </article>
          </div>
        </div>

        <footer class="chat-composer">
          <input
            type="text"
            [(ngModel)]="draft"
            (keydown.enter)="sendCurrentMessage()"
            [disabled]="isLoading"
            placeholder="Ask about budget, mileage, or best vehicle..."
            aria-label="Chat message"
          />
          <button type="button" class="btn" (click)="sendCurrentMessage()" [disabled]="isLoading || !draft.trim()">
            Send
          </button>
        </footer>
      </section>

      <button
        type="button"
        class="chat-launcher"
        (click)="toggleOpen()"
        [attr.aria-expanded]="isOpen"
        aria-label="Open MotoMint Assistant"
      >
        <span class="launcher-icon">{{ isOpen ? '\u2212' : '\u2709' }}</span>
        <span class="launcher-label">{{ isOpen ? 'Close Assistant' : 'MotoMint Assistant' }}</span>
      </button>
    </div>
  `,
  styles: [`
    .chat-widget {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 5600;
      display: grid;
      justify-items: end;
      gap: 0.85rem;
      width: min(380px, calc(100vw - 1.25rem));
      pointer-events: none;
    }

    .chat-panel,
    .chat-launcher {
      pointer-events: auto;
    }

    .chat-panel {
      width: 100%;
      max-height: min(72vh, 640px);
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      background: var(--surface, var(--mm-surface));
      border: 1px solid var(--border, var(--mm-border));
      border-radius: 22px;
      box-shadow: 0 24px 54px rgba(8, 22, 44, 0.22);
      overflow: hidden;
      backdrop-filter: blur(10px);
    }

    .chat-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.8rem;
      padding: 1rem 1rem 0.9rem;
      border-bottom: 1px solid var(--border, var(--mm-border));
      background:
        radial-gradient(circle at top left, color-mix(in srgb, var(--primary, var(--mm-primary-600)) 18%, transparent), transparent 42%),
        var(--surface, var(--mm-surface));
    }

    .eyebrow {
      margin: 0 0 0.15rem;
      color: var(--primary, var(--mm-primary-600));
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .chat-header h3 {
      margin: 0;
      color: var(--text, var(--mm-text));
      font-size: 1.02rem;
    }

    .chat-header-actions {
      display: inline-flex;
      gap: 0.45rem;
    }

    .icon-btn {
      width: 2rem;
      height: 2rem;
      border: 1px solid var(--border, var(--mm-border));
      border-radius: 10px;
      background: color-mix(in srgb, var(--surface, var(--mm-surface)) 88%, var(--bg, var(--mm-bg)));
      color: var(--text, var(--mm-text));
      display: grid;
      place-items: center;
      font-size: 1rem;
      line-height: 1;
    }

    .message-viewport {
      min-height: 0;
      overflow: auto;
      background: color-mix(in srgb, var(--bg, var(--mm-bg)) 35%, var(--surface, var(--mm-surface)));
    }

    .message-list {
      display: grid;
      gap: 0.8rem;
      padding: 1rem;
    }

    .message-block {
      display: grid;
      gap: 0.55rem;
      justify-items: start;
    }

    .message-block.user {
      justify-items: end;
    }

    .message-bubble {
      max-width: min(92%, 290px);
      border-radius: 18px;
      padding: 0.8rem 0.9rem;
      background: var(--surface, var(--mm-surface));
      border: 1px solid var(--border, var(--mm-border));
      color: var(--text, var(--mm-text));
      box-shadow: var(--mm-shadow-sm);
    }

    .message-block.user .message-bubble {
      background: linear-gradient(135deg, var(--primary, var(--mm-primary-600)), var(--mm-primary-700));
      border-color: color-mix(in srgb, var(--primary, var(--mm-primary-600)) 55%, var(--border, var(--mm-border)));
      color: #fff;
    }

    .message-bubble p {
      margin: 0;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .typing-bubble {
      background: color-mix(in srgb, var(--surface, var(--mm-surface)) 90%, var(--primary, var(--mm-primary-600)) 10%);
    }

    .recommendations {
      width: 100%;
      display: grid;
      gap: 0.65rem;
    }

    .recommendation-card {
      display: grid;
      grid-template-columns: 88px minmax(0, 1fr);
      gap: 0.7rem;
      border: 1px solid var(--border, var(--mm-border));
      border-radius: 16px;
      background: var(--surface, var(--mm-surface));
      overflow: hidden;
      box-shadow: var(--mm-shadow-sm);
    }

	    .recommendation-image {
	      width: 100%;
	      height: 100%;
	      min-height: 112px;
	      object-fit: contain;
	      object-position: center;
	      padding: 0.4rem;
	      background: color-mix(in srgb, var(--bg, var(--mm-bg)) 45%, #e5edf7);
	    }

    .recommendation-body {
      min-width: 0;
      display: grid;
      gap: 0.28rem;
      padding: 0.72rem 0.75rem 0.75rem 0;
    }

    .recommendation-brand {
      color: var(--muted, var(--mm-text-muted));
      font-size: 0.74rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .recommendation-body h4 {
      margin: 0;
      color: var(--text, var(--mm-text));
      font-size: 0.96rem;
      line-height: 1.3;
      word-break: break-word;
    }

    .recommendation-price {
      margin: 0;
      color: var(--primary, var(--mm-primary-600));
      font-size: 0.92rem;
      font-weight: 800;
    }

    .recommendation-meta {
      display: grid;
      gap: 0.14rem;
      color: var(--muted, var(--mm-text-muted));
      font-size: 0.78rem;
    }

    .recommendation-btn {
      margin-top: 0.35rem;
      width: fit-content;
    }

    .chat-composer {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.65rem;
      padding: 0.9rem 1rem 1rem;
      border-top: 1px solid var(--border, var(--mm-border));
      background: var(--surface, var(--mm-surface));
    }

    .chat-composer input {
      min-width: 0;
    }

    .chat-launcher {
      display: inline-flex;
      align-items: center;
      gap: 0.62rem;
      border: 1px solid color-mix(in srgb, var(--primary, var(--mm-primary-600)) 28%, var(--border, var(--mm-border)));
      border-radius: 999px;
      background: linear-gradient(135deg, var(--primary, var(--mm-primary-600)), var(--mm-primary-700));
      color: #fff;
      box-shadow: 0 14px 36px rgba(19, 54, 112, 0.28);
      padding: 0.85rem 1rem;
      font-weight: 800;
    }

    .launcher-icon {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
      display: grid;
      place-items: center;
      font-size: 0.95rem;
      line-height: 1;
    }

    .launcher-label {
      white-space: nowrap;
      font-size: 0.88rem;
    }

    @media (max-width: 640px) {
      .chat-widget {
        right: 0.65rem;
        left: 0.65rem;
        bottom: 0.65rem;
        width: auto;
      }

      .chat-panel {
        max-height: min(68vh, 560px);
      }

      .chat-header,
      .message-list,
      .chat-composer {
        padding-left: 0.85rem;
        padding-right: 0.85rem;
      }

      .chat-composer {
        grid-template-columns: 1fr;
      }

      .chat-composer .btn {
        width: 100%;
      }

      .recommendation-card {
        grid-template-columns: 74px minmax(0, 1fr);
      }

      .launcher-label {
        font-size: 0.84rem;
      }
    }

    @media (max-width: 420px) {
      .chat-panel {
        border-radius: 18px;
      }

      .chat-launcher {
        width: 100%;
        justify-content: center;
      }

      .recommendation-card {
        grid-template-columns: 1fr;
      }

      .recommendation-image {
        min-height: 136px;
      }

      .recommendation-body {
        padding: 0 0.75rem 0.75rem;
      }

      .message-bubble {
        max-width: 100%;
      }
    }
  `]
})
export class DealerChatWidgetComponent implements OnDestroy {
  @ViewChild('messageViewport') private messageViewport?: ElementRef<HTMLDivElement>;

  draft = '';
  isOpen = false;
  isLoading = false;
  isVisible = true;
  messages: ChatMessage[] = [];
  session: ChatSession | null = null;
  fallbackImage = 'https://placehold.co/320x200/e5edf7/36597f?text=MotoMint';

  private initialized = false;
  private nextMessageId = 0;
  private requestSub?: Subscription;
  private routeSub: Subscription;

  constructor(
    private dealerChatApi: DealerChatApi,
    private router: Router,
    private auth: AuthService
  ) {
    this.isVisible = !this.isExcludedRoute(this.router.url);
    this.routeSub = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.isVisible = !this.isExcludedRoute(event.urlAfterRedirects);
    });
  }

  ngOnDestroy(): void {
    this.requestSub?.unsubscribe();
    this.routeSub.unsubscribe();
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && !this.initialized && !this.isLoading) {
      this.restartConversation();
      return;
    }
    if (this.isOpen) {
      this.scheduleScrollToBottom();
    }
  }

  restartConversation(): void {
    if (this.isLoading) return;
    this.requestSub?.unsubscribe();
    this.draft = '';
    this.messages = [];
    this.session = null;
    this.initialized = true;
    this.dispatchMessage('', null);
  }

  sendCurrentMessage(): void {
    const text = this.draft.trim();
    if (!text || this.isLoading) return;

    this.pushMessage('user', text, null);
    this.draft = '';
    this.dispatchMessage(text, this.session);
  }

  trackMessage(_: number, message: ChatMessage): number {
    return message.id;
  }

  canViewVehicle(vehicle: VehicleRecommendation): boolean {
    return this.auth.getRole() === 'ROLE_CUSTOMER' && Number.isFinite(vehicle.id) && vehicle.id > 0;
  }

  viewVehicle(vehicleId: number): void {
    if (!this.canViewVehicle({ id: vehicleId } as VehicleRecommendation)) return;
    this.isOpen = false;
    this.router.navigate(['/customer/vehicles', vehicleId]);
  }

  formatCurrency(value: number): string {
    const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
    return `\u20B9 ${new Intl.NumberFormat('en-IN').format(safeValue)}`;
  }

  private dispatchMessage(message: string, session: ChatSession | null): void {
    this.isLoading = true;
    this.scheduleScrollToBottom();

    this.requestSub = this.dealerChatApi.sendMessage({ message, session }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.handleResponse(response);
      },
      error: () => {
        this.isLoading = false;
        this.pushMessage('bot', 'Assistant is unavailable right now.', null);
      }
    });
  }

  private handleResponse(response: ChatResponse): void {
    this.session = response.session || null;
    this.pushMessage('bot', response.message || 'How can I help you today?', response.recommendations ?? null);
  }

  private pushMessage(sender: 'user' | 'bot', text: string, recommendations: VehicleRecommendation[] | null): void {
    this.messages = [
      ...this.messages,
      {
        id: ++this.nextMessageId,
        sender,
        text,
        recommendations,
      }
    ];
    this.scheduleScrollToBottom();
  }

  private scheduleScrollToBottom(): void {
    window.setTimeout(() => {
      const viewport = this.messageViewport?.nativeElement;
      if (!viewport) return;
      viewport.scrollTop = viewport.scrollHeight;
    }, 0);
  }

  private isExcludedRoute(url: string): boolean {
    return url.startsWith('/login') || url.startsWith('/register');
  }
}
