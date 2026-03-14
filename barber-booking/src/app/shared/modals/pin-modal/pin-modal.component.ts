import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="admin-card modal-content pin-modal">
        <h3>Autorizacija</h3>
        <p>Unesite PIN za nastavak</p>
        <input
          type="password"
          [(ngModel)]="pin"
          class="pin-input"
          maxlength="4"
          (keyup.enter)="onConfirm()"
          placeholder="****"
        />
        <div class="modal-actions">
          <button class="action-btn cancel" (click)="onCancel()">
            Odustani
          </button>
          <button class="add-btn" (click)="onConfirm()">Potvrdi</button>
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
