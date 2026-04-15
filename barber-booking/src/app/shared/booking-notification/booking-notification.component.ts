import {
  Component,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface BookingNotification {
  id: string;
  name: string;
  time: string;
  services: string[];
}

@Component({
  selector: 'app-booking-notification',
  standalone: true,
  imports: [CommonModule, TranslateModule],
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
          <span class="notif-title">{{ 'NOTIFICATION.NEW' | translate }}</span>
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
export class BookingNotificationComponent implements OnDestroy, OnInit {
  notifications: BookingNotification[] = [];
  hidingIds = new Set<string>();

  private timers = new Map<string, any>();
  private audioCtx: AudioContext | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Unlock AudioContext on first user interaction (required for iOS)
    const unlock = () => {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('click', unlock, { passive: true });
  }

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

      // Resume if suspended (iOS requirement)
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().then(() => this.playTones());
      } else {
        this.playTones();
      }
    } catch (err) {}
  }

  private playTones(): void {
    const ctx = this.audioCtx!;
    const now = ctx.currentTime;

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

    playTone(880, now, 0.3);
    playTone(1100, now + 0.15, 0.3);
  }
}
