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

  /* ---------- KREIRAJ REZERVACIJU (Gmail-friendly verzija) ---------- */
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
    const createdAt = new Date();
    const newDocRef = doc(collection(this.firestore, 'bookings'));
    const bookingId = newDocRef.id;

    const formattedDate = booking.date.split('-').reverse().join('.');
    const capitalizedName = this.capitalize(booking.name);
    const vocativeName = this.toVocative(capitalizedName);

    const confirmUrl = `https://booking-ashen-nine.vercel.app/confirm?bookingId=${bookingId}&token=${token}`;
    const cancelUrl = `https://booking-ashen-nine.vercel.app/cancel?id=${bookingId}&token=${cancellationId}`;

    const payload: any = {
      ...booking,
      status: 'pending',
      confirmationToken: token,
      cancellationId: cancellationId,
      createdAt,
      to: [booking.email],
      message: {
        subject: `Potvrda termina - ${formattedDate} u ${booking.time}`,
        // DODAJEMO MNOGO VIŠE TEKSTA U TEXT VERZIJU (za 10/10 skor)
        text: `Zdravo ${vocativeName},\n\nHvala vam što koristite naš online servis za zakazivanje. Rezervisali ste termin u Barbershop-u za ${formattedDate} u ${booking.time}.\n\nMolimo vas da potvrdite svoj dolazak klikom na ovaj link:\n${confirmUrl}\n\nUkoliko želite da otkažete ovu rezervaciju, kliknite ovde: ${cancelUrl}\n\nDetalji:\nUsluge: ${booking.services.join(', ')}\nLokacija: Kneza Miloša 1, Bijeljina.\n\nOvaj mejl je automatski generisan radi vaše sigurnosti i potvrde mesta u kalendaru.`,

        // DODAJEMO LIST-UNSUBSCRIBE HEADER
        headers: {
          'List-Unsubscribe': `<${cancelUrl}>`,
          'X-Entity-Ref-ID': bookingId,
        },

        html: `
    <!DOCTYPE html>
    <html lang="sr">
    <head>
      <meta charset="UTF-8">
      <title>Potvrda rezervacije</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #121212; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; color: #121212;">
        Vaš termin za ${booking.services.join(', ')} je spreman. Potvrdite dolazak klikom na dugme unutar poruke kako bi vaša rezervacija ostala važeća.
      </div>

      <div style="background-color: #121212; padding: 40px 10px; color: #ffffff; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #1e1e1e; border: 1px solid #333333; border-radius: 20px; padding: 30px;">
          <h1 style="color: #1976d2; font-size: 26px; margin-bottom: 10px;">Zdravo, ${vocativeName}!</h1>
          <p style="font-size: 16px; color: #cccccc; line-height: 1.6;">
            Hvala Vam što ste odabrali naš barbershop. Primili smo Vaš zahtjev za termin i rezervisali smo Vam mjesto u kalendaru. 
            <br><br>
            <strong style="color: #ffffff;">Molimo Vas da potvrdite dolazak</strong> klikom na dugme ispod kako bi proces bio završen:
          </p>
          
          <div style="background-color: #2a2a2a; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: left; border: 1px solid #444444;">
            <p style="margin: 5px 0; font-size: 15px;"><strong>📅 DATUM:</strong> <span style="color: #1976d2;">${formattedDate}</span></p>
            <p style="margin: 5px 0; font-size: 15px;"><strong>⏰ VRIJEME:</strong> <span style="color: #1976d2;">${booking.time}h</span></p>
            <p style="margin: 5px 0; font-size: 15px;"><strong>✂️ USLUGE:</strong> ${booking.services.join(', ')}</p>
          </div>

          <a href="${confirmUrl}" 
             style="display: inline-block; padding: 16px 35px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(25, 118, 210, 0.3);">
             POTVRDI DOLAZAK
          </a>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333333; font-size: 13px; color: #777777; line-height: 1.5;">
            Ukoliko niste u mogućnosti da dođete, termin možete <a href="${cancelUrl}" style="color: #1976d2; text-decoration: underline;">otkazati ovdje</a>. 
            
            <br><br>
            <strong>Barbershop Bijeljina</strong><br>
            Lokacija: Kneza Miloša 1 | Telefon: +387 61 123 456
          </p>
        </div>
        
        <p style="font-size: 11px; color: #444444; margin-top: 20px;">
          Ovu poruku ste primili jer ste koristili naš sistem za online rezervacije. <br>
          © 2026 Barbershop. Sva prava zadržana.
        </p>
      </div>
    </body>
    </html>
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

    const firstName = name.trim().split(' ')[0];
    const lowerName = firstName.toLowerCase();
    const lastChar = lowerName.slice(-1);

    // 1. SPECIFIČNA IMENA (Petar, Aleksandar i slična na -ar)
    // Rešavamo "Petar -> Petre" i "Aleksandar -> Aleksandre"
    if (lowerName.endsWith('tar')) {
      // Uzimamo sve pre "ar", dodajemo samo "re" (Petar -> Pet + re)
      return firstName.slice(0, -2) + 're';
    }

    if (lowerName.endsWith('ndar')) {
      // Aleksandar -> Aleksand + re
      return firstName.slice(0, -2) + 're';
    }

    // 2. Ženska imena na -a (Marija -> Marija) - ostaju ista
    if (lastChar === 'a') {
      // Izuzetak: imena na -ica (Ivica -> Ivice)
      if (lowerName.endsWith('ica')) {
        return firstName.slice(0, -1) + 'e';
      }
      return firstName;
    }

    // 3. Muška imena na suglasnik (Igor -> Igore, Ivan -> Ivane)
    const consonants = 'bcćčdgđjklljmnnjprstvzž';
    if (consonants.includes(lastChar)) {
      // Specifičnost za k, g, h -> u (da izbjegnemo palatalizaciju tipa Erik -> Eriče)
      if (['k', 'g', 'h'].includes(lastChar)) {
        return firstName + 'u';
      }
      return firstName + 'e';
    }

    // 4. Imena na -o ili -e (Marko, Hrvoje) - ostaju ista
    if (lastChar === 'o' || lastChar === 'e') {
      return firstName;
    }

    return firstName;
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

  /* ---------- DOHVATI SVE NERADNE DANE ---------- */
  async getManualDayOffs(): Promise<string[]> {
    try {
      const dayOffsRef = collection(this.firestore, 'dayoffs');
      const snapshot = await getDocs(dayOffsRef);
      // Vraćamo niz ID-jeva (jer su ID-jevi zapravo datumi u formatu YYYY-MM-DD)
      return snapshot.docs.map((doc) => doc.id);
    } catch (e) {
      console.error('Greška pri dohvatanju slobodnih dana', e);
      return [];
    }
  }

  /* ---------- DOHVATI SVE RUČNO ZATVORENE DANE ---------- */
  private cachedDayOffs: string[] | null = null;

  // Metoda za čišćenje keša koju zoveš iz admina
  clearDayOffsCache() {
    this.cachedDayOffs = null;
  }

  async getDayOffs(): Promise<string[]> {
    if (this.cachedDayOffs) return this.cachedDayOffs;

    const dayOffsRef = collection(this.firestore, 'dayoffs');
    const snapshot = await getDocs(dayOffsRef);
    this.cachedDayOffs = snapshot.docs.map((doc) => doc.id);
    return this.cachedDayOffs;
  }

  async toggleDayOff(date: string, isOff: boolean) {
    const docRef = doc(this.firestore, `dayoffs/${date}`);
    if (isOff) {
      await setDoc(docRef, { date, createdAt: new Date() });
    } else {
      await deleteDoc(docRef);
    }
    // ODMAH očisti keš da bi sledeći upit povukao nove podatke
    this.clearDayOffsCache();
  }
}
