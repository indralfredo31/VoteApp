# 📋 PLANNING APLIKASI VOTING KETUA SENAT KAMPUS

## 1. OVERVIEW & REQUIREMENTS

### Tujuan Aplikasi
Sistem voting digital untuk pemilihan ketua senat kampus dengan keamanan tingkat basic, interface yang user-friendly, dan responsif di berbagai device.

### Key Features
- ✅ Login dengan NIM (username) dan Tanggal Lahir (password)
- ✅ Import data mahasiswa dari file Excel (.xlsx)
- ✅ Sistem one-vote-per-student (pencegahan double voting)
- ✅ Interface yang clean, minimalist, dan comfortable untuk mata
- ✅ Fully responsive (PC/Laptop dan Smartphone)
- ✅ Smooth scrolling dan transisi animasi
- ✅ Tersimpan voting history

---

## 2. TECH STACK

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Grid, Flexbox, Custom Properties (Variables), Animations
- **JavaScript (Vanilla)** - DOM manipulation, Event handling, Local Storage
- **Responsive Design** - Mobile-first approach

### Backend (Simplified)
- **Node.js + Express** (recommended) atau dapat menggunakan PHP/Python
- **SQLite / JSON** - Database sederhana untuk development
- **Middleware**:
  - Session management
  - Authentication middleware
  - CORS & security headers

### Tools & Libraries
- **ExcelJS** atau **SheetJS** - untuk import Excel
- **bcryptjs** - password hashing (optional untuk production)
- **dotenv** - environment variables

---

## 3. DATABASE SCHEMA

### Tabel: Users (Mahasiswa)
```
id (PK)
nim (UNIQUE) - Username
dob (Date) - Password (format: DD-MM-YYYY)
nama (VARCHAR)
prodi (VARCHAR)
has_voted (BOOLEAN) - Default: false
voted_at (TIMESTAMP)
voted_for (INT FK to Candidates)
```

### Tabel: Candidates (Calon Ketua Senat)
```
id (PK)
nama (VARCHAR)
foto (VARCHAR/BLOB)
visi (TEXT)
misi (TEXT)
nomor_urut (INT)
vote_count (INT) - Default: 0
created_at (TIMESTAMP)
```

### Tabel: Voting Log
```
id (PK)
user_id (FK)
candidate_id (FK)
voted_at (TIMESTAMP)
ip_address (VARCHAR)
```

---

## 4. STRUKTUR FOLDER PROJECT

```
voting-app/
├── public/
│   ├── index.html
│   ├── css/
│   │   ├── style.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── voting.js
│   │   └── import.js
│   └── images/
│       └── (kandidat photos, logo)
│
├── backend/
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vote.js
│   │   └── admin.js (import excel, results)
│   ├── controllers/
│   │   ├── authController.js
│   │   └── votingController.js
│   ├── middleware/
│   │   └── auth.js
│   └── database.db (SQLite)
│
├── .env
├── package.json
└── README.md
```

---

## 5. HALAMAN-HALAMAN APLIKASI

### Halaman 1: SPLASH/LOADING
- Logo kampus
- Animasi loading smooth
- Loading time: 2-3 detik

### Halaman 2: LOGIN
- Input NIM
- Input Tanggal Lahir (date picker)
- Button Login
- Pesan error jika invalid
- Link "Lupa Password?" → hubungi admin

### Halaman 3: VOTING (Main)
- Header: Greeting untuk user yang login
- Informasi: "Anda belum memilih" atau "Anda sudah memilih [nama kandidat]"
- Daftar Kandidat dalam bentuk cards (dapat di-scroll)
- Button "Pilih" pada setiap kandidat
- Tombol Logout di header/footer

### Halaman 4: KONFIRMASI VOTING
- Konfirmasi kandidat yang dipilih
- Foto & data kandidat
- Button: "Konfirmasi Pilihan" atau "Kembali Pilih Lagi"
- Jangan bisa kembali setelah konfirmasi (final)

