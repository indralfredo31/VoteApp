/**
 * Admin Routes
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const db = require('../config/database');

// ============ AUTH MIDDLEWARE ============

const { requireAdmin } = require('../config/jwtAuth');

function isAdmin(req, res, next) {
  // Wrap jwtAuth middleware for backward compatibility
  return requireAdmin(req, res, next);
}

// ============ FILE UPLOAD ============

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const memoryStorage = multer.memoryStorage();
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
  }
});

const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    if (file?.originalname?.match(/\.(csv|xlsx|xls|txt)$/i)) cb(null, true);
    else cb(new Error('Hanya file CSV/Excel yang diizinkan untuk import'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const upload = multer({
  storage: diskStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ============ CANDIDATE ROUTES ============

router.get('/candidates', isAdmin, async (req, res) => {
  try {
    const candidates = await db.getAllCandidates();
    res.json({ success: true, data: candidates });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

router.post('/candidates', isAdmin, upload.fields([
  { name: 'foto_ketua', maxCount: 1 },
  { name: 'foto_wakil', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nomor_urut, nama_ketua, prodi_ketua, nama_wakil, prodi_wakil, visi, misi } = req.body;

    if (!nomor_urut || !nama_ketua || !nama_wakil) {
      return res.status(400).json({ success: false, message: 'Nomor urut, nama ketua, dan nama wakil harus diisi' });
    }

    const existing = await db.getCandidateByNomorUrut(parseInt(nomor_urut));
    if (existing) {
      return res.status(400).json({ success: false, message: 'Nomor urut sudah digunakan' });
    }

    const foto_ketua = req.files?.foto_ketua?.[0] ? `/uploads/${req.files.foto_ketua[0].filename}` : null;
    const foto_wakil = req.files?.foto_wakil?.[0] ? `/uploads/${req.files.foto_wakil[0].filename}` : null;

    const candidate = await db.createCandidate({
      nomor_urut: parseInt(nomor_urut),
      nama_ketua, prodi_ketua: prodi_ketua || '', foto_ketua,
      nama_wakil, prodi_wakil: prodi_wakil || '', foto_wakil,
      visi: visi || '', misi: misi || ''
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
]), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getCandidateById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });

    const { nomor_urut, nama_ketua, prodi_ketua, nama_wakil, prodi_wakil, visi, misi } = req.body;

    if (nomor_urut && parseInt(nomor_urut) !== existing.nomor_urut) {
      const conflict = await db.getCandidateByNomorUrut(parseInt(nomor_urut));
      if (conflict) return res.status(400).json({ success: false, message: 'Nomor urut sudah digunakan' });
    }

    const foto_ketua = req.files?.foto_ketua?.[0] ? `/uploads/${req.files.foto_ketua[0].filename}` : existing.foto_ketua;
    const foto_wakil = req.files?.foto_wakil?.[0] ? `/uploads/${req.files.foto_wakil[0].filename}` : existing.foto_wakil;

    const updated = await db.updateCandidate(id, {
      nomor_urut: nomor_urut ? parseInt(nomor_urut) : undefined,
      nama_ketua, prodi_ketua, foto_ketua, nama_wakil, prodi_wakil, foto_wakil, visi, misi
    });

    res.json({ success: true, message: 'Kandidat berhasil diupdate', data: updated });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat update kandidat' });
  }
});

router.delete('/candidates/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getCandidateById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });

    // Note: delete candidate photos not implemented for Firestore
    await db.deleteCandidate(id);
    res.json({ success: true, message: 'Kandidat berhasil dihapus' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghapus kandidat' });
  }
});

// ============ SETTINGS ROUTES ============

router.get('/settings', isAdmin, async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

router.put('/settings', isAdmin, async (req, res) => {
  try {
    const { voting_enabled, voting_open_at, voting_close_at, app_title, app_subtitle } = req.body;
    const settings = await db.updateSettings({
      ...(voting_enabled !== undefined && { voting_enabled }),
      ...(voting_open_at !== undefined && { voting_open_at }),
      ...(voting_close_at !== undefined && { voting_close_at }),
      ...(app_title !== undefined && { app_title }),
      ...(app_subtitle !== undefined && { app_subtitle })
    });
    res.json({ success: true, message: 'Pengaturan berhasil disimpan', data: settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat update settings' });
  }
});

// ============ STATS ROUTES ============

router.get('/stats', isAdmin, async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// ============ RESET ROUTES ============

router.post('/reset', isAdmin, async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'yes') return res.status(400).json({ success: false, message: 'Konfirmasi diperlukan untuk reset voting' });

    await db.resetAllUserVotes();
    await db.resetAllCandidateVotes();
    await db.clearVotingLog();

    res.json({ success: true, message: 'Voting berhasil direset' });
  } catch (error) {
    console.error('Reset voting error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat reset voting' });
  }
});

// ============ EXPORT ROUTES ============

router.get('/export', isAdmin, async (req, res) => {
  try {
    const [candidates, stats] = await Promise.all([db.getAllCandidates(), db.getStats()]);
    const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);

    const data = candidates.map((c, idx) => ({
      'No': c.nomor_urut, 'Nama Ketua': c.nama_ketua, 'Prodi Ketua': c.prodi_ketua,
      'Nama Wakil': c.nama_wakil, 'Prodi Wakil': c.prodi_wakil,
      'Jumlah Suara': c.vote_count || 0,
      'Persentase': totalVotes > 0 ? `${Math.round((c.vote_count / totalVotes) * 100)}%` : '0%',
      'Ranking': idx + 1
    }));

    const summary = [
      {},
      { 'No': 'RINGKASAN HASIL VOTING' },
      { 'No': 'Total Suara', 'Nama Ketua': stats.totalVotes },
      { 'No': 'Total Pemilih', 'Nama Ketua': stats.totalUsers },
      { 'No': 'Partisipasi', 'Nama Ketua': `${stats.totalUsers > 0 ? Math.round((stats.totalVotes / stats.totalUsers) * 100) : 0}%` }
    ];

    const ws = XLSX.utils.json_to_sheet([...data, ...summary]);
    ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 8 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Voting');

    res.setHeader('Content-Disposition', `attachment; filename="hasil-voting-senat-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat export' });
  }
});

// ============ VOTERS / IMPORT ROUTES ============

router.get('/voters', isAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const mapped = users.map(u => ({ id: u.id, nim: u.nim, nama: u.nama, prodi: u.prodi, hasVoted: u.has_voted === 1 }));
    res.json({
      success: true,
      data: {
        users: mapped,
        total: mapped.length,
        voted: mapped.filter(u => u.hasVoted).length
      }
    });
  } catch (error) {
    console.error('Get voters error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

router.delete('/voters/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // The id could be the Firestore doc id (string) or the numeric id field
    const users = await db.getAllUsers();
    // Try to find by Firestore doc id first, then by numeric id
    const user = users.find(u => u.id === id || u.id === String(id) || u.id === parseInt(id));
    if (!user) return res.status(404).json({ success: false, message: 'Pemilih tidak ditemukan' });

    // Delete from Firestore by doc id (Firestore document ID, not the numeric id field)
    const { getDb } = require('../config/firebase');
    const db2 = getDb();
    if (db2) await db2.collection('users').doc(user.id).delete();

    res.json({ success: true, message: 'Pemilih berhasil dihapus' });
  } catch (error) {
    console.error('Delete voter error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

router.post('/import-voters', isAdmin, uploadMemory.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File harus diupload' });
    if (!req.file.buffer) return res.status(400).json({ success: false, message: 'File buffer tidak tersedia' });

    const filename = String(req.file.originalname || '').toLowerCase();
    const rows = [], errors = [];
    let errorCount = 0;

    if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
      const content = req.file.buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length < 1) return res.status(400).json({ success: false, message: 'File CSV kosong' });

      lines.forEach((line, lineIdx) => {
        if (!line.trim()) return;
        const rawCols = line.includes(';') ? line.split(';') : line.split(',');
        if (rawCols.length < 2) { errors.push(`Baris ${lineIdx + 1}: Format salah`); errorCount++; return; }
        const nim = String(rawCols[0] || '').trim();
        const nama = String(rawCols[1] || '').trim();
        const prodi = rawCols[2] ? String(rawCols[2] || '').trim() : '';
        const dobRaw = rawCols[3] ? String(rawCols[3] || '').trim() : '';
        if (!nim || !nama) { errors.push(`Baris ${lineIdx + 1}: NIM atau Nama kosong`); errorCount++; return; }
        let formattedDob = dobRaw;
        if (/^\d{8}$/.test(dobRaw)) formattedDob = `${dobRaw.slice(0,2)}-${dobRaw.slice(2,4)}-${dobRaw.slice(4,8)}`;
        rows.push({ nim, nama, prodi, dob: formattedDob });
      });
    } else {
      let workbook;
      try { workbook = XLSX.read(req.file.buffer, { type: 'buffer' }); }
      catch (e) { return res.status(400).json({ success: false, message: 'Format file Excel tidak valid' }); }

      const ws = workbook.Sheets[workbook.SheetNames[0]];
      if (!ws) return res.status(400).json({ success: false, message: 'Sheet tidak ditemukan' });

      const rawRows = XLSX.utils.sheet_to_json(ws);
      rawRows.forEach((row, idx) => {
        if (!row || typeof row !== 'object') { errors.push(`Baris ${idx + 2}: Format baris tidak valid`); errorCount++; return; }
        const nim = String(row.NIM || row.nim || row['Nim'] || '').trim();
        const nama = String(row.Nama || row.name || row.nama || row['Nama'] || '').trim();
        const prodi = String(row.Prodi || row.prodi || row['Prodi'] || '').trim();
        const rawDob = row['Tanggal Lahir'] || row.tanggal_lahir || row.dob || row.DOB || row['Tgl Lahir'] || '';
        let dobRaw = '';
        if (typeof rawDob === 'number') {
          const date = XLSX.SSF.parse_date_code(rawDob);
          if (date) dobRaw = `${String(date.d).padStart(2,'0')}${String(date.m).padStart(2,'0')}${String(date.y).slice(-4)}`;
        } else if (rawDob instanceof Date) {
          dobRaw = `${String(rawDob.getDate()).padStart(2,'0')}${String(rawDob.getMonth()+1).padStart(2,'0')}${rawDob.getFullYear()}`;
        } else if (typeof rawDob === 'string') {
          dobRaw = rawDob.trim().replace(/[-/]/g, '');
        }
        if (!nim || !nama) { errors.push(`Baris ${idx + 2}: NIM atau Nama kosong`); errorCount++; return; }
        let formattedDob = dobRaw;
        if (/^\d{8}$/.test(dobRaw)) formattedDob = `${dobRaw.slice(0,2)}-${dobRaw.slice(2,4)}-${dobRaw.slice(4,8)}`;
        rows.push({ nim, nama, prodi, dob: formattedDob });
      });
    }

    if (rows.length === 0 && errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data valid. ' + errors.slice(0, 5).join('; ') });
    }

    let successCount = 0;
    const allUsers = await db.getAllUsers();

    for (const row of rows) {
      const existing = allUsers.find(u => u.nim === row.nim);
      if (existing) { errors.push(`NIM ${row.nim} sudah ada`); errorCount++; continue; }
      await db.createUser({ nim: row.nim, nama: row.nama, prodi: row.prodi, dob: row.dob || '01-01-2000' });
      successCount++;
    }

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

module.exports = router;