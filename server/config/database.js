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
let _cache = {
  users: [],
  candidates: [],
  settings: {}
};

// Track listener state
let _listenersInitialized = false;
let _unsnap = () => {};

// ============ REAL-TIME LISTENERS ============

async function initRealtimeListeners() {
  if (_listenersInitialized) return;

  const db = getDb();
  if (!db) {
    console.warn('⚠️ Firebase not initialized. Cannot init realtime listeners.');
    return;
  }

  console.log('🔥 Initializing Firestore real-time listeners...');

  try {
    // Listen to users
    const usersUnsnap = db.collection(COL.USERS).onSnapshot(
      (snap) => {
        _cache.users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`📱 Users updated: ${_cache.users.length} total`);
      },
      (err) => console.error('Error listening to users:', err.message)
    );

    // Listen to candidates (ordered by nomor_urut)
    const candidatesUnsnap = db.collection(COL.CANDIDATES).orderBy('nomor_urut').onSnapshot(
      (snap) => {
        _cache.candidates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
}

// Stop all listeners (for cleanup)
function stopRealtimeListeners() {
  _unsnap();
  _listenersInitialized = false;
}

// ============ SYNC-STYLE WRAPPERS (return cached data immediately) ============

function getDatabase() {
  // Auto-init listeners on first access
  if (!_listenersInitialized) initRealtimeListeners().catch(() => {});
  return { users: _cache.users, candidates: _cache.candidates, votingLog: [], settings: _cache.settings, admin: {} };
}

function getAllCandidates() {
  if (!_listenersInitialized) initRealtimeListeners().catch(() => {});
  return _cache.candidates;
}

function getCandidateById(id) {
  if (!_listenersInitialized) initRealtimeListeners().catch(() => {});
  return _cache.candidates.find(c => c.id === id || c.id === String(id) || c.nomor_urut === parseInt(id));
}

function getUserByNim(nim) {
  if (!_listenersInitialized) initRealtimeListeners().catch(() => {});
  return _cache.users.find(u => u.nim === nim);
}

function getUserById(id) {
  if (!_listenersInitialized) initRealtimeListeners().catch(() => {});
  return _cache.users.find(u => u.id === id || u.id === String(id));
}

function getSettings() {
  if (!_listenersInitialized) {
    initRealtimeListeners().catch(() => {});
    if (Object.keys(_cache.settings).length === 0) {
      refreshCache().catch(() => {});
    }
  }
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
      users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      candidates: candidatesSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nomor_urut || 0) - (b.nomor_urut || 0)),
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
  // Update cache immediately
  _cache.users = [..._cache.users, { id: ref.id, ...user }];
  return { id: ref.id, ...user };
}

async function updateUserVote(userId, candidateId) {
  const db = getDb();
  if (!db) return;

  // Try doc ID match first (user.id = Firestore doc id string)
  let user = _cache.users.find(u => u.id === userId || u.id === String(userId) || u.id === parseInt(userId));

  // Fallback: if not found by doc id, query Firestore directly by id/nim field
  if (!user) {
    const snap = await db.collection(COL.USERS)
      .where('id', '==', userId)
      .limit(1)
      .get()
      .catch(() => ({ docs: [] }));
    if (!snap.empty) {
      user = { id: snap.docs[0].id, ...snap.docs[0].data() };
    } else {
      // Try by nim as last resort
      const nimSnap = await db.collection(COL.USERS)
        .where('nim', '==', String(userId))
        .limit(1)
        .get()
        .catch(() => ({ docs: [] }));
      if (!nimSnap.empty) {
        user = { id: nimSnap.docs[0].id, ...nimSnap.docs[0].data() };
      }
    }
  }

  if (!user) {
    console.warn('User not found by id:', userId);
    return;
  }

  // Update by Firestore document ID directly
  await db.collection(COL.USERS).doc(user.id).update({
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
  // Update cache immediately
  _cache.candidates = [..._cache.candidates, candidate].sort((a, b) => (a.nomor_urut || 0) - (b.nomor_urut || 0));
  return { id: String(nextId), ...candidate };
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
  // Update cache immediately
  _cache.candidates = _cache.candidates.map(c => c.id === id || c.id === String(id) ? { ...c, ...updates } : c);
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

async function deleteCandidate(id) {
  const db = getDb();
  if (!db) return;
  await db.collection(COL.CANDIDATES).doc(String(id)).delete();
  // Update cache immediately
  _cache.candidates = _cache.candidates.filter(c => c.id !== id && c.id !== String(id));
}

async function incrementCandidateVote(candidateId) {
  const db = getDb();
  if (!db) return;

  // Find the doc id for this candidate
  let candidate = _cache.candidates.find(c =>
    c.id === candidateId || c.id === String(candidateId) || c.nomor_urut === parseInt(candidateId)
  );

  // Fallback: query Firestore by nomor_urut if not found in cache
  if (!candidate) {
    const snap = await db.collection(COL.CANDIDATES)
      .where('nomor_urut', '==', parseInt(candidateId))
      .limit(1)
      .get()
      .catch(() => ({ empty: true }));
    if (!snap.empty) {
      candidate = { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  }

  if (!candidate) {
    console.warn('Candidate not found:', candidateId);
    return;
  }

  const docRef = db.collection(COL.CANDIDATES).doc(candidate.id);
  const doc = await docRef.get();
  if (!doc.exists) return;
  const current = doc.data().vote_count || 0;
  await docRef.update({ vote_count: current + 1 });
  // Update cache immediately
  _cache.candidates = _cache.candidates.map(c =>
    c.id === candidate.id ? { ...c, vote_count: current + 1 } : c
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