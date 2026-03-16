import {
  Component,
  OnDestroy,
  OnInit,
  HostListener,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  query,
  where,
  onSnapshot,
} from '@angular/fire/firestore';
import { BookingService } from '../../../core/services/booking.service';
import { DateSelectorComponent } from './date-selector/date-selector.component';
import { TimeSelectorComponent } from './time-selector/time-selector.component';
import {
  ServiceSelectorComponent,
  Service,
} from './service-selector/service-selector.component';
import {
  BookingFormComponent,
  BookingFormData,
} from './booking-form/booking-form.component';
import { SuccessMessageComponent } from './success-message/success-message.component';

export const ALL_TIMES: string[] = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

const SNAPSHOT_RETRY_DELAY_MS = 5000;
const MAX_SNAPSHOT_RETRIES = 5;

@Component({
  selector: 'app-booking',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DateSelectorComponent,
    TimeSelectorComponent,
    ServiceSelectorComponent,
    BookingFormComponent,
    SuccessMessageComponent,
  ],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent implements OnInit, OnDestroy {
  @ViewChild(BookingFormComponent) bookingForm!: BookingFormComponent;

  availableDates: string[] = [];
  selectedDate = '';
  bookedTimes: string[] = [];
  selectedTime: string | null = null;

  services: Service[] = [
    { label: 'Šišanje', value: 'sisanje', selected: false },
    { label: 'Brijanje', value: 'brijanje', selected: false },
    { label: 'Stilizovanje', value: 'stilizovanje', selected: false },
    { label: 'Trimovanje', value: 'trimovanje', selected: false },
  ];

  loading = false;
  errorMessage = '';
  successMessage = '';
  snapshotError = false;

  private snapshotUnsub?: () => void;
  private snapshotRetryTimeout?: any;
  private snapshotRetryCount = 0;
  private midnightInterval: any;
  private lastCheckedDate = new Date().toDateString();

  constructor(
    private bookingService: BookingService,
    private firestore: Firestore,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    // Auth and dayoffs are already preloaded by AppComponent
    // so generateDates() hits sessionStorage cache immediately
    this.bookingService.cleanupOldBookings().catch(() => {});
    await this.generateDates();

    if (this.availableDates.length > 0) {
      this.selectedDate = this.availableDates[0];
      this.subscribeToBookedTimes();
    }

    this.setupMidnightTimer();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    this.snapshotUnsub?.();
    clearTimeout(this.snapshotRetryTimeout);
    clearInterval(this.midnightInterval);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  /* ---------- REAL-TIME LISTENER ---------- */
  private subscribeToBookedTimes(): void {
    this.snapshotUnsub?.();
    clearTimeout(this.snapshotRetryTimeout);
    this.snapshotError = false;

    const q = query(
      collection(this.firestore, 'bookings'),
      where('date', '==', this.selectedDate),
    );

    this.snapshotUnsub = onSnapshot(
      q,
      (snapshot) => {
        this.snapshotRetryCount = 0;
        this.snapshotError = false;

        const now = new Date();
        this.bookedTimes = snapshot.docs
          .map((doc) => {
            const data = doc.data() as any;
            const createdAt = data.createdAt?.toDate?.() ?? new Date();
            const diffMinutes =
              (now.getTime() - createdAt.getTime()) / 1000 / 60;
            if (
              data.status === 'confirmed' ||
              (data.status === 'pending' && diffMinutes < 15)
            )
              return data.time;
            return null;
          })
          .filter((t): t is string => t !== null);

        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Snapshot error:', error);
        if (this.snapshotRetryCount < MAX_SNAPSHOT_RETRIES) {
          this.snapshotRetryCount++;
          const delay =
            SNAPSHOT_RETRY_DELAY_MS * Math.pow(2, this.snapshotRetryCount - 1);
          this.snapshotRetryTimeout = setTimeout(
            () => this.subscribeToBookedTimes(),
            delay,
          );
        } else {
          this.snapshotError = true;
          this.cdr.markForCheck();
        }
      },
    );
  }

  retrySnapshot(): void {
    this.snapshotRetryCount = 0;
    this.subscribeToBookedTimes();
  }

  /* ---------- VISIBILITY ---------- */
  private onVisibilityChange = async (): Promise<void> => {
    if (document.visibilityState !== 'visible') return;
    this.snapshotRetryCount = 0;
    if (this.selectedDate) this.subscribeToBookedTimes();
    await this.generateDates();
    this.cdr.markForCheck();
  };

  /* ---------- DATUMI ---------- */
  async generateDates(): Promise<void> {
    try {
      const bannedDates = await this.bookingService.getDayOffs();
      const newDates: string[] = [];
      const temp = new Date();
      temp.setHours(0, 0, 0, 0);

      while (newDates.length < 3) {
        const dateStr = temp.toLocaleDateString('sv-SE');
        const day = temp.getDay();
        if (day !== 0 && day !== 1 && !bannedDates.includes(dateStr)) {
          newDates.push(dateStr);
        }
        temp.setDate(temp.getDate() + 1);
      }

      this.availableDates = newDates;
    } catch (err) {
      console.error('Greška pri generisanju datuma:', err);
    }
  }

  async onDateChanged(date: string): Promise<void> {
    this.selectedDate = date;
    this.selectedTime = null;
    this.snapshotRetryCount = 0;
    this.subscribeToBookedTimes();
  }

  /* ---------- TERMINI ---------- */
  get filteredTimes(): string[] {
    if (!this.selectedDate) return [];
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE');
    if (this.selectedDate !== todayStr) return ALL_TIMES;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    return ALL_TIMES.filter((time) => {
      const [hour, minute] = time.split(':').map(Number);
      return (
        hour > currentHour ||
        (hour === currentHour && minute > currentMinute + 15)
      );
    });
  }

  /* ---------- USLUGE ---------- */
  onServiceToggled(service: Service): void {
    service.selected = !service.selected;
  }

  getSelectedServices(): string[] {
    return this.services.filter((s) => s.selected).map((s) => s.label);
  }

  /* ---------- SUBMIT ---------- */
  async onFormSubmitted(formData: BookingFormData): Promise<void> {
    this.errorMessage = '';

    if (!this.selectedDate || !this.selectedTime) {
      this.errorMessage = 'Odaberi datum i termin';
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const MAX_RETRIES = 2;
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      try {
        const isAvailable = await this.bookingService.isSlotAvailable(
          this.selectedDate,
          this.selectedTime!,
        );

        if (!isAvailable) {
          this.errorMessage = 'Termin je upravo zauzet 😕';
          break;
        }

        await this.bookingService.createBooking({
          date: this.selectedDate,
          time: this.selectedTime!,
          services: this.getSelectedServices(),
          ...formData,
        });

        this.successMessage = `Poslali smo ti link za potvrdu na ${formData.email}. Molimo te da klikneš na link u narednih 15 minuta kako bi osigurao svoj termin.`;
        this.resetForm();
        break;
      } catch (error: any) {
        attempt++;
        if (attempt > MAX_RETRIES) {
          this.errorMessage = !navigator.onLine
            ? 'Nema internet konekcije. Provjeri mrežu i pokušaj ponovo.'
            : 'Došlo je do greške. Pokušajte ponovo.';
        } else {
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }

    this.loading = false;
    this.cdr.markForCheck();
  }

  onSuccessClosed(): void {
    this.successMessage = '';
  }

  get canSubmit(): boolean {
    return !!this.selectedTime;
  }

  isValidEmail(email: string): boolean {
    return /\S+@\S+\.\S+/.test(email);
  }

  resetForm(): void {
    this.selectedTime = null;
    this.services.forEach((s) => (s.selected = false));
    this.bookingForm?.reset();
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.checkAndRefreshDate();
  }

  private setupMidnightTimer(): void {
    this.midnightInterval = setInterval(
      () => this.checkAndRefreshDate(),
      60000,
    );
  }

  private async checkAndRefreshDate(): Promise<void> {
    const todayStr = new Date().toDateString();
    if (this.lastCheckedDate === todayStr) return;
    this.lastCheckedDate = todayStr;
    await this.generateDates();
    if (!this.availableDates.includes(this.selectedDate)) {
      this.selectedDate = this.availableDates[0];
      this.subscribeToBookedTimes();
    }
    this.cdr.markForCheck();
  }
}
