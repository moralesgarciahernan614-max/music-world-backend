const admin = require("firebase-admin");

// La clave del service account se guarda como variable de entorno en Netlify
// (nunca se sube al código ni al repositorio).
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
