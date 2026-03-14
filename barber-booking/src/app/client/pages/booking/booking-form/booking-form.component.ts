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
    <!-- NAME -->
    <div class="field">
      <input
        type="text"
        placeholder="Ime"
        [(ngModel)]="data.name"
        class="custom-input"
        [class.invalid]="touched.name && errors.name"
        [class.valid]="touched.name && !errors.name && data.name"
        [disabled]="loading"
        (blur)="onBlur('name')"
        (ngModelChange)="onNameChange($event)"
      />
      <p class="field-error" *ngIf="touched.name && errors.name">
        {{ errors.name }}
      </p>
    </div>

    <!-- PHONE -->
    <div class="field">
      <input
        type="text"
        placeholder="Telefon"
        [(ngModel)]="data.phone"
        class="custom-input"
        [class.invalid]="touched.phone && errors.phone"
        [class.valid]="touched.phone && !errors.phone && data.phone"
        [disabled]="loading"
        (blur)="onBlur('phone')"
        (ngModelChange)="onPhoneChange($event)"
      />
      <p class="field-error" *ngIf="touched.phone && errors.phone">
        {{ errors.phone }}
      </p>
    </div>

    <!-- EMAIL -->
    <div class="field">
      <input
        type="email"
        placeholder="Email"
        [(ngModel)]="data.email"
        class="custom-input"
        [class.invalid]="touched.email && errors.email"
        [class.valid]="touched.email && !errors.email && data.email"
        [disabled]="loading"
        (blur)="onBlur('email')"
        (ngModelChange)="onEmailChange($event)"
      />
      <p class="field-error" *ngIf="touched.email && errors.email">
        {{ errors.email }}
      </p>
    </div>

    <p *ngIf="errorMessage" class="error-text">{{ errorMessage }}</p>

    <button
      class="submit-btn"
      (click)="onSubmit()"
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

  touched = { name: false, phone: false, email: false };
  errors = { name: '', phone: '', email: '' };

  /* ---------- BLUR ---------- */
  onBlur(field: keyof typeof this.touched): void {
    this.touched[field] = true;
    this.validate(field);
  }

  /* ---------- LIVE VALIDATION (only after first blur) ---------- */
  onNameChange(value: string): void {
    this.data.name = value;
    if (this.touched.name) this.validate('name');
  }

  onPhoneChange(value: string): void {
    this.data.phone = value;
    if (this.touched.phone) this.validate('phone');
  }

  onEmailChange(value: string): void {
    this.data.email = value;
    if (this.touched.email) this.validate('email');
  }

  /* ---------- VALIDATION RULES ---------- */
  private validate(field: keyof typeof this.errors): void {
    switch (field) {
      case 'name':
        this.errors.name = !this.data.name.trim()
          ? 'Ime je obavezno'
          : this.data.name.trim().length < 2
            ? 'Ime mora imati najmanje 2 karaktera'
            : '';
        break;

      case 'phone':
        const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/;
        this.errors.phone = !this.data.phone.trim()
          ? 'Telefon je obavezan'
          : this.data.phone.trim().length < 9
            ? 'Telefon mora imati najmanje 9 cifara'
            : !phoneRegex.test(this.data.phone)
              ? 'Unesite ispravan broj telefona'
              : '';
        break;

      case 'email':
        this.errors.email = !this.data.email.trim()
          ? 'Email je obavezan'
          : !/\S+@\S+\.\S+/.test(this.data.email)
            ? 'Unesite validan email'
            : '';
        break;
    }
  }

  private validateAll(): boolean {
    (['name', 'phone', 'email'] as const).forEach((f) => {
      this.touched[f] = true;
      this.validate(f);
    });
    return !this.errors.name && !this.errors.phone && !this.errors.email;
  }

  /* ---------- SUBMIT ---------- */
  onSubmit(): void {
    if (!this.validateAll()) return;
    this.submitted.emit(this.data);
  }

  /* ---------- RESET ---------- */
  reset(): void {
    this.data = { name: '', phone: '', email: '' };
    this.touched = { name: false, phone: false, email: false };
    this.errors = { name: '', phone: '', email: '' };
  }
}
