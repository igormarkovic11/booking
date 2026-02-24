import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Dodaj DatePipe
import { BookingService } from '../../../core/services/booking.service';
import { AdminService } from '../../../core/services/admin.service';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule], // CommonModule sadrži NgIf, NgFor i DatePipe
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  bookings: any[] = [];
  selectedDay: string = new Date().toISOString().split('T')[0];
  loading = false;
  showPinModal = false;
  tempPin = '';
  pendingAction: (() => void) | null = null; // Ovde čuvamo šta je frizer hteo da uradi

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

  // Umesto checkAccess(), sada koristimo ovo:
  runWithPin(action: () => void) {
    this.pendingAction = action;
    this.showPinModal = true;
  }

  async confirmActionWithPin() {
    this.loading = true; // Pokaži neki loader

    // Pitamo bazu, a ne naš kod!
    const isValid = await this.adminService.verifyPin(this.tempPin);

    if (isValid) {
      if (this.pendingAction) this.pendingAction();
      this.closePinModal();
      this.showToast('Autorizacija uspešna');
    } else {
      this.showToast('Pogrešan PIN!', 'error');
      this.tempPin = '';
    }
    this.loading = false;
  }

  closePinModal() {
    this.showPinModal = false;
    this.tempPin = '';
    this.pendingAction = null;
  }

  async cancelBooking(id: string) {
    this.runWithPin(async () => {
      if (confirm('Obrisati termin?')) {
        await this.adminService.deleteBooking(id);
        this.bookings = this.bookings.filter((b) => b.id !== id);
        this.showToast('Termin obrisan');
      }
    });
  }

  // async quickAdd() {
  //   if (this.checkAccess()) {
  //     alert('Otvaram formu za ručno dodavanje...');
  //     // Ovdje ćemo u sljedećem koraku implementirati modal
  //   }
  // }

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
