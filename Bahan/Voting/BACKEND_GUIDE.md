# BACKEND IMPLEMENTATION - VOTING SYSTEM

## Setup & Installation

### Prerequisites
```bash
- Node.js (v14+)
- npm atau yarn
- SQLite3 atau PostgreSQL (for production)
```

### Install Dependencies
```bash
npm install express cors dotenv sqlite3 bcryptjs multer xlsx
npm install -D nodemon
```

### Project Structure
```
backend/
├── server.js              # Main server file
├── config/
│   └── database.js        # Database configuration
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── vote.js           # Voting routes
│   └── admin.js          # Admin routes (import, results)
├── controllers/
│   ├── authController.js
│   └── votingController.js
├── middleware/
│   ├── auth.js           # JWT/Session middleware
│   └── errorHandler.js
├── database.db           # SQLite database
└── .env
```

---

## 1. Server Setup (server.js)

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/voting', require('./routes/vote'));
app.use('/api/admin', require('./routes/admin'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## 2. Database Configuration (config/database.js)

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

/**
 * Initialize database schema
 */
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nim TEXT UNIQUE NOT NULL,
        dob TEXT NOT NULL,
        nama TEXT NOT NULL,
        prodi TEXT NOT NULL,
        has_voted INTEGER DEFAULT 0,
        voted_at DATETIME,
        voted_for INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(voted_for) REFERENCES candidates(id)
      )
    `);

    // Candidates table
    db.run(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        nomor_urut INTEGER UNIQUE NOT NULL,
        prodi TEXT,
        visi TEXT,
        misi TEXT,
        foto BLOB,
        vote_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Voting log table
    db.run(`
      CREATE TABLE IF NOT EXISTS voting_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        candidate_id INTEGER NOT NULL,
        voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(candidate_id) REFERENCES candidates(id)
      )
    `);

    console.log('Database schema initialized');
  });
}

module.exports = db;
```

---

## 3. Authentication Routes (routes/auth.js)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * LOGIN
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  const { nim, dob } = req.body;

  if (!nim || !dob) {
    return res.status(400).json({
      success: false,
      message: 'NIM dan tanggal lahir harus diisi'
    });
  }

  // Query user from database
  db.get(
    'SELECT * FROM users WHERE nim = ? AND dob = ?',
    [nim, dob],
    (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error',
          error: err.message
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'NIM atau tanggal lahir tidak valid'
        });
      }

      // Store in session (simplified)
      req.session = { userId: user.id, nim: user.nim };

      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          id: user.id,
          nim: user.nim,
          nama: user.nama,
          prodi: user.prodi,
          hasVoted: user.has_voted === 1,
          votedFor: user.voted_for
        }
      });
    }
  );
});

/**
 * GET USER INFO
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  // Check if session exists (middleware would handle this)
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  db.get(
    'SELECT id, nim, nama, prodi, has_voted, voted_for FROM users WHERE id = ?',
    [req.session.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    }
  );
});

/**
 * LOGOUT
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  req.session = null;
  res.json({
    success: true,
    message: 'Logout berhasil'
  });
});

module.exports = router;
```

---

## 4. Voting Routes (routes/vote.js)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET CANDIDATES
 * GET /api/voting/candidates
 */
router.get('/candidates', (req, res) => {
  db.all(
    'SELECT id, nomor_urut, nama, prodi, visi, misi, vote_count FROM candidates ORDER BY nomor_urut ASC',
    (err, candidates) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      res.json({
        success: true,
        data: candidates
      });
    }
  );
});

/**
 * SUBMIT VOTE
 * POST /api/voting/submit
 */
