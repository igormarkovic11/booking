import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';
import {
  LanguageService,
  SupportedLang,
} from '../../core/services/language.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    RouterModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css',
})
export class ToolbarComponent implements OnInit {
  menuOpen = false;
  isAdmin$: Observable<boolean>;

  constructor(
    private auth: Auth,
    private router: Router,
    public langService: LanguageService,
  ) {
    this.isAdmin$ = authState(this.auth).pipe(
      map((user) => !!user && user.email === environment.adminEmail),
    );
  }

  ngOnInit(): void {}

  switchLang(lang: SupportedLang): void {
    this.langService.switch(lang);
  }

  async onLogoClick(): Promise<void> {
    if (await this.isAdmin$.pipe(map((v) => v)).toPromise()) {
      await this.auth.signOut();
    }
    this.router.navigate(['/']);
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const menu = document.querySelector('.mobile-menu');
    if (this.menuOpen && menu && !menu.contains(event.target as Node)) {
      this.menuOpen = false;
    }
  }
}
