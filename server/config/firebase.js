/**
 * Firebase Admin SDK Configuration
 * Used server-side for all database operations
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let db = null;

function initFirebase() {
  if (db) return db;

  try {
    // Check for Firebase credentials
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const credentials = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    // Validate required fields
    if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
      console.warn('⚠️ Firebase credentials not fully configured. Using mock mode.');
      return null;
    }

    const app = initializeApp({
      credential: cert(credentials)
    });

    db = getFirestore(app);
    console.log('✅ Firebase Firestore initialized');
  } catch (error) {
    console.error('❌ Firebase init error:', error.message);
    return null;
  }

  return db;
}

// Lazy initialization
function getDb() {
  if (!db) {
    db = initFirebase();
  }
  return db;
}

module.exports = { getDb };