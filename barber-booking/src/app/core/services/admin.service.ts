import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
} from '@angular/fire/firestore';
import { BookingService } from './booking.service';
import { EmailTemplateService } from './email-template.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private firestore = inject(Firestore);
  private bookingService = inject(BookingService);
  private emailTemplate = inject(EmailTemplateService);
  private bookingsRef = collection(this.firestore, 'bookings');

  /* ---------- DOHVATI REZERVACIJE ---------- */
  async getBookingsForDate(date: string) {
    const snapshot = await getDocs(
      query(
        this.bookingsRef,
        where('date', '==', date),
        where('status', '==', 'confirmed'),
      ),
    );
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  /* ---------- PROVJERA PIN-a ---------- */
  async verifyPin(enteredPin: string): Promise<boolean> {
    try {
      const snap = await getDoc(doc(this.firestore, 'internal', 'config'));
      return snap.exists() && snap.data()['adminPin'] == enteredPin;
    } catch {
      return false;
    }
  }

  /* ---------- DODAJ REZERVACIJU ---------- */
  async addBooking(bookingData: any) {
    return addDoc(this.bookingsRef, {
      ...bookingData,
      status: 'confirmed',
      createdAt: new Date(),
    });
  }

  /* ---------- OBRIŠI I OBAVIJESTI ---------- */
  async deleteBookingAndNotify(booking: any): Promise<void> {
    console.log('Deleting booking:', booking.id);
    await deleteDoc(doc(this.firestore, `bookings/${booking.id}`));

    console.log('Booking email:', booking.email);
    if (!booking.email?.trim()) {
      console.log('No email, skipping notification');
      return;
    }

    const formattedDate = booking.date.split('-').reverse().join('.');
    const emailContent = this.emailTemplate.getCancellationEmail({
      name: booking.name,
      formattedDate,
      time: booking.time,
      services: booking.services,
      lang: booking.lang ?? 'sr',
    });

    console.log('Email content:', emailContent);

    try {
      const ref = await addDoc(this.bookingsRef, {
        to: [booking.email],
        message: { subject: emailContent.subject, html: emailContent.html },
        status: 'cancelled',
        type: 'email_trigger',
        createdAt: new Date(),
      });
      console.log('Email trigger doc created:', ref.id);
    } catch (error) {
      console.error('Email trigger failed:', error);
    }
  }

  /* ---------- NERADNI DANI ---------- */
  async checkIfDayOff(date: string): Promise<boolean> {
    const dayOffs = await this.bookingService.getDayOffs();
    return dayOffs.includes(date);
  }

  async toggleDayOff(date: string, shouldBeOff: boolean): Promise<void> {
    await this.bookingService.toggleDayOff(date, shouldBeOff);
  }
}
