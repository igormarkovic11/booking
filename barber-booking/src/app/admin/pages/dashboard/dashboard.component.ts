import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Dodaj DatePipe
import { AdminService } from '../../../core/services/admin.service';
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

  // Modali state
  showPinModal = false;
  showDeleteModal = false;
  showQuickAddModal = false; // Dodato za formu

  tempPin = '';
  bookingToDeleteId: string | null = null;
  pendingAction: (() => void) | null = null;

  notification = { show: false, message: '', type: 'success' };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadAdminBookings();
  }

  // --- LOGIKA ZA PIN ---
  runWithPin(action: () => void) {
    this.pendingAction = action;
    this.showPinModal = true;
  }

  async confirmActionWithPin() {
    this.loading = true;
    const isValid = await this.adminService.verifyPin(this.tempPin);

    if (isValid) {
      if (this.pendingAction) {
        await this.pendingAction(); // Izvršavamo akciju
      }
      this.showToast('Autorizacija uspješna');
      this.closePinModal();
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

  // --- BRISANJE (Bez confirm() alerta) ---
  confirmDelete(id: string) {
    this.bookingToDeleteId = id;
    this.showDeleteModal = true;
  }

  async executeDelete() {
    if (!this.bookingToDeleteId) return;

    const idToProcess = this.bookingToDeleteId; // Čuvamo ID lokalno

    // 1. ZATVORI prvi modal odmah da ne smeta
    this.closeDeleteModal();

    // 2. OTVORI PIN modal
    this.runWithPin(async () => {
      try {
        await this.adminService.deleteBooking(idToProcess);
        this.bookings = this.bookings.filter((b) => b.id !== idToProcess);
        this.showToast('Termin uspješno obrisan');
      } catch (error) {
        this.showToast('Greška pri brisanju', 'error');
      }
    });
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.bookingToDeleteId = null;
  }

  // --- OSTALE METODE ---
  async loadAdminBookings() {
    this.loading = true;
    try {
      this.bookings = await this.adminService.getBookingsForDate(
        this.selectedDay,
      );
    } catch (error) {
      this.showToast('Greška pri učitavanju', 'error');
    } finally {
      this.loading = false;
    }
  }

  changeDate(days: number) {
    const d = new Date(this.selectedDay);
    d.setDate(d.getDate() + days);
    this.selectedDay = d.toISOString().split('T')[0];
    this.loadAdminBookings();
  }

  showToast(msg: string, type: string = 'success') {
    this.notification = { show: true, message: msg, type };
    setTimeout(() => (this.notification.show = false), 3000);
  }

  copyToClipboard(phone: string) {
    navigator.clipboard.writeText(phone).then(() => {
      this.showToast('Broj kopiran: ' + phone);
    });
  }

  availableTimes = [
    '08:00',
    '08:30',
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
  allServices = ['Šišanje', 'Brijanje', 'Stilizovanje', 'Trimovanje'];

  newBooking = {
    name: '',
    phone: '',
    time: '',
    services: [] as string[],
  };

  // Getter koji filtrira termine: izbacuje one koji su već rezervisani
  get filteredAvailableTimes() {
    const bookedTimes = this.bookings.map((b) => b.time);
    return this.availableTimes.filter((t) => !bookedTimes.includes(t));
  }

  // Otvara PIN proveru, pa ako prođe, otvara Quick Add modal
  quickAdd() {
    this.runWithPin(() => {
      this.showQuickAddModal = true;
    });
  }

  toggleService(service: string) {
    const index = this.newBooking.services.indexOf(service);
    if (index > -1) {
      this.newBooking.services.splice(index, 1);
    } else {
      this.newBooking.services.push(service);
    }
  }

  async saveQuickBooking() {
    if (!this.newBooking.name || !this.newBooking.time) {
      this.showToast('Ime i vrijeme su obavezni!', 'error');
      return;
    }

    this.loading = true;
    try {
      const bookingData = {
        ...this.newBooking,
        date: this.selectedDay,
        status: 'confirmed', // Admin odmah potvrđuje
        createdAt: new Date(),
      };

      await this.adminService.addBooking(bookingData);
      this.showToast('Termin uspješno dodat!');
      this.loadAdminBookings(); // Osveži listu na ekranu
      this.closeQuickAdd();
    } catch (error) {
      this.showToast('Greška pri čuvanju', 'error');
    } finally {
      this.loading = false;
    }
  }

  closeQuickAdd() {
    this.showQuickAddModal = false;
    this.newBooking = { name: '', phone: '', time: '', services: [] };
  }
}
