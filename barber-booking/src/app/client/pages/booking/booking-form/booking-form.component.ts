import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface BookingFormData {
  name: string;
  phone: string;
  email: string;
}

@Component({
  selector: 'app-booking-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input
      type="text"
      placeholder="Ime"
      [(ngModel)]="data.name"
      class="custom-input"
      [disabled]="loading"
    />
    <input
      type="text"
      placeholder="Telefon"
      [(ngModel)]="data.phone"
      class="custom-input"
      [disabled]="loading"
    />
    <input
      type="email"
      placeholder="Email"
      [(ngModel)]="data.email"
      class="custom-input"
      [disabled]="loading"
    />

    <p *ngIf="errorMessage" class="error-text">{{ errorMessage }}</p>

    <button
      class="submit-btn"
      (click)="submitted.emit(data)"
      [disabled]="loading || !canSubmit"
    >
      <span *ngIf="!loading">Završi</span>
      <span *ngIf="loading">Slanje...</span>
    </button>
  `,
  styleUrl: './booking-form.component.css',
})
export class BookingFormComponent {
  @Input() loading = false;
  @Input() errorMessage = '';
  @Input() canSubmit = false;
  @Output() submitted = new EventEmitter<BookingFormData>();

  data: BookingFormData = { name: '', phone: '', email: '' };

  reset(): void {
    this.data = { name: '', phone: '', email: '' };
  }
}
