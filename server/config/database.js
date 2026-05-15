/**
 * Database Configuration - Simple JSON File Storage
 * Supports: users, candidates (pasangan), votingLog, settings, admin
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database.json');

let data = null;

/**
 * Initialize database connection
 */
async function initDatabase() {
  if (fs.existsSync(DB_PATH)) {
    const content = fs.readFileSync(DB_PATH, 'utf8');
    data = JSON.parse(content);
    // Ensure all required keys exist
    data.users = data.users || [];
    data.candidates = data.candidates || [];
    data.votingLog = data.votingLog || [];
    data.settings = data.settings || {};
    data.admin = data.admin || { username: 'admin', password: 'admin123' };
    console.log('📂 Database loaded from file');
  } else {
    data = {
      users: [],
      candidates: [],
      votingLog: [],
      settings: {
        voting_enabled: true,
        voting_open_at: null,
        voting_close_at: null,
        app_title: 'Pemilihan Ketua Senat',
        app_subtitle: 'Periode 2026'
      },
      admin: {
        username: 'admin',
        password: 'admin123'
      }
    };
    saveDatabase();
    console.log('🆕 New database created');
  }

  return data;
}

/**
 * Get database instance
 */
function getDatabase() {
  if (!data) {
    data = {
      users: [],
      candidates: [],
      votingLog: [],
      settings: {},
      admin: {}
    };
  }
  return data;
}

/**
 * Save database to file
 */
function saveDatabase() {
  if (data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (data) {
    saveDatabase();
    data = null;
  }
}

// ==================== USER HELPERS ====================

function getUserByNim(nim) {
  return getDatabase().users.find(u => u.nim === nim);
}

function getUserById(id) {
  return getDatabase().users.find(u => u.id === id);
}

function createUser(userData) {
  const db = getDatabase();
  const user = {
    id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
    nim: userData.nim,
    dob: userData.dob,
    nama: userData.nama,
    prodi: userData.prodi || '',
    has_voted: 0,
    voted_at: null,
    voted_for: null,
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  saveDatabase();
  return user;
}

function updateUserVote(userId, candidateId) {
  const db = getDatabase();
  const user = db.users.find(u => u.id === userId);
  if (user) {
    user.has_voted = 1;
    user.voted_at = new Date().toISOString();
    user.voted_for = candidateId;
    saveDatabase();
  }
  return user;
}

function resetAllUserVotes() {
  const db = getDatabase();
  db.users.forEach(u => {
    u.has_voted = 0;
    u.voted_at = null;
    u.voted_for = null;
  });
  saveDatabase();
}

// ==================== CANDIDATE HELPERS ====================

function getAllCandidates() {
  return getDatabase().candidates.sort((a, b) => a.nomor_urut - b.nomor_urut);
}

function getCandidateById(id) {
  return getDatabase().candidates.find(c => c.id === id);
}

function getCandidateByNomorUrut(nomor) {
  return getDatabase().candidates.find(c => c.nomor_urut === nomor);
}

function createCandidate(candidateData) {
  const db = getDatabase();
  const candidate = {
    id: db.candidates.length > 0 ? Math.max(...db.candidates.map(c => c.id)) + 1 : 1,
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
  db.candidates.push(candidate);
  saveDatabase();
  return candidate;
}

function updateCandidate(id, candidateData) {
  const db = getDatabase();
  const idx = db.candidates.findIndex(c => c.id === id);
  if (idx !== -1) {
    db.candidates[idx] = {
      ...db.candidates[idx],
      nomor_urut: candidateData.nomor_urut ?? db.candidates[idx].nomor_urut,
      nama_ketua: candidateData.nama_ketua ?? db.candidates[idx].nama_ketua,
      prodi_ketua: candidateData.prodi_ketua ?? db.candidates[idx].prodi_ketua,
      foto_ketua: candidateData.foto_ketua ?? db.candidates[idx].foto_ketua,
      nama_wakil: candidateData.nama_wakil ?? db.candidates[idx].nama_wakil,
      prodi_wakil: candidateData.prodi_wakil ?? db.candidates[idx].prodi_wakil,
      foto_wakil: candidateData.foto_wakil ?? db.candidates[idx].foto_wakil,
      visi: candidateData.visi ?? db.candidates[idx].visi,
      misi: candidateData.misi ?? db.candidates[idx].misi,
    };
    saveDatabase();
    return db.candidates[idx];
  }
  return null;
}

function deleteCandidate(id) {
  const db = getDatabase();
  db.candidates = db.candidates.filter(c => c.id !== id);
  saveDatabase();
}

function incrementCandidateVote(candidateId) {
  const db = getDatabase();
  const candidate = db.candidates.find(c => c.id === candidateId);
  if (candidate) {
    candidate.vote_count = (candidate.vote_count || 0) + 1;
    saveDatabase();
  }
  return candidate;
}

function resetAllCandidateVotes() {
  const db = getDatabase();
  db.candidates.forEach(c => { c.vote_count = 0; });
  saveDatabase();
}

// ==================== VOTING LOG HELPERS ====================

function addVotingLog(userId, candidateId, ipAddress) {
  const db = getDatabase();
  const log = {
    id: db.votingLog.length > 0 ? Math.max(...db.votingLog.map(l => l.id)) + 1 : 1,
    user_id: userId,
    candidate_id: candidateId,
    voted_at: new Date().toISOString(),
    ip_address: ipAddress || 'unknown'
  };
  db.votingLog.push(log);
  saveDatabase();
  return log;
}

function clearVotingLog() {
  const db = getDatabase();
  db.votingLog = [];
  saveDatabase();
}

// ==================== SETTINGS HELPERS ====================

function getSettings() {
  return getDatabase().settings;
}

function updateSettings(settingsData) {
  const db = getDatabase();
  db.settings = { ...db.settings, ...settingsData };
  saveDatabase();
  return db.settings;
}

function isVotingOpen() {
  const settings = getSettings();
  const now = new Date();

  // Manual override: if voting_enabled is false, always closed
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

// ==================== ADMIN HELPERS ====================

function adminLogin(username, password) {
  const db = getDatabase();
  if (db.admin && db.admin.username === username && db.admin.password === password) {
    return true;
  }
  return false;
}

function updateAdminCredentials(username, password) {
  const db = getDatabase();
  db.admin = { username, password };
  saveDatabase();
}

// ==================== STATS HELPERS ====================

function getStats() {
  const db = getDatabase();
  return {
    totalUsers: db.users.length,
    totalVoted: db.users.filter(u => u.has_voted === 1).length,
    totalCandidates: db.candidates.length,
    totalVotes: db.candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0)
  };
}

module.exports = {
  initDatabase,
  getDatabase,
  saveDatabase,
  closeDatabase,
  // User
  getUserByNim,
  getUserById,
  createUser,
  updateUserVote,
  resetAllUserVotes,
  // Candidates
  getAllCandidates,
  getCandidateById,
  getCandidateByNomorUrut,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  incrementCandidateVote,
  resetAllCandidateVotes,
  // Voting Log
  addVotingLog,
  clearVotingLog,
  // Settings
  getSettings,
  updateSettings,
  isVotingOpen,
  // Admin
  adminLogin,
  updateAdminCredentials,
  // Stats
  getStats
};