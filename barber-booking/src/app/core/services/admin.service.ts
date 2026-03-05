import { Injectable } from '@angular/core';
import {
  CollectionReference,
  DocumentData,
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  Query,
  getDoc,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private bookingsRef: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) {
    this.bookingsRef = collection(this.firestore, 'bookings');
  }

  /* DOHVATI SVE POTVRĐENE TERMINE ZA ADMINA */
  // PROMENI NAZIV OVDE:
  async getBookingsForDate(date: string) {
    const q = query(
      this.bookingsRef,
      where('date', '==', date),
      where('status', '==', 'confirmed'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => a.time.localeCompare(b.time));
  }

  /* OTKAŽI/OBRIŠI REZERVACIJU */
  // async deleteBooking(bookingId: string) {
  //   const docRef = doc(this.firestore, `bookings/${bookingId}`);
  //   return await deleteDoc(docRef);
  // }

  /* RUČNO DODAVANJE (CONFIRMED) */
  async createManualBooking(booking: any) {
    const newDocRef = doc(collection(this.firestore, 'bookings'));
    const payload = {
      ...booking,
      status: 'confirmed',
      createdAt: new Date(),
      createdBy: 'admin',
    };
    await setDoc(newDocRef, payload);
    return newDocRef.id;
  }

  async verifyPin(enteredPin: string): Promise<boolean> {
    try {
      const docRef = doc(this.firestore, 'internal', 'config');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data()['adminPin'] == enteredPin;
      }
      return false;
    } catch (error) {
      console.error('Greška pri proveri PIN-a:', error);
      return false;
    }
  }

  async addBooking(bookingData: any) {
    try {
      const bookingsRef = collection(this.firestore, 'bookings');
      // addDoc pravi novi dokument sa nasumičnim ID-em
      return await addDoc(bookingsRef, {
        ...bookingData,
        createdAt: new Date(), // Dodajemo timestamp radi reda
      });
    } catch (error) {
      console.error('Greška pri dodavanju rezervacije:', error);
      throw error;
    }
  }

  async deleteBookingAndNotify(booking: any) {
    const docRef = doc(this.firestore, `bookings/${booking.id}`);

    // 1. Formatiranje podataka za email
    const formattedDate = booking.date.split('-').reverse().join('.');

    const mailPayload = {
      to: [booking.email],
      message: {
        subject: `Otkazan termin: ${formattedDate} u ${booking.time}`,
        html: `
      <div style="background-color: #121212; padding: 40px 10px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #ffffff; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #1e1e1e; border: 1px solid #333333; border-radius: 20px; padding: 30px;">
          <h1 style="color: #ff5252; margin-top: 0;">Termin je otkazan</h1>
          <p style="font-size: 16px; color: #eeeeee;">Zdravo ${booking.name}, obavještavamo Vas da je Vaš termin otkazan.</p>
          
          <div style="background-color: #2a2a2a; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: left; border: 1px solid #444444;">
            <p style="margin: 5px 0; color: #ffffff;"><strong>📅 Datum:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0; color: #ffffff;"><strong>⏰ Vrijeme:</strong> ${booking.time}</p>
            <p style="margin: 5px 0; color: #ffffff;"><strong>✂️ Usluge:</strong> ${booking.services.join(', ')}</p>
          </div>

          <p style="font-size: 14px; color: #777777; line-height: 1.6;">
            Svoj novi termin možete zakazati ponovo putem naše aplikacije.
          </p>

          <a href="https://booking-ashen-nine.vercel.app/" 
             style="display: inline-block; margin-top: 20px; padding: 12px 25px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold;">
             ZAKAŽI NOVI TERMIN
          </a>
        </div>
      </div>
      `,
      },
    };

    // 2. Prvo šaljemo mejl (kreiramo dokument u 'mail' kolekciji)
    if (booking.email) {
      await addDoc(collection(this.firestore, 'mail'), mailPayload);
    }

    // 3. Brišemo termin
    return await deleteDoc(docRef);
  }
}
