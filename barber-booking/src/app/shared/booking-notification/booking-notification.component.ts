import {
  Component,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BookingNotification {
  id: string;
  name: string;
  time: string;
  services: string[];
}

@Component({
  selector: 'app-booking-notification',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notifications-container">
      <div
        *ngFor="let n of notifications; trackBy: trackById"
        class="notification-card"
        [class.hiding]="hidingIds.has(n.id)"
      >
        <div class="notif-header">
          <span class="notif-icon">✂️</span>
          <span class="notif-title">Nova rezervacija!</span>
          <button class="notif-close" (click)="dismiss(n.id)">✕</button>
        </div>
        <div class="notif-body">
          <p class="notif-name">{{ n.name }}</p>
          <p class="notif-detail">🕐 {{ n.time }}</p>
          <p class="notif-detail" *ngIf="n.services.length > 0">
            💈 {{ n.services.join(', ') }}
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './booking-notification.component.css',
})
export class BookingNotificationComponent implements OnDestroy {
  notifications: BookingNotification[] = [];
  hidingIds = new Set<string>();

  private timers = new Map<string, any>();
  private audioCtx: AudioContext | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.audioCtx?.close();
  }

  notify(notification: BookingNotification): void {
    this.notifications.push(notification);
    this.playSound();
    this.cdr.markForCheck();

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => this.dismiss(notification.id), 6000);
    this.timers.set(notification.id, timer);
  }

  dismiss(id: string): void {
    // Start slide-out animation
    this.hidingIds.add(id);
    this.cdr.markForCheck();

    // Remove from DOM after animation completes
    setTimeout(() => {
      this.notifications = this.notifications.filter((n) => n.id !== id);
      this.hidingIds.delete(id);
      clearTimeout(this.timers.get(id));
      this.timers.delete(id);
      this.cdr.markForCheck();
    }, 350);
  }

  trackById(_: number, n: BookingNotification): string {
    return n.id;
  }

  /* ---------- SOUND via Web Audio API ----------
   * Two-tone chime — no sound file needed
   */
  private playSound(): void {
    try {
      this.audioCtx ??= new AudioContext();
      const ctx = this.audioCtx;

      const playTone = (
        frequency: number,
        startTime: number,
        duration: number,
      ) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(880, now, 0.3); // A5 — first chime
      playTone(1100, now + 0.15, 0.3); // C#6 — second chime
    } catch (err) {
      // AudioContext not available (e.g. tab not focused) — fail silently
    }
  }
}
