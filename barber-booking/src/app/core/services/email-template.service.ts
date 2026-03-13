import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EmailTemplateService {
  getConfirmationEmail(params: {
    vocativeName: string;
    formattedDate: string;
    time: string;
    services: string[];
    confirmUrl: string;
    cancelUrl: string;
    bookingId: string;
  }): { subject: string; text: string; headers: object; html: string } {
    const {
      vocativeName,
      formattedDate,
      time,
      services,
      confirmUrl,
      cancelUrl,
      bookingId,
    } = params;
    const serviceList = services.join(', ');

    return {
      subject: `Potvrda termina - ${formattedDate} u ${time}`,
      text: `Zdravo ${vocativeName},\n\nHvala vam što koristite naš online servis za zakazivanje. Rezervisali ste termin u Barbershop-u za ${formattedDate} u ${time}.\n\nMolimo vas da potvrdite svoj dolazak klikom na ovaj link:\n${confirmUrl}\n\nUkoliko želite da otkažete ovu rezervaciju, kliknite ovde: ${cancelUrl}\n\nDetalji:\nUsluge: ${serviceList}\nLokacija: Kneza Miloša 1, Bijeljina.\n\nOvaj mejl je automatski generisan radi vaše sigurnosti i potvrde mesta u kalendaru.`,
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
    Vaš termin za ${serviceList} je spreman. Potvrdite dolazak klikom na dugme unutar poruke kako bi vaša rezervacija ostala važeća.
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
        <p style="margin: 5px 0; font-size: 15px;"><strong>⏰ VRIJEME:</strong> <span style="color: #1976d2;">${time}h</span></p>
        <p style="margin: 5px 0; font-size: 15px;"><strong>✂️ USLUGE:</strong> ${serviceList}</p>
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
</html>`,
    };
  }

  getCancellationEmail(params: {
    name: string;
    formattedDate: string;
    time: string;
    services: string[];
  }): { subject: string; html: string } {
    const { name, formattedDate, time, services } = params;

    return {
      subject: `Otkazan termin: ${formattedDate} u ${time}`,
      html: `
<div style="background-color: #121212; padding: 40px 10px; font-family: 'Segoe UI', Arial, sans-serif; color: #ffffff; text-align: center;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #1e1e1e; border: 1px solid #333333; border-radius: 20px; padding: 30px;">
    <h1 style="color: #ff5252; margin-top: 0;">Termin je otkazan</h1>
    <p style="font-size: 16px; color: #eeeeee;">Zdravo ${name || 'klijentu'}, obavještavamo Vas da je Vaš termin otkazan.</p>

    <div style="background-color: #2a2a2a; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: left; border: 1px solid #444444;">
      <p style="margin: 5px 0; color: #ffffff;"><strong>📅 Datum:</strong> ${formattedDate}</p>
      <p style="margin: 5px 0; color: #ffffff;"><strong>⏰ Vrijeme:</strong> ${time}</p>
      <p style="margin: 5px 0; color: #ffffff;"><strong>✂️ Usluge:</strong> ${services?.join(', ') || 'Nije navedeno'}</p>
    </div>

    <a href="https://booking-ashen-nine.vercel.app/"
       style="display: inline-block; margin-top: 20px; padding: 12px 25px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold;">
       ZAKAŽI NOVI TERMIN
    </a>
  </div>
</div>`,
    };
  }
}
