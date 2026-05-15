/**
 * JWT Authentication Utilities for VoteApp
 * Replaces express-session with stateless JWT tokens
 * Works perfectly with Vercel serverless (no cold-start session loss)
 */

const jwt = require('jsonwebtoken');
const { getDb } = require('./firebase');

// Use SESSION_SECRET as JWT secret
function getJwtSecret() {
  return process.env.SESSION_SECRET || 'voteapp-secret-key-2024';
}

// Generate JWT for admin
function generateAdminToken(username) {
  return jwt.sign(
    { type: 'admin', username, iat: Math.floor(Date.now() / 1000) },
    getJwtSecret(),
    { expiresIn: '24h' }
  );
}

// Verify JWT and return payload (or throw)
function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (err) {
    return null;
  }
}

// Admin auth middleware factory
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized — no token' });
  }

  const payload = verifyToken(token);
  if (!payload || payload.type !== 'admin') {
    return res.status(401).json({ success: false, message: 'Unauthorized — invalid token' });
  }

  // Attach admin info to request
  req.admin = { username: payload.username };
  next();
}

// User auth middleware factory
function requireUser(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized — no token' });
  }

  const payload = verifyToken(token);
  if (!payload || payload.type !== 'user') {
    return res.status(401).json({ success: false, message: 'Unauthorized — invalid token' });
  }

  req.user = payload;
  next();
}

module.exports = {
  generateAdminToken,
  verifyToken,
  requireAdmin,
  requireUser
};