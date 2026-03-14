import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { DateNavigatorComponent } from '../../../shared/date-navigator/date-navigator.component';
import {
  ToastComponent,
  ToastState,
} from '../../../shared/toast/toast.component';
import { DeleteModalComponent } from '../../../shared/modals/delete-modal/delete-modal.component';
import {
  QuickAddModalComponent,
  QuickBookingData,
} from '../../../shared/modals/quick-add-modal/quick-add-modal.component';
import {
  Booking,
  BookingListComponent,
} from '../../../shared/booking-list/booking-list.component';
import { AdminService } from '../../../core/services/admin.service';
import { BookingService } from '../../../core/services/booking.service';
import { ALL_TIMES } from '../../../client/pages/booking/booking.component';
import { BookingNotificationComponent } from '../../../shared/booking-notification/booking-notification.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DateNavigatorComponent,
    BookingListComponent,
    ToastComponent,
    DeleteModalComponent,
    QuickAddModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BookingNotificationComponent)
  notifComponent!: BookingNotificationComponent;

  bookings: Booking[] = [];
  loading = false;
  loadError = false;
  selectedDay = new Date().toLocaleDateString('sv-SE');
  isCurrentDayOff = false;
  dayOffs: string[] = [];

  showDeleteModal = false;
  showQuickAddModal = false;
  bookingToDelete: Booking | null = null;

  toast: ToastState = { show: false, message: '', type: 'success' };

  private snapshotUnsub?: () => void;
  private snapshotRetryTimeout?: any;
  private snapshotRetryCount = 0;
  private readonly MAX_RETRIES = 5;

  // Track known booking IDs so we can detect genuinely new ones
  private knownBookingIds = new Set<string>();
  private isFirstSnapshot = true;

  constructor(
    private adminService: AdminService,
    private bookingService: BookingService,
    private firestore: Firestore,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAdminData();
    this.subscribeToBookings();
  }

  ngOnDestroy(): void {
    this.snapshotUnsub?.();
    clearTimeout(this.snapshotRetryTimeout);
  }

  /* ---------- INITIAL DATA LOAD ---------- */
  async loadAdminData(): Promise<void> {
    this.loading = true;
    this.loadError = false;
    this.cdr.markForCheck();

    try {
      this.dayOffs = await this.bookingService.getDayOffs();
      this.isCurrentDayOff = this.dayOffs.includes(this.selectedDay);
    } catch (err) {
      console.error('Greška pri učitavanju podataka:', err);
      this.loadError = true;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async retryLoad(): Promise<void> {
    await this.loadAdminData();
    if (!this.loadError) this.subscribeToBookings();
  }

  /* ---------- REAL-TIME BOOKINGS ---------- */
  private subscribeToBookings(): void {
    this.snapshotUnsub?.();
    clearTimeout(this.snapshotRetryTimeout);
    this.isFirstSnapshot = true;
    this.knownBookingIds.clear();

    const q = query(
      collection(this.firestore, 'bookings'),
      where('date', '==', this.selectedDay),
      where('status', '==', 'confirmed'),
    );

    this.snapshotUnsub = onSnapshot(
      q,
      (snapshot) => {
        this.snapshotRetryCount = 0;

        const incoming = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Booking, 'id'>),
        }));

        if (this.isFirstSnapshot) {
          // First load — just populate known IDs, no notifications
          this.isFirstSnapshot = false;
          incoming.forEach((b) => this.knownBookingIds.add(b.id));
        } else {
          // Subsequent updates — notify for any genuinely new bookings
          incoming.forEach((b) => {
            if (!this.knownBookingIds.has(b.id)) {
              this.knownBookingIds.add(b.id);
              this.notifComponent?.notify({
                id: b.id,
                name: b.name,
                time: b.time,
                services: b.services ?? [],
              });
            }
          });

          // Clean up IDs for deleted bookings
          const incomingIds = new Set(incoming.map((b) => b.id));
          this.knownBookingIds.forEach((id) => {
            if (!incomingIds.has(id)) this.knownBookingIds.delete(id);
          });
        }

        this.bookings = incoming;
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Dashboard snapshot error:', error);
        if (this.snapshotRetryCount < this.MAX_RETRIES) {
          this.snapshotRetryCount++;
          const delay = 5000 * Math.pow(2, this.snapshotRetryCount - 1);
          this.snapshotRetryTimeout = setTimeout(
            () => this.subscribeToBookings(),
            delay,
          );
        } else {
          this.loadError = true;
          this.cdr.markForCheck();
        }
      },
    );
  }

  /* ---------- DATE ---------- */
  async onDateChanged(date: string): Promise<void> {
    this.selectedDay = date;
    this.isCurrentDayOff = this.dayOffs.includes(date);
    this.snapshotRetryCount = 0;
    this.subscribeToBookings();
    this.cdr.markForCheck();
  }

  onDateStepped(direction: number): void {
    const d = new Date(this.selectedDay);
    d.setDate(d.getDate() + direction);
    this.onDateChanged(d.toLocaleDateString('sv-SE'));
  }

  /* ---------- DAY OFF ---------- */
  async toggleDayOff(): Promise<void> {
    try {
      await this.bookingService.toggleDayOff(
        this.selectedDay,
        !this.isCurrentDayOff,
      );
      this.isCurrentDayOff = !this.isCurrentDayOff;
      if (this.isCurrentDayOff) {
        this.dayOffs.push(this.selectedDay);
      } else {
        this.dayOffs = this.dayOffs.filter((d) => d !== this.selectedDay);
      }
      this.showToast('Dan je ažuriran', 'success');
    } catch {
      this.showToast('Greška pri ažuriranju dana', 'error');
    }
    this.cdr.markForCheck();
  }

  /* ---------- DELETE ---------- */
  onDeleteRequested(booking: Booking): void {
    this.bookingToDelete = booking;
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  async onDeleteConfirmed(): Promise<void> {
    if (!this.bookingToDelete) return;
    this.showDeleteModal = false;
    try {
      await this.adminService.deleteBookingAndNotify(this.bookingToDelete.id);
      this.showToast('Termin je obrisan', 'success');
    } catch {
      this.showToast('Greška pri brisanju termina', 'error');
    }
    this.bookingToDelete = null;
    this.cdr.markForCheck();
  }

  onDeleteCancelled(): void {
    this.showDeleteModal = false;
    this.bookingToDelete = null;
    this.cdr.markForCheck();
  }

  /* ---------- QUICK ADD ---------- */
  quickAdd(): void {
    this.showQuickAddModal = true;
    this.cdr.markForCheck();
  }

  async onQuickAddSaved(data: QuickBookingData): Promise<void> {
    this.showQuickAddModal = false;
    try {
      await this.adminService.addBooking({ ...data, date: this.selectedDay });
      this.showToast('Termin je dodan', 'success');
    } catch {
      this.showToast('Greška pri dodavanju termina', 'error');
    }
    this.cdr.markForCheck();
  }

  onQuickAddCancelled(): void {
    this.showQuickAddModal = false;
    this.cdr.markForCheck();
  }

  /* ---------- CALL ---------- */
  onCallCopied(phone: string): void {
    navigator.clipboard
      .writeText(phone)
      .then(() => this.showToast('Broj kopiran', 'success'))
      .catch(() => {});
  }

  /* ---------- AVAILABLE TIMES ---------- */
  get filteredAvailableTimes(): string[] {
    const booked = new Set(this.bookings.map((b) => b.time));
    return ALL_TIMES.filter((t) => !booked.has(t));
  }

  /* ---------- TOAST ---------- */
  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast = { ...this.toast, show: false };
      this.cdr.markForCheck();
    }, 3000);
  }
}
