/**
 * Vercel Serverless Function Entry Point
 * Handles all routes: API, static files, SPA fallback
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');

// Lazy load database (Firebase may not be initialized yet at cold start)
let _app = null;

function getApp() {
  if (_app) return _app;

  _app = express();
  _app.set('trust proxy', 1);
  _app.use(express.json());
  _app.use(express.urlencoded({ extended: true }));

  _app.use(session({
    secret: process.env.SESSION_SECRET || 'voteapp-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  // Uploads static
  const uploadsDir = path.join(__dirname, '../server/uploads');
  if (!fs.existsSync(uploadsDir)) {
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}
  }
  _app.use('/uploads', express.static(uploadsDir));

  // Frontend static files
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    _app.use(express.static(publicDir));
  }

  // CSV template
  const templatePath = path.join(__dirname, 'public/template-pemilih.csv');
  const clientTemplatePath = path.join(__dirname, '../client/public/template-pemilih.csv');
  if (fs.existsSync(templatePath)) {
    _app.get('/template-pemilih.csv', (req, res) => {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="template-pemilih.csv"');
      res.sendFile(templatePath);
    });
  } else if (fs.existsSync(clientTemplatePath)) {
    _app.get('/template-pemilih.csv', (req, res) => {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="template-pemilih.csv"');
      res.sendFile(clientTemplatePath);
    });
  }

  // Routes - lazy require to prevent crash at cold start
  try {
    const authRoutes = require('../server/routes/auth');
    const voteRoutes = require('../server/routes/vote');
    const adminRoutes = require('../server/routes/admin');
    _app.use('/api/auth', authRoutes);
    _app.use('/api/voting', voteRoutes);
    _app.use('/api/admin', adminRoutes);
  } catch (e) {
    console.error('Route loading error:', e.message);
  }

  // Debug endpoint
  _app.get('/api/debug', async (req, res) => {
    try {
      const { getCache } = require('../server/config/database');
      const cache = getCache();
      res.json({
        hasCache: !!cache,
        usersCount: cache?.users?.length || 0,
        candidatesCount: cache?.candidates?.length || 0,
        settings: cache?.settings || {},
        envVars: {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          projectId: process.env.FIREBASE_PROJECT_ID || 'NOT SET',
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message, stack: err.stack?.slice(0, 200) });
    }
  });

  // Health check
  _app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'VoteApp is running', timestamp: new Date().toISOString() });
  });

  // SPA fallback
  if (fs.existsSync(publicDir)) {
    _app.get('*', (req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  return _app;
}

// Vercel serverless handler
module.exports = (req, res) => {
  return getApp()(req, res);
};