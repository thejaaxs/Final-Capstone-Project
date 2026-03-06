import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './core/components/toast-container.component';
import { ThemeService } from './core/services/theme.service';
import { DealerChatWidgetComponent } from './features/chat/dealer-chat-widget.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, DealerChatWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private _theme: ThemeService) {}
}
