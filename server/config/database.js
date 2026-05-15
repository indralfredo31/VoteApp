/**
 * Database Layer - Firebase Firestore with Real-time Support
 * Uses Firestore listeners for real-time updates
 */
const { getDb } = require('./firebase');

// Firestore collection names
const COL = {
  USERS: 'users',
  CANDIDATES: 'candidates',
  VOTING_LOG: 'voting_log',
  SETTINGS: 'settings',
  ADMIN: 'admin'
};

// In-memory cache (instant access, kept fresh by listeners)
// IMPORTANT: store Firestore doc ID in `docId` to avoid conflict with numeric `id` field
let _cache = {
  users: [],
  candidates: [],
  settings: {}
};

// Track listener state
let _listenersInitialized = false;
let _initPromise = null;  // single shared init promise to avoid duplicate work
let _unsnap = () => {};

// ============ REAL-TIME LISTENERS ============

async function initRealtimeListeners() {
  if (_listenersInitialized) return _initPromise;
  if (_initPromise) return _initPromise;

  const initPromise = (async () => {
    const db = getDb();
    if (!db) {
      console.warn('⚠️ Firebase not initialized. Cannot init realtime listeners.');
      return;
    }

    console.log('🔥 Initializing Firestore real-time listeners...');

    try {
      // Listen to users — store Firestore doc id in docId, numeric id in id
      const usersUnsnap = db.collection(COL.USERS).onSnapshot(
        (snap) => {
          _cache.users = snap.docs.map(d => {
            const data = d.data();
            return {
              docId: d.id,          // Firestore document ID
              id: data.id ?? d.id,  // numeric id field (falls back to docId)
              ...data
            };
          });
          console.log(`📱 Users updated: ${_cache.users.length} total`);
        },
        (err) => console.error('Error listening to users:', err.message)
      );

      // Listen to candidates (ordered by nomor_urut)
      const candidatesUnsnap = db.collection(COL.CANDIDATES).orderBy('nomor_urut').onSnapshot(
        (snap) => {
          _cache.candidates = snap.docs.map(d => {
            const data = d.data();
            return {
              docId: d.id,          // Firestore document ID
              id: data.id ?? d.id,  // numeric id field (falls back to docId)
              ...data
            };
          });
          console.log(`📱 Candidates updated: ${_cache.candidates.length} total`);
        },
        (err) => console.error('Error listening to candidates:', err.message)
      );

      // Listen to settings
      const settingsUnsnap = db.collection(COL.SETTINGS).limit(1).onSnapshot(
        (snap) => {
          _cache.settings = snap.docs[0]?.data() || {};
          console.log('📱 Settings updated');
        },
        (err) => console.error('Error listening to settings:', err.message)
      );

      // Combined cleanup function
      _unsnap = () => {
        usersUnsnap();
        candidatesUnsnap();
        settingsUnsnap();
      };

      _listenersInitialized = true;
      console.log('✅ Firestore real-time listeners initialized');
    } catch (e) {
      console.error('Error initializing realtime listeners:', e.message);
    }
  })();

  _initPromise = initPromise;
  return initPromise;
}

// Stop all listeners (for cleanup)
function stopRealtimeListeners() {
  _unsnap();
  _listenersInitialized = false;
}

// ============ SYNC-STYLE WRAPPERS (return cached data immediately) ============

// Shared promise that blocks until cache is populated with Firestore data
let _initPromise = null;

async function ensureInit() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const db = getDb();
    if (!db) return;

    // Use a one-shot Firestore .get() to guarantee data is loaded on first request
    // (real-time listeners are for keeping cache fresh after initial load)
    try {
      const [usersSnap, candidatesSnap, settingsSnap] = await Promise.all([
        db.collection(COL.USERS).get(),
        db.collection(COL.CANDIDATES).orderBy('nomor_urut').get(),
        db.collection(COL.SETTINGS).limit(1).get()
      ]);
      _cache.users = usersSnap.docs.map(d => {
        const data = d.data();
        return { docId: d.id, id: data.id ?? d.id, ...data };
      });
      _cache.candidates = candidatesSnap.docs.map(d => {
        const data = d.data();
        return { docId: d.id, id: data.id ?? d.id, ...data };
      });
      _cache.settings = settingsSnap.docs[0]?.data() || {};
      console.log(`✅ Cache loaded: users=${_cache.users.length}, candidates=${_cache.candidates.length}`);
    } catch (e) {
      console.error('Cache load error:', e.message);
    }

    // Start real-time listeners for future updates (non-blocking)
    initRealtimeListeners().catch(() => {});
  })();
  return _initPromise;
}

