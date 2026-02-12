import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  CollectionReference,
  DocumentData,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private bookingsRef!: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) {
    this.bookingsRef = collection(this.firestore, 'bookings');
  }

  /* ---------- UZMI ZAUZETE TERMINE ---------- */
  async getBookedTimesForDate(date: string): Promise<string[]> {
    const snapshot = await getDocs(
      query(this.bookingsRef, where('date', '==', date)),
    );

    const now = new Date();

    return snapshot.docs
      .map((doc) => {
        const data: any = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

        // Ako je pending i manje od 15 min prošlo, tretiraj kao zauzet
        if (
          data.status === 'confirmed' ||
          (data.status === 'pending' && diffMinutes < 15)
        ) {
          return data.time;
        }
        return null;
      })
      .filter((time) => time !== null) as string[];
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
    const createdAt = new Date();

    const payload: any = {
      ...booking,
      status: 'pending',
      confirmationToken: token,
      createdAt,

      // 🔥 Ovo koristi Email Extension
      to: [booking.email],
      message: {
        subject: 'Potvrda termina',
        html: `
          <p>Zdravo ${booking.name},</p>
          <p>Klikni ispod da potvrdiš termin:</p>
          <a href="http://localhost:4200/confirm?bookingId=DOC_ID&token=${token}">
            Potvrdi termin
          </a>
          <p>Link važi 15 minuta.</p>
        `,
      },
    };

    const docRef = await addDoc(this.bookingsRef, payload);

    // zamjena DOC_ID
    await updateDoc(docRef, {
      'message.html': payload.message.html.replace('DOC_ID', docRef.id),
    });

    return docRef;
  }

  /* ---------- POTVRDA TERMINA ---------- */
  async confirmBooking(
    bookingId: string,
    token: string,
  ): Promise<
    'success' | 'expired' | 'invalid_token' | 'not_found' | 'already_confirmed'
  > {
    const bookingRef = doc(this.firestore, `bookings/${bookingId}`);
    const snap = await getDoc(bookingRef);

    if (!snap.exists()) return 'not_found';

    const data: any = snap.data();

    if (data.status === 'confirmed') return 'already_confirmed';

    if (data.confirmationToken !== token) return 'invalid_token';

    const createdAt = data.createdAt?.toDate();
    const now = new Date();

    const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

    if (diffMinutes > 15) {
      await updateDoc(bookingRef, { status: 'expired' });
      return 'expired';
    }

    await updateDoc(bookingRef, { status: 'confirmed' });
    return 'success';
  }

  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    );
  }
}
