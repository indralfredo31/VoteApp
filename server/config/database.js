/**
 * Database Layer - Firebase Firestore
 * Replaces JSON file storage with Firestore
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

// ============ USER HELPERS ============

async function getUserByNim(nim) {
  const db = getDb();
  if (!db) return null;
  const snap = await db.collection(COL.USERS).where('nim', '==', nim).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  return { id: snap.docs[0].id, ...d };
}

async function getUserById(docId) {
  const db = getDb();
  if (!db) return null;
  const doc = await db.collection(COL.USERS).doc(docId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function createUser(userData) {
  const db = getDb();
  if (!db) return null;
  // Find max id
  const snap = await db.collection(COL.USERS).orderBy('id', 'desc').limit(1).get();
  const maxId = snap.empty ? 0 : (snap.docs[0].data().id || 0);

  const user = {
    id: maxId + 1,
    nim: userData.nim,
    dob: userData.dob,
    nama: userData.nama,
    prodi: userData.prodi || '',
    has_voted: 0,
    voted_at: null,
    voted_for: null,
    created_at: new Date().toISOString()
  };
  const ref = await db.collection(COL.USERS).add(user);
  return { id: ref.id, ...user };
}

async function updateUserVote(userId, candidateId) {
  const db = getDb();
  if (!db) return null;
  // Find doc by user id field
  const snap = await db.collection(COL.USERS).where('id', '==', parseInt(userId)).limit(1).get();
  if (snap.empty) return null;
  const docRef = snap.docs[0].ref;
  await docRef.update({
    has_voted: 1,
    voted_at: new Date().toISOString(),
    voted_for: parseInt(candidateId)
  });
  return (await docRef.get()).data();
}

async function resetAllUserVotes() {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.USERS).get();
  const batch = db.batch();
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { has_voted: 0, voted_at: null, voted_for: null });
  });
  await batch.commit();
}

async function getAllUsers() {
  const db = getDb();
  if (!db) return [];
  const snap = await db.collection(COL.USERS).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ============ CANDIDATE HELPERS ============

async function getAllCandidates() {
  const db = getDb();
  if (!db) return [];
  const snap = await db.collection(COL.CANDIDATES).orderBy('nomor_urut').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getCandidateById(docId) {
  const db = getDb();
  if (!db) return null;
  const doc = await db.collection(COL.CANDIDATES).doc(docId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function getCandidateByNomorUrut(nomor) {
  const db = getDb();
  if (!db) return null;
  const snap = await db.collection(COL.CANDIDATES).where('nomor_urut', '==', nomor).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function createCandidate(candidateData) {
  const db = getDb();
  if (!db) return null;
  const candidate = {
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
  const ref = await db.collection(COL.CANDIDATES).add(candidate);
  return { id: ref.id, ...candidate };
}

async function updateCandidate(id, candidateData) {
  const db = getDb();
  if (!db) return null;
  const docRef = db.collection(COL.CANDIDATES).doc(id);
  const updates = {};
  if (candidateData.nomor_urut != null) updates.nomor_urut = candidateData.nomor_urut;
  if (candidateData.nama_ketua != null) updates.nama_ketua = candidateData.nama_ketua;
  if (candidateData.prodi_ketua != null) updates.prodi_ketua = candidateData.prodi_ketua;
  if (candidateData.foto_ketua != null) updates.foto_ketua = candidateData.foto_ketua;
  if (candidateData.nama_wakil != null) updates.nama_wakil = candidateData.nama_wakil;
  if (candidateData.prodi_wakil != null) updates.prodi_wakil = candidateData.prodi_wakil;
  if (candidateData.foto_wakil != null) updates.foto_wakil = candidateData.foto_wakil;
  if (candidateData.visi != null) updates.visi = candidateData.visi;
  if (candidateData.misi != null) updates.misi = candidateData.misi;
  await docRef.update(updates);
  return (await docRef.get()).data();
}

async function deleteCandidate(id) {
  const db = getDb();
  if (!db) return;
  await db.collection(COL.CANDIDATES).doc(id).delete();
}

async function incrementCandidateVote(candidateId) {
  const db = getDb();
  if (!db) return null;
  // candidateId is document id
  const docRef = db.collection(COL.CANDIDATES).doc(candidateId);
  const doc = await docRef.get();
  if (!doc.exists) return null;
  const current = doc.data().vote_count || 0;
  await docRef.update({ vote_count: current + 1 });
  return (await docRef.get()).data();
}

async function resetAllCandidateVotes() {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.CANDIDATES).get();
  const batch = db.batch();
  snap.docs.forEach(doc => batch.update(doc.ref, { vote_count: 0 }));
  await batch.commit();
}

// ============ VOTING LOG HELPERS ============

async function addVotingLog(userId, candidateId, ipAddress) {
  const db = getDb();
  if (!db) return null;
  const snap = await db.collection(COL.VOTING_LOG).orderBy('id', 'desc').limit(1).get();
  const maxId = snap.empty ? 0 : (snap.docs[0].data().id || 0);
  const log = {
    id: maxId + 1,
    user_id: parseInt(userId),
    candidate_id: parseInt(candidateId),
    voted_at: new Date().toISOString(),
    ip_address: ipAddress || 'unknown'
  };
  const ref = await db.collection(COL.VOTING_LOG).add(log);
  return { id: ref.id, ...log };
}

async function clearVotingLog() {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.VOTING_LOG).get();
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

// ============ SETTINGS HELPERS ============

async function getSettings() {
  const db = getDb();
  if (!db) return {};
  const snap = await db.collection(COL.SETTINGS).limit(1).get();
  if (snap.empty) {
    // Return defaults if no settings doc
    return {
      voting_enabled: true,
      voting_open_at: null,
      voting_close_at: null,
      app_title: 'Pemilihan Ketua Senat',
      app_subtitle: 'Periode 2026'
    };
  }
  return snap.docs[0].data();
}

async function updateSettings(settingsData) {
  const db = getDb();
  if (!db) return null;
  const snap = await db.collection(COL.SETTINGS).limit(1).get();
  const data = { ...(snap.empty ? {} : snap.docs[0].data()), ...settingsData };
  if (snap.empty) {
    await db.collection(COL.SETTINGS).add(data);
  } else {
    await snap.docs[0].ref.update(data);
  }
  return data;
}

// ============ ADMIN HELPERS ============

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

// ============ STATS HELPERS ============

async function getStats() {
  const db = getDb();
  if (!db) return { totalUsers: 0, totalVoted: 0, totalCandidates: 0, totalVotes: 0 };
  const [usersSnap, candidatesSnap] = await Promise.all([
    db.collection(COL.USERS).get(),
    db.collection(COL.CANDIDATES).get()
  ]);
  const users = usersSnap.docs.map(d => d.data());
  const candidates = candidatesSnap.docs.map(d => d.data());
  return {
    totalUsers: users.length,
    totalVoted: users.filter(u => u.has_voted === 1).length,
    totalCandidates: candidates.length,
    totalVotes: candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0)
  };
}

// ============ VOTING STATUS ============

async function isVotingOpen() {
  const settings = await getSettings();
  const now = new Date();

  if (settings.voting_enabled === false) {
    return { open: false, reason: 'voting_disabled' };
  }
  if (settings.voting_open_at) {
    const openTime = new Date(settings.voting_open_at);
    if (now < openTime) return { open: false, reason: 'voting_not_started' };
  }
  if (settings.voting_close_at) {
    const closeTime = new Date(settings.voting_close_at);
    if (now > closeTime) return { open: false, reason: 'voting_ended' };
  }
  return { open: true, reason: null };
}

// ============ SYNC WRAPPER (for legacy routes) ============
// The routes use synchronous-looking calls, but Firestore is async.
// We use a module-level cache + background refresh to simulate sync.

let _cache = null;
let _cacheTimer = null;
const CACHE_TTL = 5000; // 5 seconds

function _scheduleRefresh() {
  if (_cacheTimer) return;
  _cacheTimer = setTimeout(async () => {
    _cacheTimer = null;
    await refreshCache();
  }, CACHE_TTL);
}

// Sync-compatible wrappers (they start an async op but return cached immediately)
function getAllCandidates() { _scheduleRefresh(); return _cache ? _cache.candidates : []; }
function getCandidateById(id) { _scheduleRefresh(); return _cache ? _cache.candidates.find(c => c.id === id || c.id === parseInt(id)) : null; }
function getUserByNim(nim) { _scheduleRefresh(); return _cache ? _cache.users.find(u => u.nim === nim) : null; }
function getUserById(id) { _scheduleRefresh(); return _cache ? _cache.users.find(u => u.id === parseInt(id)) : null; }
function getDatabase() { _scheduleRefresh(); return { users: (_cache || {}).users || [], candidates: (_cache || {}).candidates || [], votingLog: [], settings: (_cache || {}).settings || {}, admin: {} }; }
function getSettings() { _scheduleRefresh(); return (_cache || {}).settings || {}; }
function isVotingOpen() {
  _scheduleRefresh();
  const settings = getSettings();
  const now = new Date();
  if (settings.voting_enabled === false) return { open: false, reason: 'voting_disabled' };
  if (settings.voting_open_at && now < new Date(settings.voting_open_at)) return { open: false, reason: 'voting_not_started' };
  if (settings.voting_close_at && now > new Date(settings.voting_close_at)) return { open: false, reason: 'voting_ended' };
  return { open: true, reason: null };
}

// Actual async operations for route handlers
async function _asyncGetAllCandidates() {
  return getAllCandidates();
}
async function _asyncGetUserByNim(nim) { return getUserByNim(nim); }
async function _asyncUpdateUserVote(userId, candidateId) { await updateUserVote(userId, candidateId); _scheduleRefresh(); }
async function _asyncIncrementCandidateVote(candidateId) { await incrementCandidateVote(candidateId); _scheduleRefresh(); }
async function _asyncAddVotingLog(userId, candidateId, ip) { await addVotingLog(userId, candidateId, ip); }
async function _asyncIsVotingOpen() { return isVotingOpen(); }
async function _asyncGetSettings() { return getSettings(); }
async function _asyncGetStats() { return getStats(); }
async function _asyncAdminLogin(username, password) { return adminLogin(username, password); }
async function _asyncResetAllUserVotes() { await resetAllUserVotes(); _cache = null; await refreshCache(); }
async function _asyncResetAllCandidateVotes() { await resetAllCandidateVotes(); _cache = null; await refreshCache(); }
async function _asyncClearVotingLog() { await clearVotingLog(); }
async function _asyncGetCandidateById(id) { return getCandidateById(id); }
async function _asyncGetCandidateByNomorUrut(nomor) {
  await refreshCache();
  return getCandidates().find(c => c.nomor_urut === nomor);
}
async function _asyncCreateCandidate(data) { const r = await createCandidate(data); _scheduleRefresh(); return r; }
async function _asyncUpdateCandidate(id, data) { const r = await updateCandidate(id, data); _scheduleRefresh(); return r; }
async function _asyncDeleteCandidate(id) { await deleteCandidate(id); _scheduleRefresh(); }
async function _asyncUpdateSettings(data) { const r = await updateSettings(data); _scheduleRefresh(); return r; }
async function _asyncUpdateAdminCredentials(u, p) { await updateAdminCredentials(u, p); }
async function _asyncCreateUser(data) { const r = await createUser(data); _scheduleRefresh(); return r; }

// Need to expose candidates getter for isVotingOpen check
function getCandidates() { return _cache ? _cache.candidates : []; }

async function refreshCache() {
  try {
    const db = getDb();
    if (!db) return;
    const [usersSnap, candidatesSnap, settingsSnap] = await Promise.all([
      db.collection(COL.USERS).get(),
      db.collection(COL.CANDIDATES).get(),
      db.collection(COL.SETTINGS).limit(1).get()
    ]);
    _cache = {
      users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      candidates: candidatesSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nomor_urut || 0) - (b.nomor_urut || 0)),
      settings: settingsSnap.empty ? {} : settingsSnap.docs[0].data()
    };
  } catch (e) {
    console.error('Cache refresh error:', e.message);
  }
}

// Initial cache on module load
refreshCache().catch(() => {});

function getCache() { return _cache; }

module.exports = {
  initDatabase: refreshCache,
  getDatabase,
  getSettings,
  isVotingOpen,
  getStats,
  getAllCandidates: _asyncGetAllCandidates,
  getCandidateById: _asyncGetCandidateById,
  getCandidateByNomorUrut: _asyncGetCandidateByNomorUrut,
  createCandidate: _asyncCreateCandidate,
  updateCandidate: _asyncUpdateCandidate,
  deleteCandidate: _asyncDeleteCandidate,
  incrementCandidateVote: _asyncIncrementCandidateVote,
  resetAllCandidateVotes: _asyncResetAllCandidateVotes,
  getUserByNim: _asyncGetUserByNim,
  getUserById,
  createUser: _asyncCreateUser,
  updateUserVote: _asyncUpdateUserVote,
  resetAllUserVotes: _asyncResetAllUserVotes,
  addVotingLog: _asyncAddVotingLog,
  clearVotingLog: _asyncClearVotingLog,
  updateSettings: _asyncUpdateSettings,
  adminLogin: _asyncAdminLogin,
  updateAdminCredentials: _asyncUpdateAdminCredentials,
  getStats: _asyncGetStats,
  getAllUsers,
  getCache,
  refreshCache
};