### Halaman 5: SUKSES VOTING
- Pesan sukses dengan animasi
- Timestamp voting
- Button "Lihat Hasil Sementara" (optional)
- Button "Logout"

### Halaman 6: HASIL VOTING (Admin/Public)
- Statistik voting real-time
- Chart/Grafik hasil voting
- Data calon dengan perolehan suara
- Responsive table atau card layout

---

## 6. FLOW DIAGRAM

```
┌─────────────┐
│   SPLASH    │
└──────┬──────┘
       │ (auto redirect after 2s)
       ↓
┌──────────────┐
│    LOGIN     │ ← Cek NIM & DOB
└──────┬───────┘
       │ (Valid credentials)
       ↓
┌──────────────────────┐
│  DASHBOARD/VOTING    │ ← Cek has_voted status
└──────┬───────────────┘
       │ (Pilih kandidat)
       ↓
┌──────────────────┐
│   KONFIRMASI     │
└──────┬───────────┘
       │ (Confirm)
       ↓
┌──────────────────┐
│  VOTING SUKSES   │
└──────┬───────────┘
       │ (Logout)
       ↓
┌──────────────┐
│    LOGIN     │
└──────────────┘
```

---

## 7. COLOR PALETTE (Minimalist & Eye-Comfortable)

### Primary Colors
- **Background**: `#FAFBFC` (Off-white, netral)
- **Primary**: `#2D6A4F` (Soft Green - nyaman & profesional)
- **Accent**: `#D4A574` (Warm Beige - highlight)
- **Text**: `#2B2D42` (Dark Blue-Gray - readable)
- **Divider**: `#E8EAED` (Light Gray)

### Status Colors
- **Success**: `#52B788` (Lighter Green)
- **Error**: `#E63946` (Soft Red)
- **Info**: `#457B9D` (Soft Blue)
- **Warning**: `#F77F00` (Soft Orange)

### Secondary Palette
```css
--color-bg: #FAFBFC;
--color-bg-secondary: #F4F6F9;
--color-primary: #2D6A4F;
--color-primary-light: #52B788;
--color-accent: #D4A574;
--color-text: #2B2D42;
--color-text-light: #6C757D;
--color-border: #E8EAED;
--color-success: #52B788;
--color-error: #E63946;
```

---

## 8. TYPOGRAPHY

### Font Family
- **Display/Heading**: "Poppins" (Bold, Clean, Modern)
- **Body**: "Inter" atau "Segoe UI" (Readable, professional)

### Font Sizing
- H1: 32px (mobile) / 48px (desktop)
- H2: 24px (mobile) / 32px (desktop)
- H3: 18px (mobile) / 24px (desktop)
- Body: 14px (mobile) / 16px (desktop)
- Small: 12px

---

## 9. RESPONSIVE BREAKPOINTS

```css
/* Mobile First */
Mobile: 320px - 480px
Tablet: 481px - 768px
Desktop: 769px - 1024px
Large Desktop: 1025px+
```

### Key Responsive Elements
- Login form: Full width dengan padding
- Candidate cards: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Header: Hamburger menu (mobile), Full nav (desktop)
- Results chart: Full width responsive

---

## 10. SECURITY CONSIDERATIONS

### Authentication
- ✅ NIM + DOB untuk login
- ✅ Session-based authentication dengan HTTP-Only cookies
- ✅ CSRF protection token

### Data Protection
- ✅ Input validation (server-side)
- ✅ SQL injection prevention (prepared statements)
- ✅ XSS protection (sanitize input)
- ✅ Password hashing (bcryptjs) untuk data sensitif

### Voting Integrity
- ✅ Check `has_voted` flag sebelum submit
- ✅ Logging semua voting activity
- ✅ IP address logging (optional)
- ✅ Timestamp untuk audit trail

