import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../core/services/booking.service';
import { Auth, signInAnonymously, authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss'],
})
export class ConfirmComponent implements OnInit {
  status:
    | 'loading'
    | 'success'
    | 'expired'
    | 'invalid'
    | 'not_found'
    | 'already' = 'loading';

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private auth: Auth,
  ) {}

  async ngOnInit(): Promise<void> {
    await signInAnonymously(this.auth).catch(() => {});

    // Wait until Firebase confirms the auth state is ready
    // (signInAnonymously resolves before the token is fully propagated)
    await firstValueFrom(
      authState(this.auth).pipe(filter((user) => user !== null)),
    );

    const bookingId = this.route.snapshot.queryParamMap.get('bookingId');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!bookingId || !token) {
      this.status = 'invalid';
      return;
    }

    const result = await this.bookingService.confirmBooking(bookingId, token);

    switch (result) {
      case 'success':
        this.status = 'success';
        break;
      case 'expired':
        this.status = 'expired';
        break;
      case 'already_confirmed':
        this.status = 'already';
        break;
      case 'not_found':
        this.status = 'not_found';
        break;
      default:
        this.status = 'invalid';
    }
  }

  navigateToHome() {
    window.location.href = '/';
  }
}
