import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inline-success-box">
      <div class="success-icon">✉️</div>
      <h3>Skoro gotovo!</h3>
      <p class="success-text">{{ message }}</p>
      <button class="close-btn" (click)="closed.emit()">U redu</button>
    </div>
  `,
  styleUrl: './success-message.component.css',
})
export class SuccessMessageComponent {
  @Input() message = '';
  @Output() closed = new EventEmitter<void>();
}
