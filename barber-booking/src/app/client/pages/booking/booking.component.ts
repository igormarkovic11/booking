import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent {
  nextDates: Date[] = [];
  selectedDate: Date;

  times = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
  ];
  selectedTime: string | null = null;

  services = ['Šišanje', 'Brijanje', 'Stilizovanje', 'Trimovanje'];
  selectedServices: string[] = [];

  name: string = '';
  phone: string = '';

  constructor() {
    this.generateNextDates();
    this.selectedDate = this.nextDates[0]; // default = danasnji datum
  }

  generateNextDates() {
    const today = new Date();
    this.nextDates = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      this.nextDates.push(d);
    }
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  toggleService(service: string) {
    if (this.selectedServices.includes(service)) {
      this.selectedServices = this.selectedServices.filter(
        (s) => s !== service
      );
    } else {
      this.selectedServices.push(service);
    }
  }

  submitBooking() {
    if (!this.selectedTime || !this.name || !this.phone) {
      alert('Molimo popunite sve obavezne podatke!');
      return;
    }

    const booking = {
      date: this.selectedDate,
      time: this.selectedTime,
      services: this.selectedServices,
      name: this.name,
      phone: this.phone,
    };

    console.log('Booking submitted:', booking);
    alert('Termin uspješno zakazan!');

    this.selectedTime = null;
    this.selectedServices = [];
    this.name = '';
    this.phone = '';
  }
}
