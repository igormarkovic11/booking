import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser: User | null = null;

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
    });
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // PIN is the Firebase password — no Firestore read needed
  // If signInWithEmailAndPassword succeeds, the PIN was correct
  // If it throws, the PIN was wrong
  async login(pin: string): Promise<boolean> {
    try {
      await signInWithEmailAndPassword(
        this.auth,
        environment.adminEmail,
        pin + environment.adminSecret, // e.g. "1234" + "Vidakovic#HB" = "1234Vidakovic#HB"
      );
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUser = null;
  }
}
