/**
 * Admin Routes
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const {
  getAllCandidates,
  getCandidateById,
  getCandidateByNomorUrut,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getSettings,
  updateSettings,
  isVotingOpen,
  getStats,
  resetAllUserVotes,
  resetAllCandidateVotes,
  clearVotingLog,
  createUser,
} = require('../config/database');

// ============ AUTH MIDDLEWARE ============

function isAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// ============ FILE UPLOAD ============

const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory storage for data imports (CSV/Excel)
const memoryStorage = multer.memoryStorage();

// Disk storage for images
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, filename);
  }
});

// Upload with memory storage (for imports)
const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    console.log('📎 Multer fileFilter:', {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size
    });
    if (file?.originalname?.match(/\.(csv|xlsx|xls|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file CSV/Excel yang diizinkan untuk import'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Upload with disk storage (for images)
const upload = multer({
  storage: diskStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ============ CANDIDATE ROUTES ============

router.get('/candidates', isAdmin, (req, res) => {
  try {
    const candidates = getAllCandidates();
    res.json({ success: true, data: candidates });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

router.post('/candidates', isAdmin, upload.fields([
  { name: 'foto_ketua', maxCount: 1 },
  { name: 'foto_wakil', maxCount: 1 }
]), (req, res) => {
  try {
    const { nomor_urut, nama_ketua, prodi_ketua, nama_wakil, prodi_wakil, visi, misi } = req.body;

    if (!nomor_urut || !nama_ketua || !nama_wakil) {
      return res.status(400).json({
        success: false,
        message: 'Nomor urut, nama ketua, dan nama wakil harus diisi'
      });
    }

    const existing = getCandidateByNomorUrut(parseInt(nomor_urut));
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Nomor urut sudah digunakan'
      });
    }

    const foto_ketua = req.files?.foto_ketua?.[0]
      ? `/uploads/${req.files.foto_ketua[0].filename}`
      : null;

    const foto_wakil = req.files?.foto_wakil?.[0]
      ? `/uploads/${req.files.foto_wakil[0].filename}`
      : null;

    const candidate = createCandidate({
      nomor_urut: parseInt(nomor_urut),
      nama_ketua,
      prodi_ketua: prodi_ketua || '',
      foto_ketua,
      nama_wakil,
      prodi_wakil: prodi_wakil || '',
      foto_wakil,
      visi: visi || '',
      misi: misi || ''
    });

    res.json({ success: true, message: 'Kandidat berhasil ditambahkan', data: candidate });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menambahkan kandidat' });
  }
});

router.put('/candidates/:id', isAdmin, upload.fields([
  { name: 'foto_ketua', maxCount: 1 },
  { name: 'foto_wakil', maxCount: 1 }
]), (req, res) => {
  try {
    const { id } = req.params;
    const existing = getCandidateById(parseInt(id));

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });
    }

    const { nomor_urut, nama_ketua, prodi_ketua, nama_wakil, prodi_wakil, visi, misi } = req.body;

    if (nomor_urut && parseInt(nomor_urut) !== existing.nomor_urut) {
      const conflict = getCandidateByNomorUrut(parseInt(nomor_urut));
      if (conflict) {
        return res.status(400).json({ success: false, message: 'Nomor urut sudah digunakan' });
      }
    }

    const foto_ketua = req.files?.foto_ketua?.[0]
      ? `/uploads/${req.files.foto_ketua[0].filename}`
      : existing.foto_ketua;

    const foto_wakil = req.files?.foto_wakil?.[0]
      ? `/uploads/${req.files.foto_wakil[0].filename}`
      : existing.foto_wakil;

    const updated = updateCandidate(parseInt(id), {
      nomor_urut: nomor_urut ? parseInt(nomor_urut) : undefined,
      nama_ketua,
      prodi_ketua,
      foto_ketua,
      nama_wakil,
      prodi_wakil,
      foto_wakil,
      visi,
      misi
    });

    res.json({ success: true, message: 'Kandidat berhasil diupdate', data: updated });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat update kandidat' });
  }
});

router.delete('/candidates/:id', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existing = getCandidateById(parseInt(id));

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });
    }

    if (existing.foto_ketua) {
      const fotoPath = path.join(__dirname, '..', existing.foto_ketua);
      if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    }
    if (existing.foto_wakil) {
      const fotoPath = path.join(__dirname, '..', existing.foto_wakil);
      if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    }

    deleteCandidate(parseInt(id));
    res.json({ success: true, message: 'Kandidat berhasil dihapus' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghapus kandidat' });
  }
});

// ============ SETTINGS ROUTES ============

router.get('/settings', isAdmin, (req, res) => {
  try {
    const settings = getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

router.put('/settings', isAdmin, (req, res) => {
  try {
    const { voting_open_at, voting_close_at, app_title, app_subtitle } = req.body;

    const settings = updateSettings({
      ...(voting_open_at !== undefined && { voting_open_at }),
      ...(voting_close_at !== undefined && { voting_close_at }),
      ...(app_title !== undefined && { app_title }),
      ...(app_subtitle !== undefined && { app_subtitle })
    });

    res.json({ success: true, message: 'Pengaturan berhasil disimpan', data: settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// ============ STATS ROUTES ============

router.get('/stats', isAdmin, (req, res) => {
  try {
    const stats = getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// ============ RESET ROUTES ============

router.post('/reset', isAdmin, (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'yes') {
      return res.status(400).json({
        success: false,
        message: 'Konfirmasi diperlukan untuk reset voting'
      });
    }

    resetAllUserVotes();
    resetAllCandidateVotes();
    clearVotingLog();

    res.json({ success: true, message: 'Voting berhasil direset' });
  } catch (error) {
    console.error('Reset voting error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat reset voting' });
  }
});

// ============ EXPORT ROUTES ============

router.get('/export', isAdmin, (req, res) => {
  try {
    const candidates = getAllCandidates();
    const stats = getStats();
    const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);

    const data = candidates.map((c, idx) => ({
      'No': c.nomor_urut,
      'Nama Ketua': c.nama_ketua,
      'Prodi Ketua': c.prodi_ketua,
      'Nama Wakil': c.nama_wakil,
      'Prodi Wakil': c.prodi_wakil,
      'Jumlah Suara': c.vote_count || 0,
      'Persentase': totalVotes > 0 ? `${Math.round((c.vote_count / totalVotes) * 100)}%` : '0%',
      'Ranking': idx + 1
    }));

    const summary = [
      {},
      { 'No': 'RINGKASAN HASIL VOTING' },
      { 'No': 'Total Suara', 'Nama Ketua': stats.totalVotes },
      { 'No': 'Total Pemilih', 'Nama Ketua': stats.totalUsers },
      { 'No': 'Partisipasi', 'Nama Ketua': `${stats.totalUsers > 0 ? Math.round((stats.totalVotes / stats.totalUsers) * 100) : 0}%` },
    ];

    const allData = [...data, ...summary];
    const ws = XLSX.utils.json_to_sheet(allData);
    ws['!cols'] = [
      { wch: 6 }, { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 8 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Voting');

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="hasil-voting-senat-${date}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat export' });
  }
});

// ============ VOTERS / IMPORT ROUTES ============

router.get('/voters', isAdmin, (req, res) => {
  try {
    const db = require('../config/database').getDatabase();
    const users = (db.users || []).map(u => ({
      id: u.id,
      nim: u.nim,
      nama: u.nama,
      prodi: u.prodi,
      hasVoted: u.has_voted === 1
    }));
    res.json({
      success: true,
      data: {
        users,
        total: users.length,
        voted: users.filter(u => u.hasVoted).length
      }
    });
  } catch (error) {
    console.error('Get voters error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

router.delete('/voters/:id', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database').getDatabase();
    const idx = (db.users || []).findIndex(u => u.id === parseInt(id));

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Pemilih tidak ditemukan' });
    }

    db.users.splice(idx, 1);
    require('../config/database').saveDatabase();

    res.json({ success: true, message: 'Pemilih berhasil dihapus' });
  } catch (error) {
    console.error('Delete voter error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

/**
 * POST /api/admin/import-voters
 * Format CSV: NIM,Nama,Prodi,DDMMYYYY
 * Supports comma (,) and semicolon (;) as delimiter
 * No header row needed
 */
