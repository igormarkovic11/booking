import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="toast"
      [class.show]="state.show"
      [class.error]="state.type === 'error'"
    >
      <span class="toast-icon">{{
        state.type === 'success' ? '✅' : '❌'
      }}</span>
      <span class="toast-msg">{{ state.message }}</span>
    </div>
  `,
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  @Input() state: ToastState = { show: false, message: '', type: 'success' };
}
