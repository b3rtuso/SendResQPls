import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let firebaseApp: admin.app.App | null = null;

try {
  const credentialsPath = path.join(__dirname, 'firebase-credentials.json');
  if (fs.existsSync(credentialsPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('🔥 Firebase Admin SDK initialized successfully.');
  } else {
    console.warn('⚠️ Firebase credentials file not found at src/config/firebase-credentials.json. Push notifications will be skipped.');
  }
} catch (error: any) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
}

export const messaging = firebaseApp ? admin.messaging(firebaseApp) : null;
