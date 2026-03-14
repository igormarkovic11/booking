import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  CollectionReference,
  DocumentData,
  setDoc,
  deleteDoc,
  limit,
} from '@angular/fire/firestore';
import { EmailTemplateService } from './email-template.service';

const DAYOFFS_CACHE_KEY = 'dayoffs_cache';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private bookingsRef: CollectionReference<DocumentData>;

  constructor(
    private firestore: Firestore,
    private emailTemplate: EmailTemplateService,
  ) {
    this.bookingsRef = collection(this.firestore, 'bookings');
  }

  /* ---------- ZAUZETI TERMINI ---------- */
  async getBookedTimesForDate(date: string): Promise<string[]> {
    const snapshot = await getDocs(
      query(this.bookingsRef, where('date', '==', date)),
    );
    const now = new Date();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as any;
        const createdAt = data.createdAt?.toDate?.() ?? new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

        if (
          data.status === 'confirmed' ||
          (data.status === 'pending' && diffMinutes < 15)
        ) {
          return data.time;
        }
        return null;
      })
      .filter((time): time is string => time !== null);
  }

  /* ---------- PROVJERA DOSTUPNOSTI ---------- */
  async isSlotAvailable(date: string, time: string): Promise<boolean> {
    const now = new Date();

    const confirmedSnap = await getDocs(
      query(
        this.bookingsRef,
        where('date', '==', date),
        where('time', '==', time),
        where('status', '==', 'confirmed'),
      ),
    );
    if (!confirmedSnap.empty) return false;

    const pendingSnap = await getDocs(
      query(
        this.bookingsRef,
        where('date', '==', date),
        where('time', '==', time),
        where('status', '==', 'pending'),
      ),
    );

    for (const docSnap of pendingSnap.docs) {
      const data = docSnap.data() as any;
      const createdAt = data.createdAt?.toDate?.() ?? new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;
      if (diffMinutes < 15) return false;
    }

    return true;
  }

  /* ---------- KREIRANJE REZERVACIJE ---------- */
  async createBooking(booking: {
    date: string;
    time: string;
    services: string[];
    name: string;
    phone: string;
    email: string;
  }) {
    const token = this.generateToken();
    const cancellationId = this.generateToken();
    const newDocRef = doc(collection(this.firestore, 'bookings'));
    const bookingId = newDocRef.id;

    const formattedDate = booking.date.split('-').reverse().join('.');
    const vocativeName = this.toVocative(this.capitalize(booking.name));

    const confirmUrl = `https://booking-ashen-nine.vercel.app/confirm?bookingId=${bookingId}&token=${token}`;
    const cancelUrl = `https://booking-ashen-nine.vercel.app/cancel?id=${bookingId}&token=${cancellationId}`;

    const emailContent = this.emailTemplate.getConfirmationEmail({
      vocativeName,
      formattedDate,
      time: booking.time,
      services: booking.services,
      confirmUrl,
      cancelUrl,
      bookingId,
    });

    await setDoc(newDocRef, {
      ...booking,
      status: 'pending',
      confirmationToken: token,
      cancellationId,
      createdAt: new Date(),
      to: [booking.email],
      message: emailContent,
    });

    return newDocRef;
  }

  /* ---------- OTKAZIVANJE ---------- */
  async cancelBooking(bookingId: string, token: string): Promise<boolean> {
    try {
      const bookingRef = doc(this.firestore, `bookings/${bookingId}`);
      const snap = await getDoc(bookingRef);

      if (!snap.exists()) return false;

      if (snap.data()['cancellationId'] === token) {
        await deleteDoc(bookingRef);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Greška pri otkazivanju:', error);
      return false;
    }
  }

  /* ---------- POTVRDA TERMINA ---------- */
  async confirmBooking(bookingId: string, token: string): Promise<string> {
    const bookingRef = doc(this.firestore, `bookings/${bookingId}`);
    const snap = await getDoc(bookingRef);

    if (!snap.exists()) return 'not_found';

    const data = snap.data() as any;

    if (data.status === 'confirmed') return 'already_confirmed';
    if (data.confirmationToken !== token) return 'invalid_token';

    const diffMinutes =
      (Date.now() - data.createdAt?.toDate().getTime()) / 1000 / 60;

    if (diffMinutes > 15) {
      updateDoc(bookingRef, { status: 'expired' });
      return 'expired';
    }

    const conflictSnap = await getDocs(
      query(
        collection(this.firestore, 'bookings'),
        where('date', '==', data.date),
        where('time', '==', data.time),
        where('status', '==', 'confirmed'),
        limit(1),
      ),
    );

    if (!conflictSnap.empty) {
      updateDoc(bookingRef, { status: 'expired' });
      return 'slot_taken';
    }

    await updateDoc(bookingRef, { status: 'confirmed', expireAt: null });
    return 'success';
  }

  /* ---------- ČIŠĆENJE STARIH TERMINA ---------- */
  async cleanupOldBookings(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const snapshot = await getDocs(
      query(this.bookingsRef, where('date', '<', today)),
    );
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  }

  /* ---------- NERADNI DANI (sessionStorage cache) ---------- */
  clearDayOffsCache(): void {
    sessionStorage.removeItem(DAYOFFS_CACHE_KEY);
  }

  async getDayOffs(): Promise<string[]> {
    const cached = sessionStorage.getItem(DAYOFFS_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const snapshot = await getDocs(collection(this.firestore, 'dayoffs'));
    const dayoffs = snapshot.docs.map((d) => d.id);
    sessionStorage.setItem(DAYOFFS_CACHE_KEY, JSON.stringify(dayoffs));
    return dayoffs;
  }

  async toggleDayOff(date: string, isOff: boolean): Promise<void> {
    const docRef = doc(this.firestore, `dayoffs/${date}`);
    if (isOff) {
      await setDoc(docRef, { date, createdAt: new Date() });
    } else {
      await deleteDoc(docRef);
    }
    this.clearDayOffsCache();
  }

  /* ---------- PRIVATNE POMOĆNE METODE ---------- */
  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    );
  }

  private capitalize(name: string): string {
    if (!name) return '';
    return name
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private toVocative(name: string): string {
    if (!name) return '';
    const firstName = name.trim().split(' ')[0];
    const lower = firstName.toLowerCase();
    const last = lower.slice(-1);

    if (lower.endsWith('tar') || lower.endsWith('ndar')) {
      return firstName.slice(0, -2) + 're';
    }
    if (last === 'a') {
      return lower.endsWith('ica') ? firstName.slice(0, -1) + 'e' : firstName;
    }
    if ('bcćčdgđjklljmnnjprstvzž'.includes(last)) {
      return ['k', 'g', 'h'].includes(last) ? firstName + 'u' : firstName + 'e';
    }
    return firstName;
  }
}
