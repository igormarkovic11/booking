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
  selector: 'app-date-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="step-instruction">Izaberi datum</p>
    <select
      [ngModel]="selectedDate"
      (ngModelChange)="dateChange.emit($event)"
      [disabled]="disabled"
      class="date-dropdown"
    >
      <option *ngFor="let date of availableDates" [value]="date">
        <ng-container *ngIf="date === todayStr">
          Danas, {{ date | date: 'dd.MM.yyyy.' }}
        </ng-container>
        <ng-container *ngIf="date !== todayStr">
          {{ date | date: 'EEEE, dd.MM.yyyy.' | titlecase }}
        </ng-container>
      </option>
    </select>
  `,
  styleUrl: './date-selector.component.css',
})
export class DateSelectorComponent {
  @Input() availableDates: string[] = [];
  @Input() selectedDate = '';
  @Input() disabled = false;
  @Output() dateChange = new EventEmitter<string>();

  get todayStr(): string {
    return new Date().toLocaleDateString('sv-SE');
  }
}
