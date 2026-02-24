import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class BookingComponent implements OnInit, OnDestroy {
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
  private refreshInterval: any;

  constructor(private bookingService: BookingService) {}

  /* ---------- INIT ---------- */
  ngOnInit(): void {
    this.generateDates();
    this.selectedDate = this.availableDates[0]; // default = danas
    this.loadBookedTimes();
    this.bookingService.cleanupOldBookings(); // Čistimo stare rezervacije pri pokretanju aplikacije

    this.refreshInterval = setInterval(() => {
      this.loadBookedTimes();
    }, 30000);
  }

  ngOnDestroy(): void {
    // Važno: Ugasi interval kada korisnik napusti stranicu
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
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

    const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
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

  get filteredTimes(): string[] {
    const now = new Date();
    const selectedDateObj = new Date(this.selectedDate);
    const today = new Date();

    // Resetujemo sate na 0 da uporedimo samo datume
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);

    // Ako izabrani datum nije danas (već sutra/prekosutra), prikaži sve termine
    if (selectedDateObj.getTime() !== today.getTime()) {
      return this.allTimes;
    }

    // Ako je danas, filtriraj one koji su prošli
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return this.allTimes.filter((time) => {
      const [hour, minute] = time.split(':').map(Number);
      // Prikazujemo termine koji su barem 15 minuta ispred trenutnog vremena
      // (Dajemo korisniku malo vremena da popuni formu)
      if (hour > currentHour) return true;
      if (hour === currentHour && minute > currentMinute + 15) return true;
      return false;
    });
  }
}
