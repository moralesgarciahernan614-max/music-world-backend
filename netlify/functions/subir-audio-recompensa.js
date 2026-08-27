const admin = require("./_firebaseAdmin");
const db = admin.firestore();

const MONEDAS_POR_SUBIR = 10;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método no permitido" };
  }
  try {
    const { idToken, audioId } = JSON.parse(event.body);
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const audioRef = db.collection("audios").doc(audioId);
    const perfilRef = db.collection("perfiles").doc(uid);

    const monedasTotales = await db.runTransaction(async (t) => {
      const audioSnap = await t.get(audioRef);
      if (!audioSnap.exists) throw new Error("Ese audio no existe.");
      const audio = audioSnap.data();

      if (audio.ownerId !== uid) throw new Error("Ese audio no te pertenece.");
      if (audio.monedasOtorgadas) throw new Error("Ya se otorgaron monedas por este audio.");

      const perfilSnap = await t.get(perfilRef);
      const monedasActuales = perfilSnap.exists ? (perfilSnap.data().monedas || 0) : 0;
      const nuevoTotal = monedasActuales + MONEDAS_POR_SUBIR;

      t.update(audioRef, { monedasOtorgadas: true });
      t.set(perfilRef, { monedas: nuevoTotal }, { merge: true });

      return nuevoTotal;
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, monedasTotales }) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
