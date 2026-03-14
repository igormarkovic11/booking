import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-page">
      <div class="login-card">
        <h2>Admin pristup</h2>
        <p class="subtitle">Unesite PIN za nastavak</p>

        <input
          type="password"
          [(ngModel)]="pin"
          class="pin-input"
          maxlength="4"
          placeholder="••••"
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
          <span *ngIf="!loading">Potvrdi</span>
          <span *ngIf="loading">Provjera...</span>
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
