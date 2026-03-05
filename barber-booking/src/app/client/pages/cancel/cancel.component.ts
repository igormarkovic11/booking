import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cancel.component.html',
  styleUrl: './cancel.component.css',
})
export class CancelComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (id && token) {
      const isCancelled = await this.bookingService.cancelBooking(id, token);
      this.status = isCancelled ? 'success' : 'error';
    } else {
      this.status = 'error';
    }
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}
