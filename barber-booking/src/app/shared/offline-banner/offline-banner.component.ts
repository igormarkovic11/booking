import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="offline-banner" *ngIf="isOffline">
      <span>⚡ Nema internet konekcije — promjene se neće sačuvati</span>
    </div>
  `,
  styles: [
    `
      .offline-banner {
        position: fixed;
        top: 56px; /* below toolbar */
        left: 0;
        width: 100%;
        background: #b71c1c;
        color: white;
        text-align: center;
        padding: 8px 16px;
        font-size: 0.9rem;
        font-weight: 500;
        z-index: 99;
        animation: slideDown 0.2s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class OfflineBannerComponent implements OnInit, OnDestroy {
  isOffline = false;

  private onOnline = () => {
    this.isOffline = false;
    this.cdr.markForCheck();
  };
  private onOffline = () => {
    this.isOffline = true;
    this.cdr.markForCheck();
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.isOffline = !navigator.onLine;
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }
}
