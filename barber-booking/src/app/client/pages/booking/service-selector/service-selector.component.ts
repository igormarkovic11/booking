import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Service {
  label: string;
  value: string;
  selected: boolean;
}

@Component({
  selector: 'app-service-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="services-box" [style.opacity]="disabled ? '0.5' : '1'">
      <p class="services-title">Koje usluge želiš? <span>(opciono)</span></p>
      <div class="checkboxes">
        <label *ngFor="let service of services">
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

  onToggle(service: Service): void {
    this.toggled.emit(service);
  }
}
