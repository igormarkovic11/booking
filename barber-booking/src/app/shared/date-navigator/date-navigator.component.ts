import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-navigator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="date-navigator">
      <button (click)="step(-1)">◀</button>
      <input
        type="date"
        [ngModel]="date"
        (ngModelChange)="dateChange.emit($event)"
        class="calendar-input"
      />
      <button (click)="step(1)">▶</button>
    </div>
  `,
  styleUrl: './date-navigator.component.css',
})
export class DateNavigatorComponent {
  @Input() date = '';
  @Output() dateChange = new EventEmitter<string>();
  @Output() stepped = new EventEmitter<number>();

  step(days: number): void {
    this.stepped.emit(days);
  }
}
