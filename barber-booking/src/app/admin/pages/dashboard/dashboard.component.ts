import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Dodaj DatePipe
import { BookingService } from '../../../core/services/booking.service';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule], // CommonModule sadrži NgIf, NgFor i DatePipe
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  bookings: any[] = [];
  selectedDay: string = new Date().toISOString().split('T')[0];
  loading = false;
  readonly SECRET_PIN = '2024';

  constructor(
    private bookingService: BookingService,
    private adminService: AdminService,
  ) {}

  ngOnInit() {
    this.loadAdminBookings();
  }

  // METODA KOJA JE NEDOSTAJALA:
  changeDate(days: number) {
    const d = new Date(this.selectedDay);
    d.setDate(d.getDate() + days);
    this.selectedDay = d.toISOString().split('T')[0];
    this.loadAdminBookings(); // Ponovo učitaj podatke za novi datum
  }

  async loadAdminBookings() {
    this.loading = true;
    try {
      // Usklađeno sa AdminService metodom
      this.bookings = await this.adminService.getBookingsForDate(
        this.selectedDay,
      );
    } catch (error) {
      console.error('Greška:', error);
    } finally {
      this.loading = false;
    }
  }

  private checkAccess(): boolean {
    const pin = prompt('Unesite PIN za autorizaciju akcije:');
    if (pin === this.SECRET_PIN) return true;
    alert('Pogrešan PIN!');
    return false;
  }

  async cancelBooking(id: string) {
    if (this.checkAccess()) {
      if (confirm('Da li ste sigurni da želite da obrišete ovu rezervaciju?')) {
        await this.adminService.deleteBooking(id); // Koristimo adminService
        this.bookings = this.bookings.filter((b) => b.id !== id);
      }
    }
  }

  async quickAdd() {
    if (this.checkAccess()) {
      alert('Otvaram formu za ručno dodavanje...');
      // Ovdje ćemo u sljedećem koraku implementirati modal
    }
  }

  notification = {
    show: false,
    message: '',
    type: 'success', // 'success' ili 'error'
  };

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.notification = { show: true, message: msg, type };

    // Automatski sakrij nakon 3 sekunde
    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }

  copyToClipboard(phone: string) {
    navigator.clipboard
      .writeText(phone)
      .then(() => {
        console.log('broj je kopiran: ' + phone);
        this.showToast('Broj kopiran: ' + phone);
      })
      .catch((err) => {
        console.error('Greška pri kopiranju: ', err);
      });
  }
}
