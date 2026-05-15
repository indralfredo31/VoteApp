/**
 * Voting Routes
 */
const express = require('express');
const router = express.Router();
const {
  getAllCandidates,
  getCandidateById,
  updateUserVote,
  incrementCandidateVote,
  addVotingLog,
  isVotingOpen,
  getUserById
} = require('../config/database');

/**
 * GET /api/voting/candidates
 * Get all candidates (pasangan)
 */
router.get('/candidates', (req, res) => {
  try {
    const candidates = getAllCandidates();
    res.json({ success: true, data: candidates });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil data kandidat' });
  }
});

/**
 * POST /api/voting/submit
 * Submit vote for a candidate
 */
router.post('/submit', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
    }

    const { candidateId } = req.body;
    const user = req.session.user;

    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'ID kandidat harus diisi' });
    }

    // Check voting window
    const votingStatus = isVotingOpen();
    if (!votingStatus.open) {
      const messages = {
        voting_disabled: 'Voting ditutup secara manual',
        voting_not_started: 'Voting belum dibuka',
        voting_ended: 'Voting sudah ditutup'
      };
      return res.status(400).json({
        success: false,
        message: messages[votingStatus.reason] || 'Voting tidak tersedia'
      });
    }

    // Check if user already voted
    if (user.hasVoted) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah melakukan voting'
      });
    }

    // Verify candidate exists
    const candidate = getCandidateById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });
    }

    // Update user's voted status
    updateUserVote(user.id, candidateId);

    // Increment candidate vote count
    incrementCandidateVote(candidateId);

    // Add to voting log
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    addVotingLog(user.id, candidateId, ip);

    // Update session
    req.session.user.hasVoted = true;
    req.session.user.votedFor = candidateId;

    res.json({
      success: true,
      message: 'Vote berhasil dikirim',
      data: {
        candidateName: `${candidate.nama_ketua} & ${candidate.nama_wakil}`,
        votedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Submit vote error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengirim vote' });
  }
});

/**
 * GET /api/voting/results
 * Get voting results (public)
 */
router.get('/results', (req, res) => {
  try {
    const candidates = getAllCandidates();

    // Calculate total votes
    const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);

    // Calculate percentages
    const results = candidates.map(c => ({
      id: c.id,
      nomor_urut: c.nomor_urut,
      nama_ketua: c.nama_ketua,
      nama_wakil: c.nama_wakil,
      vote_count: c.vote_count || 0,
      percentage: totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 100) : 0
    })).sort((a, b) => b.vote_count - a.vote_count);

    // Get total voters from users
    const db = require('../config/database').getDatabase();
    const totalVoters = db.users ? db.users.length : 0;

    res.json({
      success: true,
      data: {
        results,
        totalVotes,
        totalVoters,
        participationRate: totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil hasil' });
  }
});

/**
 * GET /api/voting/status
 * Get voting open/close status (public)
 */
router.get('/status', (req, res) => {
  try {
    const { open, reason } = isVotingOpen();
    const settings = require('../config/database').getSettings();

    const messages = {
      voting_disabled: 'Voting ditutup secara manual',
      voting_not_started: 'Voting belum dibuka',
      voting_ended: 'Voting sudah ditutup',
      null: 'Voting sedang dibuka'
    };

    res.json({
      success: true,
      data: {
        isOpen: open,
        votingEnabled: settings.voting_enabled !== false,
        openAt: settings.voting_open_at || null,
        closeAt: settings.voting_close_at || null,
        message: messages[reason] || 'Voting sedang dibuka'
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

module.exports = router;