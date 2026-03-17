import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface QuickBookingData {
  name: string;
  phone: string;
  email: string;
  time: string;
  services: string[];
}

@Component({
  selector: 'app-quick-add-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="modal-content quick-add-modal">
        <h3>{{ 'QUICK_ADD_MODAL.TITLE' | translate }}</h3>

        <label class="input-label">{{
          'QUICK_ADD.CLIENT_NAME' | translate
        }}</label>
        <input
          type="text"
          [(ngModel)]="booking.name"
          class="admin-input-field"
          [placeholder]="'QUICK_ADD.NAME_PLACEHOLDER' | translate"
        />

        <label class="input-label">{{ 'QUICK_ADD.PHONE' | translate }}</label>
        <input
          type="tel"
          [(ngModel)]="booking.phone"
          class="admin-input-field"
          placeholder="06x..."
        />

        <label class="input-label">{{ 'QUICK_ADD.EMAIL' | translate }}</label>
        <input
          type="email"
          [(ngModel)]="booking.email"
          class="admin-input-field"
          placeholder="klijent@mail.com"
        />

        <label class="input-label">{{
          'QUICK_ADD.SELECT_TIME' | translate
        }}</label>
        <div class="time-grid">
          <button
            *ngFor="let t of availableTimes"
            [class.selected]="booking.time === t"
            (click)="booking.time = t"
            class="time-chip"
          >
            {{ t }}
          </button>
        </div>

        <label class="input-label">{{
          'QUICK_ADD.SERVICES' | translate
        }}</label>
        <div class="service-chips">
          <button
            *ngFor="let s of allServices"
            [class.active]="booking.services.includes(s)"
            (click)="toggleService(s)"
            class="service-chip"
          >
            {{ getServiceLabel(s) }}
          </button>
        </div>

        <div class="modal-actions">
          <button class="action-btn cancel" (click)="onCancel()">
            {{ 'QUICK_ADD_MODAL.CANCEL' | translate }}
          </button>
          <button class="add-btn" (click)="onSave()">
            {{ 'QUICK_ADD_MODAL.CONFIRM' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './quick-add-modal.component.css',
})
export class QuickAddModalComponent implements OnChanges, OnInit {
  @Input() visible = false;
  @Input() availableTimes: string[] = [];
  @Output() saved = new EventEmitter<QuickBookingData>();
  @Output() cancelled = new EventEmitter<void>();
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  allServices = ['haircut', 'shave', 'styling', 'trim'];
  serviceLabels: Record<string, string> = {};
  booking: QuickBookingData = this.emptyBooking();

  ngOnInit(): void {
    this.loadServiceLabels();
    this.translate.onLangChange.subscribe(() => this.loadServiceLabels());
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset form every time the modal opens
    if (changes['visible']?.currentValue === true) {
      this.booking = this.emptyBooking();
    }
  }

  toggleService(service: string): void {
    const index = this.booking.services.indexOf(service);
    if (index > -1) {
      this.booking.services.splice(index, 1);
    } else {
      this.booking.services.push(service);
    }
  }

  onSave(): void {
    this.saved.emit({ ...this.booking, services: [...this.booking.services] });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private emptyBooking(): QuickBookingData {
    return { name: '', phone: '', email: '', time: '', services: [] };
  }

  private loadServiceLabels(): void {
    const keys = this.allServices.map(
      (s) => 'BOOKING.SERVICES.' + s.toUpperCase(),
    );
    this.translate.get(keys).subscribe((translations) => {
      this.serviceLabels = this.allServices.reduce(
        (acc, s) => {
          acc[s] = translations['BOOKING.SERVICES.' + s.toUpperCase()];
          return acc;
        },
        {} as Record<string, string>,
      );
      this.cdr.markForCheck();
    });
  }

  getServiceLabel(value: string): string {
    return this.serviceLabels[value] ?? value;
  }
}
