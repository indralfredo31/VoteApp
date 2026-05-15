/**
 * Vercel Serverless Function Entry Point
 * Handles all routes: API, static files, SPA fallback
 */

const path = require('path');
const fs = require('fs');

// Load database helpers
const { initDatabase, getCache } = require('../server/config/database');

// Load all routes BEFORE declaring catch-all
const authRoutes = require('../server/routes/auth');
const voteRoutes = require('../server/routes/vote');
const adminRoutes = require('../server/routes/admin');

// Create Express app
const app = express();

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

// Static files - uploads (from server/uploads)
const uploadsDir = path.join(__dirname, '../server/uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}
}
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static files (built to api/public by Vercel build)
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Serve CSV template
const templatePath = path.join(__dirname, 'public/template-pemilih.csv');
const clientTemplatePath = path.join(__dirname, '../client/public/template-pemilih.csv');
if (fs.existsSync(templatePath)) {
  app.get('/template-pemilih.csv', (req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="template-pemilih.csv"');
    res.sendFile(templatePath);
  });
} else if (fs.existsSync(clientTemplatePath)) {
  app.get('/template-pemilih.csv', (req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="template-pemilih.csv"');
    res.sendFile(clientTemplatePath);
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/voting', voteRoutes);
app.use('/api/admin', adminRoutes);

// Debug endpoint - check Firebase status (MUST be before SPA catch-all)
app.get('/api/debug', async (req, res) => {
  try {
    const cache = getCache();
    const firebaseStatus = {
      hasCache: !!cache,
      usersCount: cache?.users?.length || 0,
      candidatesCount: cache?.candidates?.length || 0,
      settings: cache?.settings || {},
      sampleUsers: cache?.users?.slice(0, 2).map(u => ({ nim: u.nim, dob: u.dob })) || [],
      envVars: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        projectId: process.env.FIREBASE_PROJECT_ID || 'NOT SET'
      }
    };
    res.json(firebaseStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check (MUST be before SPA catch-all)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'VoteApp is running', timestamp: new Date().toISOString() });
});

// SPA fallback - MUST be LAST (catch-all for client-side routing)
if (fs.existsSync(publicDir)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Vercel serverless export
module.exports = app;