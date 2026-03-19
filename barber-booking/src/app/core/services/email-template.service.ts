import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EmailTemplateService {
  private getServiceName(value: string, lang: string): string {
    const map: Record<string, { sr: string; en: string }> = {
      sisanje: { sr: 'Šišanje', en: 'Haircut' },
      brijanje: { sr: 'Brijanje', en: 'Shave' },
      stilizovanje: { sr: 'Stilizovanje', en: 'Styling' },
      trimovanje: { sr: 'Trimovanje', en: 'Trim' },
      haircut: { sr: 'Šišanje', en: 'Haircut' },
      shave: { sr: 'Brijanje', en: 'Shave' },
      styling: { sr: 'Stilizovanje', en: 'Styling' },
      trim: { sr: 'Trimovanje', en: 'Trim' },
    };
    return map[value.toLowerCase()]?.[lang as 'sr' | 'en'] ?? value;
  }

  getConfirmationEmail(params: {
    vocativeName: string;
    formattedDate: string;
    time: string;
    services: string[];
    confirmUrl: string;
    cancelUrl: string;
    bookingId: string;
    lang?: string;
  }): { subject: string; text: string; headers: object; html: string } {
    const {
      vocativeName,
      formattedDate,
      time,
      services,
      confirmUrl,
      cancelUrl,
      bookingId,
      lang = 'sr',
    } = params;

    const isEn = lang === 'en';
    const serviceList =
      services.map((s) => this.getServiceName(s, lang ?? 'sr')).join(', ') ||
      (isEn ? 'Not specified' : 'Nije navedeno');

    const subject = isEn
      ? `Appointment Confirmation - ${formattedDate} at ${time}`
      : `Potvrda termina - ${formattedDate} u ${time}`;

    const text = isEn
      ? `Hello ${vocativeName},\n\nThank you for using our online booking service. You have booked an appointment at Hairstyle Vidaković for ${formattedDate} at ${time}.\n\nPlease confirm your arrival by clicking this link:\n${confirmUrl}\n\nIf you wish to cancel this booking, click here: ${cancelUrl}\n\nDetails:\nServices: ${serviceList}\nLocation: Novi Sad\n\nThis email was automatically generated for your security and calendar confirmation.`
      : `Zdravo ${vocativeName},\n\nHvala vam što koristite naš online servis za zakazivanje. Rezervisali ste termin u Hairstyle Vidaković za ${formattedDate} u ${time}.\n\nMolimo vas da potvrdite svoj dolazak klikom na ovaj link:\n${confirmUrl}\n\nUkoliko želite da otkažete ovu rezervaciju, kliknite ovde: ${cancelUrl}\n\nDetalji:\nUsluge: ${serviceList}\nLokacija: Novi Sad\n\nOvaj mejl je automatski generisan radi vaše sigurnosti i potvrde mjesta u kalendaru.`;

    const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${isEn ? 'Booking Confirmation' : 'Potvrda rezervacije'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; color: #121212;">
    ${
      isEn
        ? `Your appointment for ${serviceList} is ready. Confirm your arrival by clicking the button inside this message.`
        : `Vaš termin za ${serviceList} je spreman. Potvrdite dolazak klikom na dugme unutar poruke.`
    }
  </div>

  <div style="background-color: #121212; padding: 40px 10px; color: #ffffff; text-align: center;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #1e1e1e; border: 1px solid #333333; border-radius: 20px; padding: 30px;">

      <h1 style="color: #1976d2; font-size: 26px; margin-bottom: 10px;">
        ${isEn ? `Hello, ${vocativeName}!` : `Zdravo, ${vocativeName}!`}
      </h1>

      <p style="font-size: 16px; color: #cccccc; line-height: 1.6;">
        ${
          isEn
            ? `Thank you for choosing Hairstyle Vidaković. We have received your appointment request and reserved your spot in our calendar.<br><br><strong style="color: #ffffff;">Please confirm your arrival</strong> by clicking the button below to complete the process:`
            : `Hvala Vam što ste odabrali Hairstyle Vidaković. Primili smo Vaš zahtjev za termin i rezervisali smo Vam mjesto u kalendaru.<br><br><strong style="color: #ffffff;">Molimo Vas da potvrdite dolazak</strong> klikom na dugme ispod kako bi proces bio završen:`
        }
      </p>

      <div style="background-color: #2a2a2a; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: left; border: 1px solid #444444;">
        <p style="margin: 5px 0; font-size: 15px;">
          <strong>📅 ${isEn ? 'DATE' : 'DATUM'}:</strong>
          <span style="color: #1976d2;">${formattedDate}</span>
        </p>
        <p style="margin: 5px 0; font-size: 15px;">
          <strong>⏰ ${isEn ? 'TIME' : 'VRIJEME'}:</strong>
          <span style="color: #1976d2;">${time}h</span>
        </p>
        <p style="margin: 5px 0; font-size: 15px;">
          <strong>✂️ ${isEn ? 'SERVICES' : 'USLUGE'}:</strong> ${serviceList}
        </p>
      </div>

      <a href="${confirmUrl}"
         style="display: inline-block; padding: 16px 35px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(25, 118, 210, 0.3);">
        ${isEn ? 'CONFIRM APPOINTMENT' : 'POTVRDI DOLAZAK'}
      </a>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333333; font-size: 13px; color: #777777; line-height: 1.5;">
        ${
          isEn
            ? `If you are unable to attend, you can <a href="${cancelUrl}" style="color: #1976d2; text-decoration: underline;">cancel here</a>.`
            : `Ukoliko niste u mogućnosti da dođete, termin možete <a href="${cancelUrl}" style="color: #1976d2; text-decoration: underline;">otkazati ovdje</a>.`
        }
        <br><br>
        <strong>Hairstyle Vidaković</strong><br>
        ${isEn ? 'Location: Novi Sad | Phone: +381 21 123 456' : 'Lokacija: Novi Sad | Telefon: +381 21 123 456'}
      </p>
    </div>

    <p style="font-size: 11px; color: #444444; margin-top: 20px;">
      ${
        isEn
          ? 'You received this message because you used our online booking system.<br>© 2026 Hairstyle Vidaković. All rights reserved.'
          : 'Ovu poruku ste primili jer ste koristili naš sistem za online rezervacije.<br>© 2026 Hairstyle Vidaković. Sva prava zadržana.'
      }
    </p>
  </div>
</body>
</html>`;

    return {
      subject,
      text,
      headers: {
        'List-Unsubscribe': `<${cancelUrl}>`,
        'X-Entity-Ref-ID': bookingId,
      },
      html,
    };
  }

  getCancellationEmail(params: {
    name: string;
    formattedDate: string;
    time: string;
    services: string[];
    lang?: string;
  }): { subject: string; html: string } {
    const { name, formattedDate, time, services, lang = 'sr' } = params;
    const isEn = lang === 'en';
    const serviceList =
      services.map((s) => this.getServiceName(s, lang ?? 'sr')).join(', ') ||
      (isEn ? 'Not specified' : 'Nije navedeno');
    const clientName = name || (isEn ? 'Client' : 'Klijentu');
    const bookingUrl = 'https://booking-ashen-nine.vercel.app/';

    const subject = isEn
      ? `Appointment Cancelled: ${formattedDate} at ${time}`
      : `Otkazan termin: ${formattedDate} u ${time}`;

    const html = `
<div style="background-color: #121212; padding: 40px 10px; font-family: 'Segoe UI', Arial, sans-serif; color: #ffffff; text-align: center;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #1e1e1e; border: 1px solid #333333; border-radius: 20px; padding: 30px;">

    <h1 style="color: #ff5252; margin-top: 0;">
      ${isEn ? 'Appointment Cancelled' : 'Termin je otkazan'}
    </h1>

    <p style="font-size: 16px; color: #eeeeee;">
      ${
        isEn
          ? `Hello ${clientName}, we are letting you know that your appointment has been cancelled.`
          : `Zdravo ${clientName}, obavještavamo Vas da je Vaš termin otkazan.`
      }
    </p>

    <div style="background-color: #2a2a2a; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: left; border: 1px solid #444444;">
      <p style="margin: 5px 0; color: #ffffff;">
        <strong>📅 ${isEn ? 'Date' : 'Datum'}:</strong> ${formattedDate}
      </p>
      <p style="margin: 5px 0; color: #ffffff;">
        <strong>⏰ ${isEn ? 'Time' : 'Vrijeme'}:</strong> ${time}
      </p>
      <p style="margin: 5px 0; color: #ffffff;">
        <strong>✂️ ${isEn ? 'Services' : 'Usluge'}:</strong> ${serviceList}
      </p>
    </div>

    <a href="${bookingUrl}"
       style="display: inline-block; margin-top: 20px; padding: 12px 25px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold;">
      ${isEn ? 'BOOK A NEW APPOINTMENT' : 'ZAKAŽI NOVI TERMIN'}
    </a>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333333; font-size: 13px; color: #777777;">
      <strong>Hairstyle Vidaković</strong><br>
      ${isEn ? 'Location: Novi Sad | Phone: +381 21 123 456' : 'Lokacija: Novi Sad | Telefon: +381 21 123 456'}
    </p>
  </div>

  <p style="font-size: 11px; color: #444444; margin-top: 20px;">
    ${
      isEn
        ? '© 2026 Hairstyle Vidaković. All rights reserved.'
        : '© 2026 Hairstyle Vidaković. Sva prava zadržana.'
    }
  </p>
</div>`;

    return { subject, html };
  }
}
