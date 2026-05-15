/**
 * VoteApp - Sistem Voting Ketua Senat Kampus
 * Main Server File
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initDatabase, closeDatabase, saveDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const voteRoutes = require('./routes/vote');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy so session cookies work correctly behind Vite dev server proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'voteapp-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Static files - uploads directory
const uploadsDir = path.join(__dirname, './uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve CSV template for voter import
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
  res.json({ success: true, message: 'VoteApp server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  saveDatabase();
  closeDatabase();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log('╔═══════════════════════════════════════════╗');
      console.log('║     🎉 VoteApp Server Started!             ║');
      console.log('╠═══════════════════════════════════════════╣');
      console.log(`║  📍 http://localhost:${PORT}                ║`);
      console.log('║  🌐 Access the voting app in browser      ║');
      console.log('╚═══════════════════════════════════════════╝');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();