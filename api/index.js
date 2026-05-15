/**
 * Vercel Serverless Function Entry Point
 * Handles all routes: API, static files, SPA fallback
 */

const path = require('path');
const fs = require('fs');

// Dynamically load dependencies to avoid cold-start issues
const express = require('express');
const session = require('express-session');

// Load database helpers
const { initDatabase } = require('../server/config/database');
const authRoutes = require('../server/routes/auth');
const voteRoutes = require('../server/routes/vote');
const adminRoutes = require('../server/routes/admin');

// Create Express app
const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
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

// Static files - uploads
const uploadsDir = path.join(__dirname, '../server/uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}
}
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static files
const clientDistDir = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
}

// Serve CSV template
const templatePath = path.join(__dirname, '../client/public/template-pemilih.csv');
if (fs.existsSync(templatePath)) {
  app.get('/template-pemilih.csv', (req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="template-pemilih.csv"');
    res.sendFile(templatePath);
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/voting', voteRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'VoteApp is running', timestamp: new Date().toISOString() });
});

// SPA fallback - must be LAST
if (fs.existsSync(clientDistDir)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

// Vercel module export
module.exports = app;