function getDatabase() {
  // Auto-init listeners on first access
  if (!_listenersInitialized) initRealtimeListeners().catch(() => {});
  return { users: _cache.users, candidates: _cache.candidates, votingLog: [], settings: _cache.settings, admin: {} };
}

async function getAllCandidates() {
  await ensureInit();
  return _cache.candidates;
}

async function getCandidateById(id) {
  await ensureInit();
  // Match by docId OR numeric id field OR nomor_urut
  return _cache.candidates.find(c =>
    c.docId === id || c.docId === String(id) ||
    c.id === id || c.id === parseInt(id) ||
    c.nomor_urut === parseInt(id)
  );
}

async function getUserByNim(nim) {
  await ensureInit();
  return _cache.users.find(u => u.nim === nim);
}

async function getUserById(id) {
  await ensureInit();
  // Match by docId OR numeric id field
  return _cache.users.find(u => u.docId === id || u.docId === String(id) || u.id === id || u.id === parseInt(id));
}

async function getSettings() {
  await ensureInit();
  return _cache.settings;
}

async function isVotingOpen() {
  if (!_listenersInitialized) {
    // Ensure listeners are started
    initRealtimeListeners().catch(() => {});
    // If cache is still empty (first call / cold start), wait for cache to load
    if (Object.keys(_cache.settings).length === 0) {
      await refreshCache().catch(() => {});
    }
  }
  const settings = _cache.settings || {};
  const now = new Date();

  // FIXED: Correct logic per requirement
  // If voting_enabled (manual control) is ON, voting is OPEN regardless of schedule
  // If voting_enabled is OFF, check the schedule
  if (settings.voting_enabled === true) {
    // Manual override: voting is OPEN
    return { open: true, reason: null };
  }

  // Manual control is OFF, check schedule
  if (settings.voting_open_at && now < new Date(settings.voting_open_at)) {
    return { open: false, reason: 'voting_not_started' };
  }
  if (settings.voting_close_at && now > new Date(settings.voting_close_at)) {
    return { open: false, reason: 'voting_ended' };
  }

  // No schedule set, voting is closed when manual control is off
  if (!settings.voting_open_at && !settings.voting_close_at) {
    return { open: false, reason: 'voting_disabled' };
  }

  // Within schedule window
  return { open: true, reason: null };
}

function getCache() { return _cache; }

// ============ ASYNC OPERATIONS (for route handlers) ============

async function refreshCache() {
  const db = getDb();
  if (!db) {
    console.warn('⚠️ Firebase not initialized. Using empty cache.');
    return;
  }
  try {
    const [usersSnap, candidatesSnap, settingsSnap] = await Promise.all([
      db.collection(COL.USERS).get().catch(() => ({ docs: [] })),
      db.collection(COL.CANDIDATES).orderBy('nomor_urut').get().catch(() => ({ docs: [] })),
      db.collection(COL.SETTINGS).limit(1).get().catch(() => ({ docs: [] }))
    ]);
    _cache = {
      users: usersSnap.docs.map(d => {
        const data = d.data();
        return { docId: d.id, id: data.id ?? d.id, ...data };
      }),
      candidates: candidatesSnap.docs.map(d => {
        const data = d.data();
        return { docId: d.id, id: data.id ?? d.id, ...data };
      }).sort((a, b) => (a.nomor_urut || 0) - (b.nomor_urut || 0)),
      settings: settingsSnap.docs[0]?.data() || {}
    };
    console.log('✅ Cache refreshed: users=%d, candidates=%d', _cache.users.length, _cache.candidates.length);
  } catch (e) {
    console.error('Cache refresh error:', e.message);
  }
}

