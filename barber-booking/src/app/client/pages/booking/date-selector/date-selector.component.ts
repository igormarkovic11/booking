import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-date-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <p class="step-instruction">{{ 'BOOKING.SELECT_DATE' | translate }}</p>
    <select
      [ngModel]="selectedDate"
      (ngModelChange)="dateChange.emit($event)"
      [disabled]="disabled"
      class="date-dropdown"
    >
      <option *ngFor="let date of availableDates" [value]="date">
        <ng-container *ngIf="date === todayStr">
          {{ 'BOOKING.TODAY' | translate }}, {{ date | date: 'dd.MM.yyyy.' }}
        </ng-container>
        <ng-container *ngIf="date !== todayStr">
          {{
            date
              | date: 'EEEE, dd.MM.yyyy.' : undefined : currentLang
              | titlecase
          }}
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
  private translate = inject(TranslateService);

  get todayStr(): string {
    return new Date().toLocaleDateString('sv-SE');
  }

  get currentLang(): string {
    return this.translate.currentLang ?? 'sr';
  }
}
