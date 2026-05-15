/**
 * Authentication Routes
 * Uses JWT tokens — no server-side sessions needed
 * Works perfectly with Vercel serverless
 */
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { generateAdminToken, verifyToken, requireAdmin } = require('../config/jwtAuth');

/**
 * POST /api/auth/admin-login
 * Returns JWT token on successful login
 */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password harus diisi' });
    }
    const isValid = await db.adminLogin(username, password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
    const token = generateAdminToken(username);
    res.json({ success: true, data: { token, username } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat login' });
  }
});

/**
 * POST /api/auth/admin-logout
 * Client discards the token — nothing to do server-side
 */
router.post('/admin-logout', (req, res) => {
  res.json({ success: true, message: 'Logout berhasil' });
});

/**
 * GET /api/auth/admin-me
 * Verify the current JWT token
 */
router.get('/admin-me', requireAdmin, (req, res) => {
  res.json({ success: true, data: req.admin });
});

/**
 * POST /api/auth/login
 * User login with NIM and DOB — still uses session (for now)
 */
router.post('/login', async (req, res) => {
  try {
    const { nim, dob } = req.body;

    if (!nim || !dob) {
      return res.status(400).json({
        success: false,
        message: 'NIM dan tanggal lahir harus diisi'
      });
    }

    let normalizedDob = dob;
    if (/^\d{8}$/.test(dob)) {
      const day = dob.slice(0, 2);
      const month = dob.slice(2, 4);
      const year = dob.slice(4, 8);
      normalizedDob = `${day}-${month}-${year}`;
    }

    const user = await db.getUserByNim(nim);

    if (!user) {
      return res.status(401).json({ success: false, message: 'NIM atau tanggal lahir salah' });
    }

    if (user.dob !== normalizedDob) {
      return res.status(401).json({ success: false, message: 'NIM atau tanggal lahir salah' });
    }

    // Return user data — client stores it in localStorage via authStore
    // Use Firestore document ID as user.id
    res.json({
      success: true,
      data: {
        id: user.id, // Firestore document ID
        nim: user.nim,
        nama: user.nama,
        prodi: user.prodi,
        hasVoted: user.has_voted === 1,
        votedFor: user.voted_for || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat login' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout berhasil' });
});

router.get('/me', (req, res) => {
  // User auth still uses client-side storage, not session
  res.status(401).json({ success: false, message: 'Not authenticated' });
});

module.exports = router;