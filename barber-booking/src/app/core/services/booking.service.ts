import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  CollectionReference,
  DocumentData,
} from '@angular/fire/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private bookingsRef!: CollectionReference<DocumentData>;

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
  ) {
    this.bookingsRef = collection(this.firestore, 'bookings');
  }

  /* ---------- UZMI ZAUZETE TERMINE ZA DATUM ---------- */
  async getBookedTimesForDate(date: string): Promise<string[]> {
    const q = query(
      this.bookingsRef,
      where('date', '==', date),
      where('status', '==', 'confirmed'),
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data()['time']);
  }

  /* ---------- PROVJERA DOSTUPNOSTI ---------- */
  async isSlotAvailable(date: string, time: string): Promise<boolean> {
    const q = query(
      this.bookingsRef,
      where('date', '==', date),
      where('time', '==', time),
      where('status', '==', 'confirmed'),
    );

    const snapshot = await getDocs(q);
    return snapshot.empty;
  }

  /* ---------- KREIRAJ REZERVACIJU ---------- */
  async createBooking(booking: {
    date: string;
    time: string;
    services: string[];
    name: string;
    phone: string;
    email: string;
  }) {
    const token = this.generateToken();

    const payload = {
      ...booking,
      status: 'pending',
      confirmationToken: token,
      createdAt: new Date(),
    };

    const docRef = await addDoc(this.bookingsRef, payload);

    // Try to send confirmation email via server function if configured.
    try {
      await this.sendConfirmationEmail(docRef.id, token, payload);
    } catch (e) {
      // If sending fails, don't block the booking creation. Logging could be added here.
    }

    return docRef;
  }

  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    );
  }

  private async sendConfirmationEmail(
    bookingId: string,
    token: string,
    booking: any,
  ) {
    const url = (environment as any).confirmationFunctionUrl;
    if (!url) return;

    const body = {
      bookingId,
      token,
      email: booking.email,
      date: booking.date,
      time: booking.time,
      name: booking.name,
    };

    return lastValueFrom(this.http.post(url, body));
  }
}
