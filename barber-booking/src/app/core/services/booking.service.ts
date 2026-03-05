import { Injectable, OnInit } from '@angular/core';
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
  setDoc,
  deleteDoc,
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

  /* ---------- KREIRAJ REZERVACIJU (Sa linkom za otkazivanje) ---------- */
  async createBooking(booking: any) {
    const confirmationToken = this.generateToken();
    const cancellationId = this.generateToken(); // NOVO: Token za otkazivanje
    const createdAt = new Date();
    const newDocRef = doc(collection(this.firestore, 'bookings'));
    const bookingId = newDocRef.id;
    const expireAt = new Date(createdAt.getTime() + 20 * 60000);

    const formattedDate = booking.date.split('-').reverse().join('.');
    const capitalizedName = this.capitalize(booking.name);
    const vocativeName = this.toVocative(capitalizedName);

    // URL-ovi (Promeni ove linkove ako ti je domen drugačiji)
    const confirmUrl = `https://booking-ashen-nine.vercel.app/confirm?bookingId=${bookingId}&token=${confirmationToken}`;
    const cancelUrl = `https://booking-ashen-nine.vercel.app/cancel?id=${bookingId}&token=${cancellationId}`;

    const payload: any = {
      ...booking,
      status: 'pending',
      confirmationToken,
      cancellationId, // Čuvamo u bazi da bismo proverili pri otkazivanju
      createdAt,
      expireAt,
      to: [booking.email],
      message: {
        subject: `Potvrda termina: ${formattedDate} u ${booking.time}`,
        html: `
        <div style="background-color: #121212; padding: 40px 20px; font-family: sans-serif; color: #ffffff; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background: #1e1e1e; border-radius: 20px; padding: 30px; border: 1px solid #333;">
            <h1 style="color: #1976d2;">Pozdrav, ${vocativeName}!</h1>
            <p>Vaš termin je skoro spreman. Molimo potvrdite dolazak:</p>
            
            <a href="${confirmUrl}" style="display: inline-block; padding: 14px 30px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; margin: 20px 0;">
               POTVRDI TERMIN
            </a>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
              <p style="font-size: 11px; color: #777;">
                Ukoliko želite da odustanete, možete <a href="${cancelUrl}" style="color: #bbbbbb; text-decoration: underline;">otkazati vaš termin ovde</a>.
              </p>
            </div>
          </div>
        </div>
      `,
      },
    };

    await setDoc(newDocRef, payload);
    return newDocRef;
  }

  /* ---------- NOVA METODA ZA OTKAZIVANJE ---------- */
  async cancelBooking(bookingId: string, token: string): Promise<boolean> {
    try {
      const bookingRef = doc(this.firestore, `bookings/${bookingId}`);
      const snap = await getDoc(bookingRef);

      if (!snap.exists()) return false;
      const data = snap.data();

      // Proveravamo da li token za otkazivanje odgovara onom u bazi
      if (data['cancellationId'] === token) {
        await deleteDoc(bookingRef); // Ili updateDoc(bookingRef, { status: 'cancelled' })
        return true;
      }
      return false;
    } catch (error) {
      console.error('Greška pri otkazivanju:', error);
      return false;
    }
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

    await updateDoc(bookingRef, {
      status: 'confirmed',
      expireAt: null, // Trajno ostaje u bazi (dok ga ne obrišemo kao starog)
    });
    return 'success';
  }

  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    );
  }

  private toVocative(name: string): string {
    if (!name) return '';

    // Sklanjamo višak razmaka i uzimamo samo prvo ime ako ih je više
    const firstName = name.trim().split(' ')[0];
    const lastChar = firstName.slice(-1).toLowerCase();
    const secondToLastChar = firstName.slice(-2, -1).toLowerCase();

    // 1. Ženska imena na -a (Marija -> Marija, Ivana -> Ivana)
    // Većina ostaje ista, pa ne mijenjamo ništa.

    // 2. Muška imena na suglasnik (Igor -> Igore, Ivan -> Ivane)
    const consonants = 'bcćčdgđjklljmnnjprstvzž';
    if (consonants.includes(lastChar)) {
      // Specifičnost: imena na -k, -g, -h često idu u -u (npr. Oleg -> Olegu, ali može i Oleže)
      // Za Barbershop je najsigurnije dodati -e
      if (lastChar === 'k' || lastChar === 'g') {
        return firstName + 'u'; // npr. Erik -> Eriku
      }
      return firstName + 'e';
    }

    // 3. Imena na -o ili -e (Marko, Hrvoje) - ostaju ista u vokativu
    if (lastChar === 'o' || lastChar === 'e') {
      return firstName;
    }

    // 4. Specifična imena na -ica (npr. Ivica -> Ivice)
    if (firstName.toLowerCase().endsWith('ica')) {
      return firstName.slice(0, -1) + 'e';
    }

    return firstName; // Default: vrati kako jeste
  }

  async cleanupOldBookings() {
    const today = new Date().toISOString().split('T')[0];

    // Uzmi sve termine koji su za datum manji od danas
    const q = query(this.bookingsRef, where('date', '<', today));
    const snapshot = await getDocs(q);

    const batch = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(batch);
    console.log(`Očišćeno ${snapshot.size} starih termina.`);
  }

  private capitalize(name: string): string {
    if (!name) return '';
    return name
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
