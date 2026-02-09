const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps.length) return admin;
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error("FIREBASE_SERVICE_ACCOUNT env not set");
  const serviceAccount = JSON.parse(svc);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin;
}

module.exports = async (req, res) => {
  try {
    const { bookingId, token } =
      req.method === "GET" ? req.query : req.body || {};
    if (!bookingId || !token)
      return res.status(400).send("Missing bookingId or token");

    const adminSdk = initFirebase();
    const db = adminSdk.firestore();

    const docRef = db.collection("bookings").doc(bookingId);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).send("Booking not found");

    const data = doc.data();
    if (data.status === "confirmed") {
      const redirectOk = `${(process.env.FRONTEND_URL || "/").replace(/\/$/, "")}/confirmation?status=already`;
      return res.redirect(302, redirectOk);
    }

    if (data.confirmationToken !== token) {
      const redirectFail = `${(process.env.FRONTEND_URL || "/").replace(/\/$/, "")}/confirmation?status=invalid`;
      return res.redirect(302, redirectFail);
    }

    await docRef.update({
      status: "confirmed",
      confirmedAt: adminSdk.firestore.FieldValue.serverTimestamp(),
    });

    const redirect = `${(process.env.FRONTEND_URL || "/").replace(/\/$/, "")}/confirmation?status=success`;
    return res.redirect(302, redirect);
  } catch (err) {
    console.error("confirmBooking error", err);
    return res.status(500).send("Server error");
  }
};
