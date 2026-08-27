const admin = require("./_firebaseAdmin");
const db = admin.firestore();

const COSTO_DESCARGA = 5;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método no permitido" };
  }
  try {
    const { idToken } = JSON.parse(event.body);
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const perfilRef = db.collection("perfiles").doc(uid);

    const monedasRestantes = await db.runTransaction(async (t) => {
      const snap = await t.get(perfilRef);
      const monedas = snap.exists ? (snap.data().monedas || 0) : 0;

      if (monedas < COSTO_DESCARGA) {
        throw new Error(`Te faltan monedas. Tenés ${monedas} y necesitás ${COSTO_DESCARGA}.`);
      }

      t.set(perfilRef, { monedas: monedas - COSTO_DESCARGA }, { merge: true });
      return monedas - COSTO_DESCARGA;
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, monedasRestantes }) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
