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
}
