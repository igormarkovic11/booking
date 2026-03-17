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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    BookingNotificationComponent,
    TranslateModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BookingNotificationComponent, { static: true })
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
  private isFirstSnapshot = true;
  private knownBookingIds = new Set<string>();

  private globalSnapshotUnsub?: () => void;
  private globalKnownIds = new Set<string>();
  private isFirstGlobalSnapshot = true;

  constructor(
    private adminService: AdminService,
    private bookingService: BookingService,
    private firestore: Firestore,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAdminData();
    this.subscribeToBookings();
    this.subscribeToAllBookingsForNotifications();
  }

  ngOnDestroy(): void {
    this.snapshotUnsub?.();
    this.globalSnapshotUnsub?.();
    clearTimeout(this.snapshotRetryTimeout);
  }

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
          this.isFirstSnapshot = false;
          incoming.forEach((b) => this.knownBookingIds.add(b.id));
        } else {
          const incomingIds = new Set(incoming.map((b) => b.id));
          this.knownBookingIds.forEach((id) => {
            if (!incomingIds.has(id)) this.knownBookingIds.delete(id);
          });
          incoming.forEach((b) => this.knownBookingIds.add(b.id));
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

  private subscribeToAllBookingsForNotifications(): void {
    this.globalSnapshotUnsub?.();
    this.isFirstGlobalSnapshot = true;
    this.globalKnownIds.clear();

    const today = new Date().toLocaleDateString('sv-SE');

    const q = query(
      collection(this.firestore, 'bookings'),
      where('date', '>=', today),
      where('status', '==', 'confirmed'),
    );

    this.globalSnapshotUnsub = onSnapshot(q, (snapshot) => {
      if (this.isFirstGlobalSnapshot) {
        this.isFirstGlobalSnapshot = false;
        snapshot.docs.forEach((d) => this.globalKnownIds.add(d.id));
        return;
      }

      snapshot.docs.forEach((d) => {
        if (!this.globalKnownIds.has(d.id)) {
          this.globalKnownIds.add(d.id);
          const data = d.data() as any;
          this.notifComponent?.notify({
            id: d.id,
            name: data.name,
            time: data.time,
            services: data.services ?? [],
          });
        }
      });

      const incomingIds = new Set(snapshot.docs.map((d) => d.id));
      this.globalKnownIds.forEach((id) => {
        if (!incomingIds.has(id)) this.globalKnownIds.delete(id);
      });
    });
  }

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
      this.showToast(this.translate.instant('ADMIN.DAY_UPDATED'), 'success');
    } catch {
      this.showToast(this.translate.instant('ADMIN.ERROR_DAY'), 'error');
    }
    this.cdr.markForCheck();
  }

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
      this.showToast(
        this.translate.instant('ADMIN.APPOINTMENT_DELETED'),
        'success',
      );
    } catch {
      this.showToast(this.translate.instant('ADMIN.ERROR_DELETE'), 'error');
    }
    this.bookingToDelete = null;
    this.cdr.markForCheck();
  }

  onDeleteCancelled(): void {
    this.showDeleteModal = false;
    this.bookingToDelete = null;
    this.cdr.markForCheck();
  }

  quickAdd(): void {
    this.showQuickAddModal = true;
    this.cdr.markForCheck();
  }

  async onQuickAddSaved(data: QuickBookingData): Promise<void> {
    this.showQuickAddModal = false;
    try {
      await this.adminService.addBooking({ ...data, date: this.selectedDay });
      this.showToast(
        this.translate.instant('ADMIN.APPOINTMENT_ADDED'),
        'success',
      );
    } catch {
      this.showToast(this.translate.instant('ADMIN.ERROR_ADD'), 'error');
    }
    this.cdr.markForCheck();
  }

  onQuickAddCancelled(): void {
    this.showQuickAddModal = false;
    this.cdr.markForCheck();
  }

  onCallCopied(phone: string): void {
    navigator.clipboard
      .writeText(phone)
      .then(() =>
        this.showToast(
          this.translate.instant('ADMIN.NUMBER_COPIED'),
          'success',
        ),
      )
      .catch(() => {});
  }

  get filteredAvailableTimes(): string[] {
    const booked = new Set(this.bookings.map((b) => b.time));
    return ALL_TIMES.filter((t) => !booked.has(t));
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast = { ...this.toast, show: false };
      this.cdr.markForCheck();
    }, 3000);
  }
}