### Admin Panel (Optional)
- ✅ Protected route dengan admin credentials
- ✅ Upload Excel file dengan validation
- ✅ Real-time results dashboard
- ✅ Export voting results

---

## 11. USER EXPERIENCE (UX) FEATURES

### Loading & Animation
- Smooth page transitions
- Skeleton loading untuk cards
- Animated success checkmark
- Scroll-into-view animations

### Interaction Design
- Hover effects pada buttons & cards
- Focus states untuk accessibility
- Disabled state untuk tombol (setelah voting)
- Toast notifications untuk feedback

### Error Handling
- Clear error messages
- Guidance untuk recover (misal: forgot password)
- Validation feedback real-time

---

## 12. MOBILE OPTIMIZATION

### Touch-Friendly
- Button size minimum: 44x44px (Apple standard)
- Spacing untuk finger taps
- Swipe gestures untuk card navigation (optional)

### Performance
- Image optimization (lazy loading)
- Minimal animation di mobile (performance)
- Optimized CSS & JS bundle
- Offline support (optional, dengan service worker)

---

## 13. ADMIN PANEL FEATURES

### Data Management
1. **Upload Excel**
   - Format template: NIM | Nama | Prodi | Tanggal Lahir
   - Validation & error handling
   - Batch insert ke database

2. **Candidate Management**
   - Add/Edit/Delete kandidat
   - Upload foto
   - Input visi & misi

3. **Voting Dashboard**
   - Real-time hasil voting
   - Chart/grafik hasil
   - Export hasil (.csv/.xlsx)
   - Clear voting log (reset)

---

## 14. TESTING CHECKLIST

### Functional Testing
- [ ] Login dengan NIM dan DOB valid
- [ ] Login gagal dengan kredensial invalid
- [ ] User yang sudah voting tidak bisa voting lagi
- [ ] Vote berhasil tersimpan di database
- [ ] Hasil voting ter-update real-time

### Responsive Testing
- [ ] Login page responsif di mobile & desktop
- [ ] Candidate cards layout responsive
- [ ] Header/navigation responsive
- [ ] Form input dapat diterima dengan baik di touchscreen

### Security Testing
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Session hijacking prevention
- [ ] Double voting prevention

### Performance Testing
- [ ] Page load time < 3 detik
- [ ] Smooth scroll & transitions
- [ ] Image optimization
- [ ] Bundle size optimization

---

## 15. DEPLOYMENT

### Development Environment
- Local: Node.js + Express + SQLite
- Testing: Staging server

### Production Deployment
- **Platform**: Heroku, AWS, DigitalOcean, atau VPS lokal kampus
- **Database**: PostgreSQL atau MySQL (untuk production)
- **SSL/HTTPS**: Mandatory
- **CDN**: Optional untuk static assets
- **Backup**: Daily backup untuk database

---

## 16. TIMELINE DEVELOPMENT

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Planning & Design** | 2-3 days | Wireframe, color scheme, prototype |
| **Frontend Development** | 3-4 days | HTML/CSS/JS untuk semua halaman |
| **Backend Development** | 3-4 days | API routes, database, auth |
| **Integration** | 2 days | Frontend + Backend integration |
| **Testing & QA** | 2-3 days | Functional, responsive, security |
| **Deployment & Launch** | 1-2 days | Setup server, data import, go-live |
| **Total** | **~14-18 days** | |

---

## 17. NEXT STEPS

1. ✅ **Finalize Design** - Approval dari stakeholders
2. ✅ **Setup Environment** - Install Node.js, databases
3. ✅ **Create Database Schema** - Setup database structure
4. ✅ **Develop Frontend** - HTML/CSS/JS development
5. ✅ **Develop Backend** - API & database integration
6. ✅ **Integration & Testing** - Complete testing
7. ✅ **Launch** - Deploy ke production server

---

*Planning Document v1.0 - Ready for Development*
