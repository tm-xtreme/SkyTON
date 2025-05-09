import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load the environment variables
dotenv.config();

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Ensure newlines are handled
      }),
    });
    console.log('Firebase app initialized');
  } catch (e) {
    console.error('Firebase admin initialization error', e);
  }
}

const db = getFirestore();

export { db };
