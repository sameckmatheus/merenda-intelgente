import * as admin from 'firebase-admin';

let app: admin.app.App;

export function initAdmin() {
  if (admin.apps.length > 0) {
    if (admin.apps[0]) {
      app = admin.apps[0];
    }
    return;
  }

  const encodedCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  if (!encodedCreds) {
    // During build, this may not be set. We can initialize later.
    console.log("GOOGLE_APPLICATION_CREDENTIALS_BASE64 env var not set. Will initialize later if needed.");
    return;
  }

  try {
    const creds = admin.credential.cert(
      JSON.parse(Buffer.from(encodedCreds, 'base64').toString('utf8'))
    );

    app = admin.initializeApp({
      credential: creds,
    });
  } catch (error: any) {
    console.error("Firebase admin initialization error", error.stack);
  }
}

// Ensure it's initialized on module load in the server environment.
initAdmin();

export function isFirebaseAdminInitialized() {
  return !!app;
}

