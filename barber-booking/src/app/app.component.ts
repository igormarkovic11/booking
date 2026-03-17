import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { OfflineBannerComponent } from './shared/offline-banner/offline-banner.component';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { BookingService } from './core/services/booking.service';
import { LanguageService } from './core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToolbarComponent,
    FooterComponent,
    CommonModule,
    OfflineBannerComponent,
    TranslateModule,
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
    private languageService: LanguageService,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showFooter = !event.urlAfterRedirects.startsWith('/contact');
      });
  }

  ngOnInit(): void {
    // Init language first so translations are ready before anything renders
    this.languageService.init();

    // Preload auth and dayoffs
    signInAnonymously(this.auth).catch(() => {});
    this.bookingService.getDayOffs().catch(() => {});
  }
}
