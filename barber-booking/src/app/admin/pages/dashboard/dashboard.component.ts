import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PinModalComponent } from '../../../shared/modals/pin-modal/pin-modal.component';
import { DeleteModalComponent } from '../../../shared/modals/delete-modal/delete-modal.component';
import {
  QuickAddModalComponent,
  QuickBookingData,
} from '../../../shared/modals/quick-add-modal/quick-add-modal.component';
import { ALL_TIMES } from '../../../client/pages/booking/booking.component';

interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  time: string;
  date: string;
  services: string[];
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PinModalComponent,
    DeleteModalComponent,
    QuickAddModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);

  bookings: Booking[] = [];
  selectedDay = new Date().toISOString().split('T')[0];
  loading = false;
  isCurrentDayOff = false;

  showPinModal = false;
  showDeleteModal = false;
  showQuickAddModal = false;

  selectedBooking: Booking | null = null;
  pendingAction: (() => void) | null = null;
  notification: Notification = { show: false, message: '', type: 'success' };

  availableTimes = ALL_TIMES;

  ngOnInit(): void {
    this.loadAdminData();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = 'auto';
  }

  async loadAdminData(): Promise<void> {
    this.loading = true;
    try {
      [this.bookings, this.isCurrentDayOff] = await Promise.all([
        this.adminService.getBookingsForDate(this.selectedDay),
        this.adminService.checkIfDayOff(this.selectedDay),
      ]);
    } catch {
      this.showToast('Greška pri učitavanju podataka', 'error');
    } finally {
      this.loading = false;
    }
  }

  /* ---------- NAVIGACIJA ---------- */
  changeDate(days: number): void {
    const d = new Date(this.selectedDay);
    d.setDate(d.getDate() + days);
    this.selectedDay = d.toISOString().split('T')[0];
    this.loadAdminData();
  }

  onDateChange(): void {
    this.loadAdminData();
  }

  /* ---------- PIN ---------- */
  runWithPin(action: () => void): void {
    this.pendingAction = action;
    this.showPinModal = true;
  }

  async onPinConfirmed(pin: string): Promise<void> {
    this.loading = true;
    const isValid = await this.adminService.verifyPin(pin);

    if (isValid) {
      try {
        await this.pendingAction?.();
      } catch {
        this.showToast('Greška pri izvršavanju!', 'error');
      }
      this.showPinModal = false;
      this.pendingAction = null;
    } else {
      this.showToast('Pogrešan PIN!', 'error');
    }
    this.loading = false;
  }

  onPinCancelled(): void {
    this.showPinModal = false;
    this.pendingAction = null;
  }

  /* ---------- NERADNI DAN ---------- */
  toggleDayOff(): void {
    this.runWithPin(async () => {
      const newState = !this.isCurrentDayOff;
      await this.adminService.toggleDayOff(this.selectedDay, newState);
      this.isCurrentDayOff = newState;
      this.showToast(newState ? 'Dan je zatvoren' : 'Dan je ponovo otvoren');
    });
  }

  /* ---------- DODAVANJE ---------- */
  quickAdd(): void {
    this.runWithPin(() => {
      this.showQuickAddModal = true;
      document.body.style.overflow = 'hidden';
    });
  }

  async onQuickAddSaved(data: QuickBookingData): Promise<void> {
    if (!data.name || !data.time) {
      this.showToast('Ime i vrijeme su obavezni!', 'error');
      return;
    }

    this.loading = true;
    try {
      await this.adminService.addBooking({
        ...data,
        date: this.selectedDay,
        status: 'confirmed',
      });
      this.showToast('Termin uspješno dodat!');
      await this.loadAdminData();
      this.onQuickAddCancelled();
    } catch {
      this.showToast('Greška pri čuvanju', 'error');
    } finally {
      this.loading = false;
    }
  }

  onQuickAddCancelled(): void {
    this.showQuickAddModal = false;
    document.body.style.overflow = 'auto';
  }

  /* ---------- BRISANJE ---------- */
  confirmDelete(booking: Booking): void {
    this.selectedBooking = booking;
    this.showDeleteModal = true;
  }

  onDeleteCancelled(): void {
    this.showDeleteModal = false;
    this.selectedBooking = null;
  }

  async onDeleteConfirmed(): Promise<void> {
    if (!this.selectedBooking) return;
    const booking = this.selectedBooking;
    this.onDeleteCancelled();

    this.runWithPin(async () => {
      await this.adminService.deleteBookingAndNotify(booking);
      this.bookings = this.bookings.filter((b) => b.id !== booking.id);
      this.showToast('Termin obrisan');
    });
  }

  /* ---------- POMOĆNE METODE ---------- */
  get filteredAvailableTimes(): string[] {
    const bookedTimes = new Set(this.bookings.map((b) => b.time));
    return this.availableTimes.filter((t) => !bookedTimes.has(t));
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.notification = { show: true, message, type };
    setTimeout(() => (this.notification.show = false), 3000);
  }

  copyToClipboard(phone: string): void {
    navigator.clipboard.writeText(phone).then(() => {
      this.showToast('Broj kopiran: ' + phone);
    });
  }
}
