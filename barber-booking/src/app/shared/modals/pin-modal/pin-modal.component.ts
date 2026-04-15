import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="admin-card modal-content pin-modal">
        <h3>{{ 'PIN_MODAL.TITLE' | translate }}</h3>
        <p>{{ 'ADMIN.LOGIN_SUBTITLE' | translate }}</p>
        <input
          type="password"
          [(ngModel)]="pin"
          class="pin-input"
          maxlength="4"
          (keyup.enter)="onConfirm()"
          [placeholder]="'ADMIN.PIN_PLACEHOLDER' | translate"
        />
        <div class="modal-actions">
          <button class="action-btn cancel" (click)="onCancel()">
            {{ 'PIN_MODAL.CANCEL' | translate }}
          </button>
          <button class="add-btn" (click)="onConfirm()">
            {{ 'PIN_MODAL.CONFIRM' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './pin-modal.component.css',
})
export class PinModalComponent {
  @Input() visible = false;
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  pin = '';

  onConfirm(): void {
    this.confirmed.emit(this.pin);
    this.pin = '';
  }

  onCancel(): void {
    this.pin = '';
    this.cancelled.emit();
  }
}
