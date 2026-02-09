const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");

// Initialize Firebase Admin using service account JSON from env
function initFirebase() {
  if (admin.apps.length) return admin;
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error("FIREBASE_SERVICE_ACCOUNT env not set");
  const serviceAccount = JSON.parse(svc);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { bookingId, token, email, date, time, name } = req.body || {};
  if (!bookingId || !token || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const adminSdk = initFirebase();
    const db = adminSdk.firestore();

    const sendGridKey = process.env.SENDGRID_API_KEY;
    const sender = process.env.SENDER_EMAIL;
    const frontend = process.env.FRONTEND_URL;

    if (!sendGridKey || !sender || !frontend) {
      return res
        .status(500)
        .json({
          error: "Missing SENDGRID_API_KEY, SENDER_EMAIL, or FRONTEND_URL env",
        });
    }

    sgMail.setApiKey(sendGridKey);

    const confirmUrl = `${frontend.replace(/\/$/, "")}/confirm?bookingId=${encodeURIComponent(
      bookingId,
    )}&token=${encodeURIComponent(token)}`;

    const msg = {
      to: email,
      from: sender,
      subject: "Potvrdi termin - Barber Booking",
      html: `
        <p>Zdravo ${name || ""},</p>
        <p>Hvala što si zakazao termin. Molimo te da potvrdiš svoj termin:</p>
        <p><a href="${confirmUrl}">Potvrdi rezervaciju</a></p>
        <p>Datum: ${date} <br/> Vreme: ${time}</p>
        <p>Ako nisi inicirao ovu rezervaciju, ignoriši ovaj mejl.</p>
      `,
    };

    await sgMail.send(msg);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("sendConfirmationEmail error", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
};