// User operations
async function createUser(userData) {
  const db = getDb();
  if (!db) return null;
  const maxId = _cache.users.length > 0 ? Math.max(..._cache.users.map(u => typeof u.id === 'number' ? u.id : 0)) : 0;
  const user = { id: maxId + 1, nim: userData.nim, dob: userData.dob, nama: userData.nama, prodi: userData.prodi || '', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() };
  const ref = await db.collection(COL.USERS).add(user);
  const newUser = { docId: ref.id, id: ref.id, ...user };
  // Update cache immediately
  _cache.users = [..._cache.users, newUser];
  return newUser;
}

async function updateUserVote(userId, candidateId) {
  const db = getDb();
  if (!db) return;

  // Find user by docId OR numeric id field
  const user = _cache.users.find(u =>
    u.docId === userId || u.docId === String(userId) ||
    u.id === userId || u.id === parseInt(userId)
  );

  if (!user) {
    console.warn('User not found by id:', userId);
    return;
  }

  // Update by Firestore DOCUMENT ID (docId) — never the numeric id field
  await db.collection(COL.USERS).doc(user.docId).update({
    has_voted: 1,
    voted_at: new Date().toISOString(),
    voted_for: candidateId
  });
}

async function resetAllUserVotes() {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.USERS).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { has_voted: 0, voted_at: null, voted_for: null }));
  await batch.commit();
  // Update cache immediately
  _cache.users = _cache.users.map(u => ({ ...u, has_voted: 0, voted_at: null, voted_for: null }));
}

async function getAllUsers() {
  // Return from cache (always fresh with real-time listener)
  return _cache.users;
}

// Candidate operations
async function getCandidateByNomorUrut(nomor) {
  await ensureInit();
  return _cache.candidates.find(c => c.nomor_urut === parseInt(nomor));
}

async function createCandidate(candidateData) {
  const db = getDb();
  if (!db) return null;
  const counterRef = db.collection('counters').doc('candidates');
  const counterSnap = await counterRef.get();
  const nextId = counterSnap.exists ? (counterSnap.data().current || 0) + 1 : 1;
  await counterRef.set({ current: nextId });
  const candidate = {
    id: nextId,
    nomor_urut: candidateData.nomor_urut,
    nama_ketua: candidateData.nama_ketua,
    prodi_ketua: candidateData.prodi_ketua || '',
    foto_ketua: candidateData.foto_ketua || null,
    nama_wakil: candidateData.nama_wakil,
    prodi_wakil: candidateData.prodi_wakil || '',
    foto_wakil: candidateData.foto_wakil || null,
    visi: candidateData.visi || '',
    misi: candidateData.misi || '',
    vote_count: 0,
    created_at: new Date().toISOString()
  };
  const ref = await db.collection(COL.CANDIDATES).doc(String(nextId));
  await ref.set(candidate);
  const newCandidate = { docId: ref.id, id: String(nextId), ...candidate };
  // Update cache immediately
  _cache.candidates = [..._cache.candidates, newCandidate].sort((a, b) => (a.nomor_urut || 0) - (b.nomor_urut || 0));
  return newCandidate;
}

