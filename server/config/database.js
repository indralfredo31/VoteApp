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

// In-memory cache for sync-style access
let _cache = {
  users: [],
  candidates: [],
  settings: {}
};
let _cacheTimer = null;
const CACHE_TTL = 5000;

// Lazy cache refresh
function _scheduleRefresh() {
  if (_cacheTimer) return;
  _cacheTimer = setTimeout(() => {
    _cacheTimer = null;
    refreshCache().catch(() => {});
  }, CACHE_TTL);
}

// ============ SYNC-STYLE WRAPPERS (return cached data immediately) ============

function getDatabase() { _scheduleRefresh(); return { users: _cache.users, candidates: _cache.candidates, votingLog: [], settings: _cache.settings, admin: {} }; }
function getAllCandidates() { _scheduleRefresh(); return _cache.candidates; }
function getCandidateById(id) { _scheduleRefresh(); return _cache.candidates.find(c => c.id === id || c.id === parseInt(id) || c.nomor_urut === parseInt(id)); }
function getUserByNim(nim) { _scheduleRefresh(); return _cache.users.find(u => u.nim === nim); }
function getUserById(id) { _scheduleRefresh(); return _cache.users.find(u => u.id === parseInt(id)); }
function getSettings() { _scheduleRefresh(); return _cache.settings; }
function isVotingOpen() {
  _scheduleRefresh();
  const settings = _cache.settings || {};
  const now = new Date();
  if (settings.voting_enabled === false) return { open: false, reason: 'voting_disabled' };
  if (settings.voting_open_at && now < new Date(settings.voting_open_at)) return { open: false, reason: 'voting_not_started' };
  if (settings.voting_close_at && now > new Date(settings.voting_close_at)) return { open: false, reason: 'voting_ended' };
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
  const maxId = _cache.users.length > 0 ? Math.max(..._cache.users.map(u => u.id || 0)) : 0;
  const user = { id: maxId + 1, nim: userData.nim, dob: userData.dob, nama: userData.nama, prodi: userData.prodi || '', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() };
  const ref = await db.collection(COL.USERS).add(user);
  _scheduleRefresh();
  return { id: ref.id, ...user };
}

async function updateUserVote(userId, candidateId) {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.USERS).where('id', '==', parseInt(userId)).limit(1).get();
  if (snap.empty) return;
  await snap.docs[0].ref.update({ has_voted: 1, voted_at: new Date().toISOString(), voted_for: parseInt(candidateId) });
  _scheduleRefresh();
}

async function resetAllUserVotes() {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.USERS).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { has_voted: 0, voted_at: null, voted_for: null }));
  await batch.commit();
  _cache = { ..._cache, users: _cache.users.map(u => ({ ...u, has_voted: 0, voted_at: null, voted_for: null })) };
}

async function getAllUsers() {
  const db = getDb();
  if (!db) return _cache.users;
  try {
    const snap = await db.collection(COL.USERS).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return _cache.users; }
}

// Candidate operations
async function getCandidateByNomorUrut(nomor) {
  await refreshCache();
  return _cache.candidates.find(c => c.nomor_urut === parseInt(nomor));
}

async function createCandidate(candidateData) {
  const db = getDb();
  if (!db) return null;
  const candidate = { nomor_urut: candidateData.nomor_urut, nama_ketua: candidateData.nama_ketua, prodi_ketua: candidateData.prodi_ketua || '', foto_ketua: candidateData.foto_ketua || null, nama_wakil: candidateData.nama_wakil, prodi_wakil: candidateData.prodi_wakil || '', foto_wakil: candidateData.foto_wakil || null, visi: candidateData.visi || '', misi: candidateData.misi || '', vote_count: 0, created_at: new Date().toISOString() };
  const ref = await db.collection(COL.CANDIDATES).add(candidate);
  _scheduleRefresh();
  return { id: ref.id, ...candidate };
}

async function updateCandidate(id, candidateData) {
  const db = getDb();
  if (!db) return null;
  const docRef = db.collection(COL.CANDIDATES).doc(id);
  const updates = {};
  ['nomor_urut','nama_ketua','prodi_ketua','foto_ketua','nama_wakil','prodi_wakil','foto_wakil','visi','misi'].forEach(k => {
    if (candidateData[k] != null) updates[k] = candidateData[k];
  });
  await docRef.update(updates);
  _scheduleRefresh();
  const doc = await docRef.get();
  return doc.data();
}

async function deleteCandidate(id) {
  const db = getDb();
  if (!db) return;
  await db.collection(COL.CANDIDATES).doc(id).delete();
  _scheduleRefresh();
}

async function incrementCandidateVote(candidateId) {
  const db = getDb();
  if (!db) return;
  const docRef = db.collection(COL.CANDIDATES).doc(candidateId);
  const doc = await docRef.get();
  if (!doc.exists) return;
  const current = doc.data().vote_count || 0;
  await docRef.update({ vote_count: current + 1 });
  _scheduleRefresh();
}

async function resetAllCandidateVotes() {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection(COL.CANDIDATES).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { vote_count: 0 }));
  await batch.commit();
  _cache = { ..._cache, candidates: _cache.candidates.map(c => ({ ...c, vote_count: 0 })) };
}

// Voting log
async function addVotingLog(userId, candidateId, ip) {
  const db = getDb();
  if (!db) return null;
  const maxId = 0;
  const log = { id: maxId + 1, user_id: parseInt(userId), candidate_id: parseInt(candidateId), voted_at: new Date().toISOString(), ip_address: ip || 'unknown' };
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
  _cache = { ..._cache, settings: data };
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

// Stats
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

// Init on load (non-blocking)
refreshCache().catch(() => {});

module.exports = {
  initDatabase: refreshCache,
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