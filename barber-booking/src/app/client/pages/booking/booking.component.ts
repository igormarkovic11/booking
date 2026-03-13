import {
  Component,
  OnDestroy,
  OnInit,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { fromEvent, Subscription } from 'rxjs';

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

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent implements OnInit, OnDestroy {
  availableDates: string[] = [];
  selectedDate = '';
  today = new Date();

  allTimes = ALL_TIMES;
  bookedTimes: string[] = [];
  selectedTime: string | null = null;

  services = [
    { label: 'Šišanje', value: 'sisanje', selected: false },
    { label: 'Brijanje', value: 'brijanje', selected: false },
    { label: 'Stilizovanje', value: 'stilizovanje', selected: false },
    { label: 'Trimovanje', value: 'trimovanje', selected: false },
  ];

  name = '';
  phone = '';
  email = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  private refreshInterval: any;
  private midnightInterval: any;
  private visibilitySub!: Subscription;
  private lastCheckedDate = new Date().toDateString();

  constructor(
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.bookingService.cleanupOldBookings();
    await this.generateDates();

    if (this.availableDates.length > 0) {
      this.selectedDate = this.availableDates[0];
      this.loadBookedTimes();
    }

    this.refreshInterval = setInterval(() => this.loadBookedTimes(), 30000);
    this.setupMidnightTimer();

    this.visibilitySub = fromEvent(document, 'visibilitychange').subscribe(
      () => {
        if (document.visibilityState === 'visible') {
          this.loadBookedTimes();
          this.generateDates();
        }
      },
    );
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
    clearInterval(this.midnightInterval);
    this.visibilitySub?.unsubscribe();
  }

  async generateDates(): Promise<void> {
    try {
      const bannedDates = await this.bookingService.getDayOffs();
      const newDates: string[] = [];
      const temp = new Date();
      temp.setHours(0, 0, 0, 0);

      while (newDates.length < 3) {
        const dateStr = temp.toLocaleDateString('sv-SE');
        const day = temp.getDay();
        const isWeekend = day === 0 || day === 1;

        if (!isWeekend && !bannedDates.includes(dateStr)) {
          newDates.push(dateStr);
        }
        temp.setDate(temp.getDate() + 1);
      }

      this.availableDates = newDates;
    } catch (err) {
      console.error('Greška pri generisanju datuma:', err);
    }
  }

  async onDateChange(): Promise<void> {
    this.selectedTime = null;
    await this.loadBookedTimes();
  }

  async loadBookedTimes(): Promise<void> {
    if (!this.selectedDate) return;
    this.bookedTimes = await this.bookingService.getBookedTimesForDate(
      this.selectedDate,
    );
  }

  get filteredTimes(): string[] {
    if (!this.selectedDate) return [];

    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE');

    if (this.selectedDate !== todayStr) return this.allTimes;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return this.allTimes.filter((time) => {
      const [hour, minute] = time.split(':').map(Number);
      return (
        hour > currentHour ||
        (hour === currentHour && minute > currentMinute + 15)
      );
    });
  }

  selectTime(time: string): void {
    this.selectedTime = this.selectedTime === time ? null : time;
  }

  toggleService(service: { selected: boolean }): void {
    service.selected = !service.selected;
  }

  getSelectedServices(): string[] {
    return this.services.filter((s) => s.selected).map((s) => s.label);
  }

  isTimeBooked(time: string): boolean {
    return this.bookedTimes.includes(time);
  }

  isValidEmail(email: string): boolean {
    return /\S+@\S+\.\S+/.test(email);
  }

  async submitBooking(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedDate || !this.selectedTime) {
      this.errorMessage = 'Odaberi datum i termin';
      return;
    }
    if (!this.name.trim() || !this.phone.trim()) {
      this.errorMessage = 'Unesi ime i broj telefona';
      return;
    }
    if (!this.email.trim() || !this.isValidEmail(this.email)) {
      this.errorMessage = 'Unesi validan email';
      return;
    }

    const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/;
    if (this.phone.trim().length < 9 || !phoneRegex.test(this.phone)) {
      this.errorMessage = 'Unesite ispravan broj telefona (min. 9 cifara)';
      return;
    }

    this.loading = true;

    try {
      const isAvailable = await this.bookingService.isSlotAvailable(
        this.selectedDate,
        this.selectedTime!,
      );

      if (!isAvailable) {
        this.errorMessage = 'Termin je upravo zauzet 😕';
        return;
      }

      await this.bookingService.createBooking({
        date: this.selectedDate,
        time: this.selectedTime!,
        services: this.getSelectedServices(),
        name: this.name,
        phone: this.phone,
        email: this.email,
      });

      this.successMessage = `Poslali smo ti link za potvrdu na ${this.email}. Molimo te da klikneš na link u narednih 15 minuta kako bi osigurao svoj termin.`;
      this.resetForm();
    } catch (error) {
      console.error('Greška pri čuvanju:', error);
      this.errorMessage = 'Došlo je do greške. Pokušajte ponovo.';
    } finally {
      this.loading = false;
      await this.loadBookedTimes();
    }
  }

  resetForm(): void {
    this.selectedTime = null;
    this.name = '';
    this.phone = '';
    this.email = '';
    this.services.forEach((s) => (s.selected = false));
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
      await this.loadBookedTimes();
    }
    this.cdr.detectChanges();
  }
}