async function updateCandidate(id, candidateData) {
  const db = getDb();
  if (!db) return null;
  const docRef = db.collection(COL.CANDIDATES).doc(String(id));
  const updates = {};
  ['nomor_urut','nama_ketua','prodi_ketua','foto_ketua','nama_wakil','prodi_wakil','foto_wakil','visi','misi'].forEach(k => {
    if (candidateData[k] != null) updates[k] = candidateData[k];
  });
  await docRef.update(updates);
  // Update cache immediately (find by docId)
  _cache.candidates = _cache.candidates.map(c =>
    c.docId === String(id) || c.docId === parseInt(id) ? { ...c, ...updates } : c
  );
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

async function deleteCandidate(id) {
  const db = getDb();
  if (!db) return;
  await db.collection(COL.CANDIDATES).doc(String(id)).delete();
  // Update cache immediately (find by docId)
  _cache.candidates = _cache.candidates.filter(c =>
    c.docId !== String(id) && c.docId !== parseInt(id)
  );
}

async function incrementCandidateVote(candidateId) {
  const db = getDb();
  if (!db) return;

  // Find the doc id for this candidate — check docId, numeric id, and nomor_urut
  let candidate = _cache.candidates.find(c =>
    c.docId === candidateId || c.docId === String(candidateId) ||
    c.id === candidateId || c.id === parseInt(candidateId) ||
    c.nomor_urut === parseInt(candidateId)
  );

  if (!candidate) {
    console.warn('Candidate not found:', candidateId);
    return;
  }

  // Use Firestore DOCUMENT ID (docId) — never the numeric id field
  const docRef = db.collection(COL.CANDIDATES).doc(candidate.docId);
  const doc = await docRef.get();
  if (!doc.exists) return;
  const current = doc.data().vote_count || 0;
  await docRef.update({ vote_count: current + 1 });
  // Update cache immediately
  _cache.candidates = _cache.candidates.map(c =>
    c.docId === candidate.docId ? { ...c, vote_count: current + 1 } : c
  );
}

async function resetAllCandidateVotes() {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.CANDIDATES).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { vote_count: 0 }));
  await batch.commit();
  // Update cache immediately
  _cache.candidates = _cache.candidates.map(c => ({ ...c, vote_count: 0 }));
}

// Voting log
async function addVotingLog(userId, candidateId, ip) {
  const db = getDb();
  if (!db) return null;
  const log = {
    user_id: typeof userId === 'number' ? userId : parseInt(userId) || userId,
    candidate_id: typeof candidateId === 'number' ? candidateId : parseInt(candidateId) || candidateId,
    voted_at: new Date().toISOString(),
    ip_address: ip || 'unknown'
  };
  const ref = await db.collection(COL.VOTING_LOG).add(log);
  return { id: ref.id, ...log };
}

async function clearVotingLog() {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.VOTING_LOG).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// Settings
async function updateSettings(settingsData) {
  const db = getDb();
  if (!db) return null;
  const snap = await db.collection(COL.SETTINGS).limit(1).get();
  const data = { ...(snap.docs[0]?.data() || {}), ...settingsData };
  if (snap.empty) {
    await db.collection(COL.SETTINGS).add(data);
  } else {
    await snap.docs[0].ref.update(data);
  }
  // Update cache immediately
  _cache.settings = data;
  return data;
}

// Admin
async function adminLogin(username, password) {
  const db = getDb();
  if (!db) return false;
  const snap = await db.collection(COL.ADMIN).where('username', '==', username).where('password', '==', password).limit(1).get();
  return !snap.empty;
}

async function updateAdminCredentials(username, password) {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.ADMIN).limit(1).get();
  const data = { username, password };
  if (snap.empty) {
    await db.collection(COL.ADMIN).add(data);
  } else {
    await snap.docs[0].ref.update(data);
  }
}

// Stats - always from fresh cache
async function getStats() {
  const users = _cache.users;
  const candidates = _cache.candidates;
  return {
    totalUsers: users.length,
    totalVoted: users.filter(u => u.has_voted === 1).length,
    totalCandidates: candidates.length,
    totalVotes: candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0)
  };
}

// ============ MODULE EXPORTS ============

// Init on load (non-blocking) - starts real-time listeners
initRealtimeListeners().catch(() => {});

module.exports = {
  initDatabase: refreshCache,
  initRealtimeListeners,
  stopRealtimeListeners,
  getDatabase,
  getSettings,
  isVotingOpen,
  getStats,
  getAllCandidates,
  getCandidateById,
  getCandidateByNomorUrut,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  incrementCandidateVote,
  resetAllCandidateVotes,
  getUserByNim,
  getUserById,
  createUser,
  updateUserVote,
  resetAllUserVotes,
  addVotingLog,
  clearVotingLog,
  updateSettings,
  adminLogin,
  updateAdminCredentials,
  getAllUsers,
  getCache,
  refreshCache
};