import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent implements OnInit {
  /* ---------- DATUMI ---------- */
  availableDates: string[] = [];
  selectedDate!: string;

  /* ---------- TERMINI ---------- */
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

  /* ---------- USLUGE ---------- */
  services = [
    { label: 'Šišanje', value: 'sisanje', selected: false },
    { label: 'Brijanje', value: 'brijanje', selected: false },
    { label: 'Stilizovanje', value: 'stilizovanje', selected: false },
    { label: 'Trimovanje', value: 'trimovanje', selected: false },
  ];

  /* ---------- PODACI KORISNIKA ---------- */
  name = '';
  phone = '';
  email = '';

  /* ---------- UI STATE ---------- */
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private bookingService: BookingService) {}

  /* ---------- INIT ---------- */
  ngOnInit(): void {
    this.generateDates();
    this.selectedDate = this.availableDates[0]; // default = danas
    this.loadBookedTimes();
  }

  /* ---------- GENERIŠI DANAS + NAREDNA 2 ---------- */
  generateDates() {
    const today = new Date();

    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      this.availableDates.push(date.toISOString().split('T')[0]);
    }
  }

  /* ---------- PROMJENA DATUMA ---------- */
  async onDateChange() {
    this.selectedTime = null;
    await this.loadBookedTimes();
  }

  /* ---------- UČITAJ ZAUZETE TERMINE ---------- */
  async loadBookedTimes() {
    this.bookedTimes = await this.bookingService.getBookedTimesForDate(
      this.selectedDate,
    );
  }

  /* ---------- DA LI JE TERMIN ZAUZET ---------- */
  isTimeBooked(time: string): boolean {
    return this.bookedTimes.includes(time);
  }

  /* ---------- ODABIR TERMINA ---------- */
  selectTime(time: string) {
    if (this.selectedTime === time) {
      this.selectedTime = null;
    } else {
      this.selectedTime = time;
    }
  }

  /* ---------- CHECKBOX USLUGE ---------- */
  toggleService(service: any) {
    service.selected = !service.selected;
  }

  getSelectedServices(): string[] {
    return this.services.filter((s) => s.selected).map((s) => s.label);
  }

  /* ---------- SUBMIT ---------- */
  async submitBooking() {
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

    this.loading = true;

    try {
      const isAvailable = await this.bookingService.isSlotAvailable(
        this.selectedDate,
        this.selectedTime!,
      );
      if (!isAvailable) {
        this.errorMessage = 'Termin je upravo zauzet 😕';
        this.loading = false;
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

      // Postavljamo poruku koja će aktivirati success ekran
      this.successMessage =
        'Poslali smo ti link za potvrdu na ' +
        this.email +
        '. Molimo te da klikneš na link u narednih 15 minuta kako bi osigurao svoj termin.';

      this.resetForm(); // Čistimo polja za sledeći put
    } catch (error) {
      this.errorMessage =
        'Došlo je do greške prilikom čuvanja. Pokušajte ponovo.';
    } finally {
      this.loading = false;
    }
    await this.loadBookedTimes();
  }

  /* ---------- RESET ---------- */
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
}
