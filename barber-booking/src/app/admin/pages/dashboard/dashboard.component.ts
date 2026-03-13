import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  // Koristimo inject umjesto konstruktora za stabilniji rad sa Firebase-om
  private adminService = inject(AdminService);

  bookings: any[] = [];
  selectedDay: string = new Date().toISOString().split('T')[0];
  loading = false;
  isCurrentDayOff = false;

  // Modali state
  showPinModal = false;
  showDeleteModal = false;
  showQuickAddModal = false;

  tempPin = '';
  selectedBooking: any = null;
  pendingAction: (() => void) | null = null;
  notification = { show: false, message: '', type: 'success' };

  // Podaci za formu
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
    email: '',
    time: '',
    services: [] as string[],
  };

  ngOnInit() {
    this.loadAdminData();
  }

  // Glavna funkcija koja osvježava sve na promjenu datuma
  async loadAdminData() {
    this.loading = true;
    try {
      // 1. Učitaj rezervacije
      this.bookings = await this.adminService.getBookingsForDate(
        this.selectedDay,
      );
      // 2. Provjeri da li je taj dan neradni u bazi
      this.isCurrentDayOff = await this.adminService.checkIfDayOff(
        this.selectedDay,
      );
    } catch (error) {
      this.showToast('Greška pri učitavanju podataka', 'error');
    } finally {
      this.loading = false;
    }
  }

  // --- NAVIGACIJA ---
  changeDate(days: number) {
    const d = new Date(this.selectedDay);
    d.setDate(d.getDate() + days);
    this.selectedDay = d.toISOString().split('T')[0];
    this.loadAdminData();
  }

  onDateChange() {
    this.loadAdminData();
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
        try {
          await this.pendingAction();
        } catch (e) {
          this.showToast('Greška pri izvršavanju!', 'error');
        }
      }
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

  // --- NERADNI DAN (DAY OFF) ---
  async toggleDayOff() {
    this.runWithPin(async () => {
      try {
        const newState = !this.isCurrentDayOff;
        await this.adminService.toggleDayOff(this.selectedDay, newState);
        this.isCurrentDayOff = newState;
        this.showToast(newState ? 'Dan je zatvoren' : 'Dan je ponovo otvoren');
      } catch (e) {
        this.showToast('Greška pri promeni statusa dana', 'error');
      }
    });
  }

  // --- REZERVACIJE (DODAVANJE I BRISANJE) ---
  quickAdd() {
    this.runWithPin(() => {
      this.showQuickAddModal = true;
      document.body.style.overflow = 'hidden'; // DODAJ OVO
    });
  }

  async saveQuickBooking() {
    if (!this.newBooking.name || !this.newBooking.time) {
      this.showToast('Ime i vrijeme su obavezni!', 'error');
      return;
    }

    this.loading = true;
    try {
      await this.adminService.addBooking({
        ...this.newBooking,
        date: this.selectedDay,
        status: 'confirmed',
      });
      this.showToast('Termin uspješno dodat!');
      await this.loadAdminData();
      this.closeQuickAdd();
    } catch (error) {
      this.showToast('Greška pri čuvanju', 'error');
    } finally {
      this.loading = false;
    }
  }

  confirmDelete(booking: any) {
    this.selectedBooking = booking;
    this.showDeleteModal = true;
  }

  async executeDelete() {
    if (!this.selectedBooking) return;
    const bookingToProcess = this.selectedBooking;
    this.closeDeleteModal();

    this.runWithPin(async () => {
      await this.adminService.deleteBookingAndNotify(bookingToProcess);
      this.bookings = this.bookings.filter((b) => b.id !== bookingToProcess.id);
      this.showToast('Termin obrisan');
    });
  }

  // --- POMOĆNE METODE ---
  get filteredAvailableTimes() {
    const bookedTimes = this.bookings.map((b) => b.time);
    return this.availableTimes.filter((t) => !bookedTimes.includes(t));
  }

  toggleService(service: string) {
    const index = this.newBooking.services.indexOf(service);
    if (index > -1) {
      this.newBooking.services.splice(index, 1);
    } else {
      this.newBooking.services.push(service);
    }
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedBooking = null;
  }

  closeQuickAdd() {
    this.showQuickAddModal = false;
    document.body.style.overflow = 'auto'; // DODAJ OVO
    this.newBooking = {
      name: '',
      phone: '',
      email: '',
      time: '',
      services: [],
    };
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
}
