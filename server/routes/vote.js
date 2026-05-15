/**
 * Voting Routes
 */
const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/candidates', async (req, res) => {
  try {
    const candidates = await db.getAllCandidates();
    res.json({ success: true, data: candidates });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil data kandidat' });
  }
});

router.post('/submit', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
    }

    const { candidateId } = req.body;
    const user = req.session.user;

    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'ID kandidat harus diisi' });
    }

    const votingStatus = await db.isVotingOpen();
    if (!votingStatus.open) {
      const messages = {
        voting_disabled: 'Voting ditutup secara manual',
        voting_not_started: 'Voting belum dibuka',
        voting_ended: 'Voting sudah ditutup'
      };
      return res.status(400).json({ success: false, message: messages[votingStatus.reason] || 'Voting tidak tersedia' });
    }

    if (user.hasVoted) {
      return res.status(400).json({ success: false, message: 'Anda sudah melakukan voting' });
    }

    const candidate = await db.getCandidateById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });
    }

    // Use Firestore document ID
    await db.updateUserVote(user.id, candidateId);
    await db.incrementCandidateVote(candidateId);
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    await db.addVotingLog(user.id, candidateId, ip);

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

router.get('/results', async (req, res) => {
  try {
    const candidates = await db.getAllCandidates();
    const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);
    const results = candidates.map(c => ({
      id: c.id,
      nomor_urut: c.nomor_urut,
      nama_ketua: c.nama_ketua,
      nama_wakil: c.nama_wakil,
      vote_count: c.vote_count || 0,
      percentage: totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 100) : 0
    })).sort((a, b) => b.vote_count - a.vote_count);

    const stats = await db.getStats();
    res.json({
      success: true,
      data: {
        results,
        totalVotes,
        totalVoters: stats.totalUsers,
        participationRate: stats.totalUsers > 0 ? Math.round((totalVotes / stats.totalUsers) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil hasil' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const [votingStatus, settings] = await Promise.all([db.isVotingOpen(), db.getSettings()]);
    const messages = {
      voting_disabled: 'Voting ditutup secara manual',
      voting_not_started: 'Voting belum dibuka',
      voting_ended: 'Voting sudah ditutup',
      null: 'Voting sedang dibuka'
    };
    res.json({
      success: true,
      data: {
        isOpen: votingStatus.open,
        votingEnabled: settings.voting_enabled !== false,
        openAt: settings.voting_open_at || null,
        closeAt: settings.voting_close_at || null,
        message: messages[votingStatus.reason] || 'Voting sedang dibuka'
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

module.exports = router;