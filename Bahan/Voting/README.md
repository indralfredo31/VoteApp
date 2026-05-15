# 🎯 SISTEM VOTING KETUA SENAT KAMPUS

Aplikasi web modern untuk pemilihan ketua senat kampus dengan design minimalist yang nyaman di mata, fully responsive, dan aman dari double voting.

---

## 📋 DAFTAR ISI

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Quick Start](#quick-start)
5. [Project Structure](#project-structure)
6. [File Documentation](#file-documentation)
7. [API Reference](#api-reference)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## 🌟 Overview

Sistem voting ini dirancang untuk memberikan pengalaman voting yang **aman, mudah, dan menyenangkan** bagi seluruh mahasiswa. Dengan fitur login otomatis menggunakan NIM dan tanggal lahir, sistem ini mencegah double voting dan menjaga integritas pemilihan.

### Keunggulan:
- ✅ **Design Minimalist & Eye-Comfortable** - Color palette netral yang nyaman dipandang
- ✅ **Fully Responsive** - Sempurna di PC, tablet, dan smartphone
- ✅ **Smooth Animations** - Transisi halus dan loading indah
- ✅ **Prevent Double Voting** - Sistem check otomatis di database
- ✅ **Real-time Results** - Hasil voting update real-time
- ✅ **Excel Import** - Import data mahasiswa langsung dari file Excel
- ✅ **Production Ready** - Siap deploy ke production

---

## ✨ Features

### User Features
- 🔐 **Secure Login** - NIM + Tanggal Lahir
- 🗳️ **Vote Submission** - Pilih kandidat dengan mudah
- ✓ **Vote Confirmation** - Konfirmasi sebelum submit (irreversible)
- 📊 **Real-time Results** - Lihat hasil voting secara live
- 🚪 **Logout** - Logout aman dari sistem

### Admin Features
- 📥 **Import Users** - Upload Excel untuk bulk data entry
- 👥 **Candidate Management** - Tambah/edit calon ketua senat
- 📈 **Results Dashboard** - Lihat statistik voting detail
- 🔄 **Reset Voting** - Reset voting untuk voting baru
- 📊 **Export Results** - Export hasil ke format CSV/Excel

### Security Features
- 🔒 **One-Time Vote** - Satu mahasiswa hanya bisa voting 1x
- 🛡️ **HTTPS/SSL** - Enkripsi data dalam transit
- 🚫 **XSS Protection** - Input sanitization
- 💉 **SQL Injection Prevention** - Prepared statements
- 📝 **Audit Logging** - Semua voting tercatat

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Grid, Flexbox, Custom Properties, Animations
- **JavaScript** - Vanilla JS (no framework)
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite / PostgreSQL** - Database
- **Multer** - File upload handling
- **ExcelJS / SheetJS** - Excel file processing

### DevOps & Deployment
- **PM2** - Process management
- **Nginx** - Reverse proxy
- **Let's Encrypt** - SSL/TLS certificates
- **Heroku / AWS / VPS** - Hosting options

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd voting-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
```bash
# Create .env file
cp .env.example .env

# Edit .env dengan konfigurasi Anda
nano .env
```

### 4. Run Development Server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 5. Access Application
- Open browser: `http://localhost:3000`
- Coba login dengan NIM: `123456789` dan DOB: `15-01-2003`

---

## 📁 Project Structure

```
voting-app/
├── public/                          # Frontend files
│   ├── index.html                   # Main HTML
│   ├── css/
│   │   ├── style.css               # Main styles
│   │   └── responsive.css          # Responsive design
│   └── js/
│       ├── app.js                  # Main app logic
│       ├── auth.js                 # Auth functions (optional)
│       └── voting.js               # Voting functions (optional)
│
├── backend/                         # Backend folder
│   ├── server.js                   # Express server
│   ├── config/
│   │   └── database.js             # Database setup
│   ├── routes/
│   │   ├── auth.js                 # Auth API
│   │   ├── vote.js                 # Voting API
│   │   └── admin.js                # Admin API
│   ├── controllers/
│   │   └── [controllers files]     # Business logic
│   ├── middleware/
│   │   └── [middleware files]      # Custom middleware
│   └── database.db                 # SQLite database (auto-created)
│
├── docs/                           # Documentation
│   ├── voting_system_planning.md
│   ├── BACKEND_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── API_REFERENCE.md
│
├── .env                            # Environment variables
├── .env.example                    # Example env file
├── package.json                    # Dependencies
├── package-lock.json               # Lock file
└── README.md                       # This file
```

---

## 📚 File Documentation

### Planning & Architecture
- **`voting_system_planning.md`** - Lengkap planning aplikasi, flow diagram, tech stack, timeline
- **`BACKEND_GUIDE.md`** - Implementasi backend lengkap dengan contoh kode
- **`DEPLOYMENT_GUIDE.md`** - Panduan deployment, monitoring, troubleshooting
- **`MOCKUP_UI.md`** - Visual mockup semua halaman (sudah di file terpisah)

### Frontend Files
- **`index.html`** - HTML structure dengan 6 halaman utama
- **`style.css`** - CSS styling utama (minimalist & clean)
- **`responsive.css`** - Responsive design untuk mobile/tablet/desktop
- **`app.js`** - JavaScript logic untuk semua fungsi

### Backend Files
- **`server.js`** - Setup Express server
- **`config/database.js`** - Database configuration & schema
- **`routes/auth.js`** - Authentication endpoints
- **`routes/vote.js`** - Voting endpoints
- **`routes/admin.js`** - Admin endpoints (import, results, reset)

---

## 🔌 API Reference

### Authentication
```
POST /api/auth/login
Body: { nim: string, dob: string (DD-MM-YYYY) }
Response: { success: boolean, data: { id, nim, nama, prodi, hasVoted } }
```

```
POST /api/auth/logout
Response: { success: boolean }
```

### Voting
```
GET /api/voting/candidates
Response: { success: boolean, data: [{ id, nomor, nama, prodi, visi, misi, votes }] }
```

```
POST /api/voting/submit
Body: { candidateId: number }
Response: { success: boolean, message: string }
```

```
GET /api/voting/results
Response: { success: boolean, data: { results: [...], totalVotes: number } }
```

### Admin
```
POST /api/admin/import-users (form-data dengan file Excel)
Response: { success: boolean, data: { successCount, errorCount } }
```

```
GET /api/admin/results
Response: { success: boolean, data: { results: [...], statistics: {...} } }
```

```
POST /api/admin/reset
Response: { success: boolean, message: string }
```

---

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production (Heroku)
```bash
heroku create voting-app
heroku config:set NODE_ENV=production
git push heroku main
```

### Production (VPS/Linux)
```bash
# Install dependencies
npm install --production

# Setup with PM2
pm2 start server.js --name "voting-app"
pm2 startup
pm2 save

# Setup Nginx reverse proxy (see DEPLOYMENT_GUIDE.md)
```

### Production (Docker)
```bash
docker build -t voting-app .
docker run -p 3000:3000 voting-app
```

---

## 🧪 Testing

### Manual Testing
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nim":"123456789", "dob":"15-01-2003"}'

# Test get candidates
curl http://localhost:3000/api/voting/candidates

# Test get results
curl http://localhost:3000/api/voting/results
```

### Responsive Testing
- [ ] Test di Chrome, Firefox, Safari (desktop)
- [ ] Test di iOS Safari, Android Chrome (mobile)
- [ ] Test landscape mode
- [ ] Test dengan network throttling (slow 3G)

### Functional Testing
- [ ] Login dengan valid credentials
- [ ] Prevent double voting
- [ ] Vote counting akurat
- [ ] Results update real-time
- [ ] Excel import working properly

---

## 🎨 Design Highlights

### Color Palette
- **Primary**: `#2D6A4F` (Soft Green) - Profesional & nyaman
- **Accent**: `#D4A574` (Warm Beige) - Highlight elements
- **Background**: `#FAFBFC` (Off-white) - Netral & clean
- **Success**: `#52B788` (Light Green) - Positive feedback
- **Error**: `#E63946` (Soft Red) - Warnings

### Typography
- **Display**: Poppins Bold (Modern & clean)
- **Body**: Poppins Regular / Inter (Readable)
- **Font sizing**: Responsive dari 12px-32px

### Animations
- Splash logo bounce
- Loading bar fill
- Smooth transitions (0.3s)
- Scale-in success icon
- Fade-in results

---

## 🔐 Security Best Practices

### Implemented
- ✅ Input validation (server-side)
- ✅ SQL injection prevention (prepared statements)
- ✅ XSS protection (sanitize input)
- ✅ HTTPS/SSL encryption
- ✅ One-time vote per NIM
- ✅ Session-based authentication
- ✅ CORS configuration
- ✅ Logging & audit trail

### Recommended for Production
- 🔒 CSRF token protection
- 🔒 Rate limiting
- 🔒 Admin authentication (JWT/OAuth)
- 🔒 Environment-based secrets management
- 🔒 Intrusion detection system

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  nim TEXT UNIQUE NOT NULL,
  dob TEXT NOT NULL,
  nama TEXT NOT NULL,
  prodi TEXT NOT NULL,
  has_voted INTEGER DEFAULT 0,
  voted_at DATETIME,
  voted_for INTEGER,
  created_at DATETIME
);
```

### Candidates Table
```sql
CREATE TABLE candidates (
  id INTEGER PRIMARY KEY,
  nomor_urut INTEGER UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  prodi TEXT,
  visi TEXT,
  misi TEXT,
  foto BLOB,
  vote_count INTEGER DEFAULT 0,
  created_at DATETIME
);
```

### Voting Log Table
```sql
CREATE TABLE voting_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  voted_at DATETIME,
  ip_address TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(candidate_id) REFERENCES candidates(id)
);
```

---

## 🐛 Troubleshooting

### Problem: Application won't start
```bash
# Check logs
npm run dev  # Look for error messages

# Check Node version
node --version  # Should be v14+

# Clear node_modules
rm -rf node_modules
npm install
```

### Problem: Login always fails
```bash
# Check database is created
ls -la database.db

# Check if users imported correctly
# Use admin panel to import Excel file
```

### Problem: Double voting not prevented
```bash
# Check has_voted flag in database
SELECT * FROM users WHERE has_voted = 0;

# Check voting logic in app.js
# Ensure submitVote() checks has_voted = true
```

### Problem: Results not updating
```bash
# Check voting_log table has entries
SELECT * FROM voting_log;

# Check vote_count in candidates table
SELECT * FROM candidates;

# Refresh browser or clear cache
```

---

## 📞 Support & Contact

Untuk bantuan atau pertanyaan:
- Email: support@kampus.ac.id
- Dokumentasi: `/docs/` folder
- Issues: Report di issue tracker

---

## 📄 License

MIT License - Free to use for educational purposes

---

## 🎓 Development Team

- **Frontend Dev** - UI/UX & JavaScript
- **Backend Dev** - Server & API
- **DevOps** - Deployment & Infrastructure
- **QA** - Testing & Quality Assurance

---

## ✅ Checklist Implementasi

### Pre-Launch
- [ ] Semua file frontend lengkap (HTML, CSS, JS)
- [ ] Semua file backend lengkap (Express routes, controllers)
- [ ] Database schema terbuat
- [ ] Environment variables dikonfigurasi
- [ ] Testing completed (manual & automated)
- [ ] Security review passed
- [ ] Documentation complete

### Launch
- [ ] Deploy ke production server
- [ ] SSL certificate installed
- [ ] Backups configured
- [ ] Monitoring tools setup
- [ ] Admin panel accessible
- [ ] Excel import tested
- [ ] Announcement untuk users

### Post-Launch
- [ ] Monitor logs & errors
- [ ] Check voting accuracy
- [ ] Backup database regularly
- [ ] Collect user feedback
- [ ] Prepare final results export

---

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Complete UI mockups
- Backend API implemented
- Deployment guide included
- Security features implemented

---

**Status**: ✅ Ready for Development

*Last Updated: May 13, 2026*
