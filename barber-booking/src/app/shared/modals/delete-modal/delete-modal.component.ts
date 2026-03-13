import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="modal-content delete-modal">
        <div class="modal-icon">⚠️</div>
        <h3>Brisanje termina</h3>
        <p>
          Jeste li sigurni? Klijent će dobiti email obaveštenje o otkazivanju.
        </p>
        <div class="modal-actions">
          <button class="action-btn cancel" (click)="cancelled.emit()">
            Odustani
          </button>
          <button class="action-btn delete-confirm" (click)="confirmed.emit()">
            Obriši
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
