import { Injectable } from '@angular/core';
import {
  CollectionReference,
  DocumentData,
  Firestore,
  collection,
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
  async deleteBooking(bookingId: string) {
    const docRef = doc(this.firestore, `bookings/${bookingId}`);
    return await deleteDoc(docRef);
  }

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
    const docRef = doc(this.firestore, 'internal', 'config');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      return data['adminPin'] === enteredPin;
    }
    return false;
  }
}
