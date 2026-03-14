import { Component, HostListener } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css',
})
export class ToolbarComponent {
  menuOpen = false;
  isAdmin = false;
  isAdmin$: Observable<boolean>;

  constructor(
    private auth: Auth,
    private router: Router,
  ) {
    this.isAdmin$ = authState(this.auth).pipe(
      map((user) => !!user && user.email === environment.adminEmail),
    );
    this.isAdmin$.subscribe((val) => (this.isAdmin = val));
  }

  async onLogoClick(): Promise<void> {
    if (this.isAdmin) await this.auth.signOut();
    this.router.navigate(['/']);
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const menu = document.querySelector('.mobile-menu');
    if (this.menuOpen && menu && !menu.contains(event.target as Node)) {
      this.menuOpen = false;
    }
  }
}
