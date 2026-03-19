import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-delete-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="modal-content delete-modal">
        <div class="modal-icon">⚠️</div>
        <h3>{{ 'DELETE_MODAL.TITLE' | translate }}</h3>
        <p>{{ 'DELETE_MODAL.MESSAGE' | translate }}</p>
        <div class="modal-actions">
          <button class="action-btn cancel" (click)="cancelled.emit()">
            {{ 'DELETE_MODAL.CANCEL' | translate }}
          </button>
          <button class="action-btn delete-confirm" (click)="confirmed.emit()">
            {{ 'DELETE_MODAL.CONFIRM' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './delete-modal.component.css',
})
export class DeleteModalComponent {
  @Input() visible = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
