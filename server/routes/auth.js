/**
 * Authentication Routes
 */
const express = require('express');
const router = express.Router();
const { getUserByNim, adminLogin } = require('../config/database');

/**
 * POST /api/auth/login
 * User login with NIM and DOB
 */
router.post('/login', (req, res) => {
  try {
    const { nim, dob } = req.body;

    if (!nim || !dob) {
      return res.status(400).json({
        success: false,
        message: 'NIM dan tanggal lahir harus diisi'
      });
    }

    // Parse DDMMYYYY format (e.g. "15012003" → "15-01-2003")
    let normalizedDob = dob;
    if (/^\d{8}$/.test(dob)) {
      const day = dob.slice(0, 2);
      const month = dob.slice(2, 4);
      const year = dob.slice(4, 8);
      normalizedDob = `${day}-${month}-${year}`;
    }

    const user = getUserByNim(nim);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'NIM atau tanggal lahir salah'
      });
    }

    if (user.dob !== normalizedDob) {
      return res.status(401).json({
        success: false,
        message: 'NIM atau tanggal lahir salah'
      });
    }

    // Set session
    req.session.user = {
      id: user.id,
      nim: user.nim,
      nama: user.nama,
      prodi: user.prodi,
      hasVoted: user.has_voted === 1,
      votedFor: user.voted_for || null
    };

    res.json({
      success: true,
      data: req.session.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat login' });
  }
});

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logout berhasil' });
  });
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({ success: true, data: req.session.user });
});

/**
 * POST /api/auth/admin-login
 * Admin login
 */
router.post('/admin-login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }

    const isValid = adminLogin(username, password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    req.session.admin = { username };

    res.json({
      success: true,
      data: { username }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat login' });
  }
});

/**
 * POST /api/auth/admin-logout
 * Admin logout
 */
router.post('/admin-logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logout berhasil' });
  });
});

module.exports = router;