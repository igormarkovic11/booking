import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Auth, signInAnonymously, authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './cancel.component.html',
  styleUrl: './cancel.component.css',
})
export class CancelComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private auth: Auth,
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('ngOnInit started');
    console.log('Auth instance:', this.auth);
    await signInAnonymously(this.auth).catch((err) =>
      console.error('signInAnonymously failed:', err),
    );

    // Wait until Firebase confirms the auth state is ready
    await firstValueFrom(
      authState(this.auth).pipe(filter((user) => user !== null)),
    );

    const currentUser = this.auth.currentUser;
    console.log('Current user:', currentUser);
    console.log('Is anonymous:', currentUser?.isAnonymous);
    console.log('UID:', currentUser?.uid);
    const token2 = await currentUser?.getIdToken();
    console.log('Token:', token2);
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
