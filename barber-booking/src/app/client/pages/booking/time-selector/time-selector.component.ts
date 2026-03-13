import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-time-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="step-instruction">Odaberite termin</p>
    <div class="time-grid">
      <button
        *ngFor="let time of times"
        (click)="onSelect(time)"
        [disabled]="isBooked(time) || disabled"
        [class.active]="selectedTime === time"
        [class.booked]="isBooked(time)"
      >
        {{ time }}
      </button>
    </div>
  `,
  styleUrl: './time-selector.component.css',
})
export class TimeSelectorComponent {
  @Input() times: string[] = [];
  @Input() bookedTimes: string[] = [];
  @Input() selectedTime: string | null = null;
  @Input() disabled = false;
  @Output() timeChange = new EventEmitter<string | null>();

  isBooked(time: string): boolean {
    return this.bookedTimes.includes(time);
  }

  onSelect(time: string): void {
    if (this.isBooked(time)) return;
    this.timeChange.emit(this.selectedTime === time ? null : time);
  }
}
