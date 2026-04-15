import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface Service {
  label: string;
  value: string;
  selected: boolean;
}

@Component({
  selector: 'app-service-selector',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="services-box" [style.opacity]="disabled ? '0.5' : '1'">
      <p class="services-title">
        {{ 'BOOKING.SERVICES_TITLE' | translate }}
        <span>{{ 'BOOKING.SERVICES_OPTIONAL' | translate }}</span>
      </p>
      <div class="checkboxes">
        <label *ngFor="let service of services; trackBy: trackByValue">
          <input
            type="checkbox"
            [checked]="service.selected"
            (change)="onToggle(service)"
            [disabled]="disabled"
          />
          <span>{{ service.label }}</span>
        </label>
      </div>
    </div>
  `,
  styleUrl: './service-selector.component.css',
})
export class ServiceSelectorComponent {
  @Input() services: Service[] = [];
  @Input() disabled = false;
  @Output() toggled = new EventEmitter<Service>();

  trackByValue(_: number, service: Service): string {
    return service.value;
  }

  onToggle(service: Service): void {
    this.toggled.emit(service);
  }
}
