import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { OfflineBannerComponent } from './shared/offline-banner/offline-banner.component';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { BookingService } from './core/services/booking.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToolbarComponent,
    FooterComponent,
    CommonModule,
    OfflineBannerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'barber-booking';
  showFooter = true;

  constructor(
    private router: Router,
    private auth: Auth,
    private bookingService: BookingService,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showFooter = !event.urlAfterRedirects.startsWith('/contact');
      });
  }

  ngOnInit(): void {
    // Preload anonymous auth and day-offs as soon as the app boots
    // so by the time the user navigates to /booking everything is ready
    signInAnonymously(this.auth).catch(() => {});
    this.bookingService.getDayOffs().catch(() => {});
  }
}
