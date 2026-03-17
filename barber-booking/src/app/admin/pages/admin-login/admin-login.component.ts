import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-page">
      <div class="login-card">
        <h2>{{ 'ADMIN.LOGIN_TITLE' | translate }}</h2>
        <p class="subtitle">{{ 'ADMIN.LOGIN_SUBTITLE' | translate }}</p>

        <input
          type="password"
          [(ngModel)]="pin"
          class="pin-input"
          maxlength="4"
          [placeholder]="'ADMIN.PIN_PLACEHOLDER' | translate"
          [disabled]="loading"
          (keyup.enter)="submit()"
          autofocus
        />

        <p *ngIf="errorMessage" class="error-text">{{ errorMessage }}</p>

        <button
          class="submit-btn"
          (click)="submit()"
          [disabled]="loading || pin.length === 0"
        >
          <span *ngIf="!loading">{{ 'ADMIN.CONFIRM_BTN' | translate }}</span>
          <span *ngIf="loading">{{ 'ADMIN.CONFIRMING' | translate }}</span>
        </button>
      </div>
    </div>
  `,
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent {
  pin = '';
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async submit(): Promise<void> {
    if (!this.pin) return;
    this.loading = true;
    this.errorMessage = '';

    const success = await this.authService.login(this.pin);

    if (success) {
      this.router.navigate(['/admin/admin-dashboard']);
    } else {
      this.errorMessage = 'Pogrešan PIN. Pokušajte ponovo.';
      this.pin = '';
    }

    this.loading = false;
  }
}
