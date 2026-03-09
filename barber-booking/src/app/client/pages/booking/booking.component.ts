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
import { collection, Firestore, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent implements OnInit, OnDestroy {
  availableDates: string[] = [];
  selectedDate: string = ''; // Inicijalno prazno, popunjava se u ngOnInit
  private refreshInterval: any;
  private midnightCheck: any;
  private lastCheckedDate: string = new Date().toDateString();
  today = new Date();

  allTimes: string[] = [
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

  constructor(
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef,
    private firestore: Firestore,
  ) {}

  async ngOnInit() {
    // 1. Prvo generiši datume i čekaj da završi
    await this.generateDates();

    // 2. Postavi prvi dostupni datum kao selektovan
    if (this.availableDates.length > 0) {
      this.selectedDate = this.availableDates[0];
      // 3. Odmah učitaj termine za taj datum
      await this.loadBookedTimes();
    }

    this.bookingService.cleanupOldBookings();

    this.refreshInterval = setInterval(() => {
      this.loadBookedTimes();
    }, 30000);

    this.setupMidnightTimer();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.midnightCheck) clearInterval(this.midnightCheck);
  }

  async generateDates() {
    try {
      const newDates: string[] = [];
      let tempDate = new Date();

      // Povuci neradne dane iz servisa (bolja praksa)
      const bannedDates = await this.bookingService.getDayOffs();

      tempDate.setHours(0, 0, 0, 0);

      // Tražimo naredna 3 radna dana koji nisu na crnoj listi
      while (newDates.length < 3) {
        const dateStr = tempDate.toLocaleDateString('sv-SE');
        const dayOfWeek = tempDate.getDay();

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 1; // Nedelja i Ponedeljak neradni
        const isBanned = bannedDates.includes(dateStr);

        if (!isWeekend && !isBanned) {
          newDates.push(dateStr);
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }

      this.availableDates = [...newDates];
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Greška kod generisanja datuma:', err);
    }
  }

  async onDateChange() {
    this.selectedTime = null;
    await this.loadBookedTimes();
  }

  async loadBookedTimes() {
    if (!this.selectedDate) return;
    this.bookedTimes = await this.bookingService.getBookedTimesForDate(
      this.selectedDate,
    );
  }

  // Getter koji filtrira termine za prikaz (vodi računa o trenutnom vremenu ako je "danas")
  get filteredTimes(): string[] {
    if (!this.selectedDate) return [];

    const now = new Date();
    const selectedDateObj = new Date(this.selectedDate);
    const todayStr = now.toLocaleDateString('sv-SE');

    // Ako datum nije danas, vrati sve termine
    if (this.selectedDate !== todayStr) {
      return this.allTimes;
    }

    // Ako je danas, filtriraj prošle termine (+15 min lufta)
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return this.allTimes.filter((time) => {
      const [hour, minute] = time.split(':').map(Number);
      if (hour > currentHour) return true;
      if (hour === currentHour && minute > currentMinute + 15) return true;
      return false;
    });
  }

  /* --- OSTATAK LOGIKE (selectTime, submitBooking, itd.) OSTAJE ISTI --- */

  selectTime(time: string) {
    if (this.selectedTime === time) {
      this.selectedTime = null;
    } else {
      this.selectedTime = time;
    }
  }

  toggleService(service: any) {
    service.selected = !service.selected;
  }

  getSelectedServices(): string[] {
    return this.services.filter((s) => s.selected).map((s) => s.label);
  }

  async submitBooking() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedDate || !this.selectedTime) {
      this.errorMessage = 'Odaberi datum i termin';
      return;
    }

    if (
      !this.name.trim() ||
      !this.phone.trim() ||
      !this.isValidEmail(this.email)
    ) {
      this.errorMessage = 'Proverite unos podataka';
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

      this.successMessage =
        'Potvrdite termin putem emaila koji smo vam poslali!';
      this.resetForm();
    } catch (error) {
      this.errorMessage = 'Greška pri čuvanju.';
    } finally {
      this.loading = false;
      await this.loadBookedTimes();
    }
  }

  resetForm() {
    this.selectedTime = null;
    this.name = '';
    this.phone = '';
    this.email = '';
    this.services.forEach((s) => (s.selected = false));
  }

  isValidEmail(email: string): boolean {
    return /\S+@\S+\.\S+/.test(email);
  }

  @HostListener('window:focus')
  onWindowFocus() {
    this.checkAndRefreshDate();
  }

  setupMidnightTimer() {
    this.midnightCheck = setInterval(() => this.checkAndRefreshDate(), 60000);
  }

  private async checkAndRefreshDate() {
    const todayStr = new Date().toDateString();
    if (this.lastCheckedDate !== todayStr) {
      this.lastCheckedDate = todayStr;
      await this.generateDates();
      if (!this.availableDates.includes(this.selectedDate)) {
        this.selectedDate = this.availableDates[0];
        await this.loadBookedTimes();
      }
      this.cdr.detectChanges();
    }
  }

  /* ---------- DA LI JE TERMIN ZAUZET ---------- */
  isTimeBooked(time: string): boolean {
    return this.bookedTimes.includes(time);
  }
}