router.post('/import-voters', isAdmin, uploadMemory.single('file'), (req, res) => {
  try {
    console.log('📥 Import request received');
    console.log('  - req.session.admin:', req.session?.admin);
    console.log('  - req.file:', req.file ? req.file.originalname : 'NO FILE');
    console.log('  - req.file?.buffer:', req.file?.buffer ? 'exists' : 'NO BUFFER');
    console.log('  - req.body:', req.body);

    if (!req.file) {
      console.log('  - ERROR: No file in request');
      return res.status(400).json({ success: false, message: 'File harus diupload' });
    }

    if (!req.file.buffer) {
      console.log('  - ERROR: No file buffer');
      return res.status(400).json({ success: false, message: 'File buffer tidak tersedia' });
    }

    const filename = String(req.file.originalname || '').toLowerCase();
    const rows = [];
    const errors = [];
    let errorCount = 0;

    if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
      // Parse CSV: format = NIM,Nama,Prodi,DDMMYYYY (tanpa header)
      let content;
      try {
        content = req.file.buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Gagal membaca file CSV' });
      }
      console.log('  - CSV content length:', content.length);
      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length < 1) {
        return res.status(400).json({ success: false, message: 'File CSV kosong' });
      }

      lines.forEach((line, lineIdx) => {
        if (!line.trim()) return;

        // Split by comma or semicolon
        const rawCols = line.includes(';') ? line.split(';') : line.split(',');
        const cols = Array.isArray(rawCols) ? rawCols : [];

        if (cols.length < 2) {
          errors.push(`Baris ${lineIdx + 1}: Format salah (butuh NIM,Nama minimal)`);
          errorCount++;
          return;
        }

        const nim = String(cols[0] || '').trim();
        const nama = String(cols[1] || '').trim();
        const prodi = cols[2] ? String(cols[2] || '').trim() : '';
        const dobRaw = cols[3] ? String(cols[3] || '').trim() : '';

        if (!nim || !nama) {
          errors.push(`Baris ${lineIdx + 1}: NIM atau Nama kosong`);
          errorCount++;
          return;
        }

        // Convert DDMMYYYY → DD-MM-YYYY
        let formattedDob = dobRaw;
        if (/^\d{8}$/.test(dobRaw)) {
          formattedDob = `${dobRaw.slice(0,2)}-${dobRaw.slice(2,4)}-${dobRaw.slice(4,8)}`;
        }

        rows.push({ nim, nama, prodi, dob: formattedDob });
      });
    } else {
      // Parse Excel: kolom NIM, Nama, Prodi, Tanggal Lahir (DDMMYYYY)
      let workbook;
      try {
        workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Format file Excel tidak valid' });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        return res.status(400).json({ success: false, message: 'Sheet tidak ditemukan' });
      }

      let rawRows;
      try {
        rawRows = XLSX.utils.sheet_to_json(worksheet);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Gagal membaca sheet Excel' });
      }

      rawRows.forEach((row, idx) => {
        if (!row || typeof row !== 'object') {
          errors.push(`Baris ${idx + 2}: Format baris tidak valid`);
          errorCount++;
          return;
        }

        const nim = String(row.NIM || row.nim || row['Nim'] || '').trim();
        const nama = String(row.Nama || row.name || row.nama || row['Nama'] || '').trim();
        const prodi = String(row.Prodi || row.prodi || row['Prodi'] || '').trim();

        // Handle various date formats from Excel (number, Date object, or string)
        const rawDob = row['Tanggal Lahir'] || row.tanggal_lahir || row.dob || row.DOB || row['Tgl Lahir'] || '';
        let dobRaw = '';

        if (typeof rawDob === 'number') {
          // Excel serial date number - convert to string DDMMYYYY
          const date = XLSX.SSF.parse_date_code(rawDob);
          if (date) {
            dobRaw = `${String(date.d).padStart(2, '0')}${String(date.m).padStart(2, '0')}${String(date.y).slice(-4)}`;
          }
        } else if (rawDob instanceof Date) {
          dobRaw = `${String(rawDob.getDate()).padStart(2, '0')}${String(rawDob.getMonth() + 1).padStart(2, '0')}${String(rawDob.getFullYear())}`;
        } else if (typeof rawDob === 'string') {
          dobRaw = rawDob.trim().replace(/[-/]/g, '');
        } else if (rawDob && typeof rawDob.toString === 'function') {
          dobRaw = String(rawDob).trim().replace(/[-/]/g, '');
        }

        if (!nim || !nama) {
          errors.push(`Baris ${idx + 2}: NIM atau Nama kosong`);
          errorCount++;
          return;
        }

        let formattedDob = dobRaw;
        if (/^\d{8}$/.test(dobRaw)) {
          formattedDob = `${dobRaw.slice(0,2)}-${dobRaw.slice(2,4)}-${dobRaw.slice(4,8)}`;
        }

        rows.push({ nim, nama, prodi, dob: formattedDob });
      });
    }

    if (rows.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data valid. ' + errors.slice(0, 5).join('; ')
      });
    }

    let successCount = 0;
    const db = require('../config/database').getDatabase();

    rows.forEach((row, idx) => {
      const { nim, nama, prodi, dob } = row;

      // Check duplicate
      const existing = (db.users || []).find(u => u.nim === nim);
      if (existing) {
        errors.push(`Baris ${idx + 1}: NIM ${nim} sudah ada`);
        errorCount++;
        return;
      }

      createUser({ nim, nama, prodi, dob: dob || '01-01-2000' });
      successCount++;
    });

    res.json({
      success: true,
      message: `Import selesai: ${successCount} berhasil, ${errorCount} gagal`,
      data: { successCount, errorCount: errorCount + errors.length, errors: errors.slice(0, 20) }
    });
  } catch (error) {
    console.error('Import voters error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat import: ' + error.message });
  }
});

// Legacy route alias
router.post('/import-users', isAdmin, uploadMemory.single('file'), (req, res) => {
  // Redirect to import-voters logic
  req.url = '/import-voters';
  router.handle(req, res, () => {});
});

module.exports = router;
