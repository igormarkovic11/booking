import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  time: string;
  date: string;
  services: string[];
}

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bookings-list">
      <div *ngIf="loading" class="loader">
        {{ 'ADMIN.LOADING' | translate }}
      </div>

      <div class="no-data" *ngIf="!loading && bookings.length === 0">
        {{ 'ADMIN.NO_BOOKINGS' | translate }}
      </div>

      <div class="booking-row" *ngFor="let b of bookings; trackBy: trackById">
        <div class="time-box">{{ b.time }}</div>
        <div class="info-box">
          <span class="client-name">{{ b.name }}</span>
          <span class="client-services">{{ b.services.join(', ') }}</span>
        </div>
        <div class="actions-box">
          <a
            [href]="'tel:' + b.phone"
            class="action-btn call"
            (click)="onCall(b.phone)"
            [title]="'ADMIN.NUMBER_COPIED' | translate"
            >📞</a
          >
          <button (click)="delete.emit(b)" class="action-btn delete">🗑️</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './booking-list.component.css',
})
export class BookingListComponent {
  @Input() bookings: Booking[] = [];
  @Input() loading = false;
  @Output() delete = new EventEmitter<Booking>();
  @Output() call = new EventEmitter<string>();

  trackById(_: number, booking: Booking): string {
    return booking.id;
  }

  onCall(phone: string): void {
    this.call.emit(phone);
  }
}
