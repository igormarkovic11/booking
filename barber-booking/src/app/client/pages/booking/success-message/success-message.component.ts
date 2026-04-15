import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-success-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="inline-success-box">
      <div class="success-icon">✉️</div>
      <h3>{{ 'BOOKING.SUCCESS_TITLE' | translate }}</h3>
      <p class="success-text">{{ message }}</p>
      <button class="close-btn" (click)="closed.emit()">
        {{ 'BOOKING.SUCCESS_CLOSE' | translate }}
      </button>
    </div>
  `,
  styleUrl: './success-message.component.css',
})
export class SuccessMessageComponent {
  @Input() message = '';
  @Output() closed = new EventEmitter<void>();
}
