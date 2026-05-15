/**
 * Firestore-based Session Store for express-session
 * Enables persistent sessions in Vercel serverless environment
 */

const { getDb } = require('./firebase');

class FirestoreSessionStore {
  constructor(options = {}) {
    this.collection = options.collection || 'sessions';
    this.expiryKey = options.expiryKey || 'expires';
  }

  async get(sid, callback = () => {}) {
    try {
      const db = getDb();
      if (!db) return callback(null, null);

      const doc = await db.collection(this.collection).doc(sid).get();
      if (!doc.exists) return callback(null, null);

      const session = JSON.parse(doc.data().session);

      // Check if expired
      if (session.cookie && session.cookie.expires) {
        const expires = new Date(session.cookie.expires);
        if (expires < new Date()) {
          await this.destroy(sid);
          return callback(null, null);
        }
      }

      callback(null, session);
    } catch (error) {
      console.error('Session get error:', error);
      callback(error);
    }
  }

  async set(sid, session, callback = () => {}) {
    try {
      const db = getDb();
      if (!db) return callback(new Error('Database not available'));

      const expires = session.cookie?.expires
        ? new Date(session.cookie.expires)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.collection(this.collection).doc(sid).set({
        session: JSON.stringify(session),
        expires: expires.toDate(),
        lastAccess: new Date().toDate()
      });

      callback(null);
    } catch (error) {
      console.error('Session set error:', error);
      callback(error);
    }
  }

  async destroy(sid, callback = () => {}) {
    try {
      const db = getDb();
      if (!db) return callback(null);

      await db.collection(this.collection).doc(sid).delete();
      callback(null);
    } catch (error) {
      console.error('Session destroy error:', error);
      callback(error);
    }
  }

  // Optional: touch to update expiration
  async touch(sid, session, callback = () => {}) {
    try {
      const db = getDb();
      if (!db) return callback(null);

      const expires = session.cookie?.expires
        ? new Date(session.cookie.expires)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.collection(this.collection).doc(sid).update({
        session: JSON.stringify(session),
        expires: expires.toDate(),
        lastAccess: new Date().toDate()
      });

      callback(null);
    } catch (error) {
      console.error('Session touch error:', error);
      callback(error);
    }
  }

  // Cleanup expired sessions (call periodically)
  async cleanup() {
    try {
      const db = getDb();
      if (!db) return;

      const now = new Date();
      const snapshot = await db.collection(this.collection)
        .where('expires', '<', now.toDate())
        .get();

      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      if (snapshot.size > 0) {
        await batch.commit();
        console.log(`🧹 Cleaned up ${snapshot.size} expired sessions`);
      }
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }
}

module.exports = FirestoreSessionStore;