router.post('/submit', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  const { candidateId } = req.body;
  const userId = req.session.userId;

  if (!candidateId) {
    return res.status(400).json({
      success: false,
      message: 'Candidate ID harus diisi'
    });
  }

  // Check if user has already voted
  db.get(
    'SELECT has_voted FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      if (user.has_voted === 1) {
        return res.status(403).json({
          success: false,
          message: 'Anda sudah memilih'
        });
      }

      // Begin transaction
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        // Update user voting status
        db.run(
          'UPDATE users SET has_voted = 1, voted_at = CURRENT_TIMESTAMP, voted_for = ? WHERE id = ?',
          [candidateId, userId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            // Increment candidate votes
            db.run(
              'UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?',
              [candidateId],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({
                    success: false,
                    message: 'Database error'
                  });
                }

                // Insert voting log
                db.run(
                  'INSERT INTO voting_log (user_id, candidate_id, ip_address) VALUES (?, ?, ?)',
                  [userId, candidateId, req.ip],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({
                        success: false,
                        message: 'Database error'
                      });
                    }

                    // Commit transaction
                    db.run('COMMIT', (err) => {
                      if (err) {
                        return res.status(500).json({
                          success: false,
                          message: 'Database error'
                        });
                      }

                      res.json({
                        success: true,
                        message: 'Suara Anda telah tercatat'
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});

/**
 * GET RESULTS
 * GET /api/voting/results
 */
router.get('/results', (req, res) => {
  db.all(
    `SELECT 
      id, nomor_urut, nama, prodi, vote_count
    FROM candidates
    ORDER BY vote_count DESC, nomor_urut ASC`,
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      // Count total votes
      const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);

      // Calculate percentages
      const resultsWithPercentage = results.map(r => ({
        ...r,
        percentage: totalVotes > 0 ? 
          Math.round((r.vote_count / totalVotes) * 100) : 0
      }));

      res.json({
        success: true,
        data: {
          results: resultsWithPercentage,
          totalVotes: totalVotes,
          timestamp: new Date().toISOString()
        }
      });
    }
  );
});

module.exports = router;
```

---

## 5. Admin Routes (routes/admin.js)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');

// Multer configuration
const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files allowed'));
    }
  }
});

/**
 * IMPORT USERS FROM EXCEL
 * POST /api/admin/import-users
 */
router.post('/import-users', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  try {
    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Insert users
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      data.forEach((row, index) => {
        const { NIM, Nama, Prodi, 'Tanggal Lahir': dob } = row;

        if (!NIM || !Nama || !Prodi || !dob) {
          errorCount++;
          errors.push(`Row ${index + 2}: Missing required fields`);
          return;
        }

        // Format date to DD-MM-YYYY
        const formattedDob = new Date(dob).toLocaleDateString('id-ID');

        db.run(
          'INSERT INTO users (nim, dob, nama, prodi) VALUES (?, ?, ?, ?)',
          [NIM, formattedDob, Nama, Prodi],
          (err) => {
            if (err) {
              errorCount++;
              errors.push(`Row ${index + 2}: ${err.message}`);
            } else {
              successCount++;
            }
          }
        );
      });

      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({
            success: false,
            message: 'Database error during commit'
          });
        }

        res.json({
          success: true,
          message: `Import berhasil: ${successCount} users, ${errorCount} errors`,
          data: {
            successCount,
            errorCount,
            errors: errors.length > 0 ? errors : undefined
          }
        });
      });
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error processing file',
      error: error.message
    });
  }
});

/**
 * GET DETAILED RESULTS
 * GET /api/admin/results
 */
router.get('/results', (req, res) => {
  db.all(
    `SELECT 
      c.id, c.nomor_urut, c.nama, c.prodi, c.visi, c.misi, c.vote_count
    FROM candidates c
    ORDER BY c.vote_count DESC, c.nomor_urut ASC`,
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      // Get voter statistics
      db.get(
        'SELECT COUNT(*) as total_users, SUM(has_voted) as total_voters FROM users',
        (err, stats) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }

          const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);

          res.json({
            success: true,
            data: {
              results: results.map(r => ({
                ...r,
                percentage: totalVotes > 0 ? 
                  Math.round((r.vote_count / totalVotes) * 100) : 0
              })),
              statistics: {
                totalUsers: stats.total_users || 0,
                totalVoters: stats.total_voters || 0,
                totalVotes: totalVotes,
                voterPercentage: stats.total_users > 0 ? 
                  Math.round((stats.total_voters / stats.total_users) * 100) : 0
              },
              timestamp: new Date().toISOString()
            }
          });
        }
      );
    }
  );
});

/**
 * RESET VOTING
 * POST /api/admin/reset
 */
router.post('/reset', (req, res) => {
  // Add admin authentication here in production
  
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    db.run('DELETE FROM voting_log', (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      db.run('UPDATE users SET has_voted = 0, voted_at = NULL, voted_for = NULL', (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        db.run('UPDATE candidates SET vote_count = 0', (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Database error during commit'
              });
            }

            res.json({
              success: true,
              message: 'Voting system has been reset'
            });
          });
        });
      });
    });
  });
});

module.exports = router;
```

---

## 6. Environment Variables (.env)

```
NODE_ENV=development
PORT=3000
DATABASE_URL=./database.db
SESSION_SECRET=your-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
```

---

## 7. Package.json

```json
{
  "name": "voting-app",
  "version": "1.0.0",
  "description": "Campus Senate Chairman Voting System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "sqlite3": "^5.1.6",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login dengan NIM dan DOB
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Voting
- `GET /api/voting/candidates` - Get list of candidates
- `POST /api/voting/submit` - Submit vote
- `GET /api/voting/results` - Get voting results

### Admin
- `POST /api/admin/import-users` - Import users dari Excel
- `GET /api/admin/results` - Get detailed results
- `POST /api/admin/reset` - Reset voting

---

## Excel File Format (Template)

| NIM       | Nama              | Prodi                    | Tanggal Lahir |
|-----------|-------------------|--------------------------|---------------|
| 123456789 | Budi Santoso      | S1 Informatika           | 01-01-2003    |
| 987654321 | Siti Nurhaliza    | S1 Teknik Sipil          | 15-05-2002    |
| 555666777 | Ahmad Pratama     | S1 Bisnis                | 20-12-2002    |

---

*Backend documentation v1.0 - Ready for implementation*
