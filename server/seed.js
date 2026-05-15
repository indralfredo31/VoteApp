/**
 * Database Seed Script - VoteApp
 * Creates initial data with pasangan calon
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.json');

const dbData = {
  users: [
    { id: 1, nim: '123456789', dob: '15-01-2003', nama: 'Budi Santoso', prodi: 'S1 Informatika', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 2, nim: '234567890', dob: '20-03-2003', nama: 'Ani Rahmawati', prodi: 'S1 Teknik Elektro', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 3, nim: '345678901', dob: '10-05-2002', nama: 'Dewi Lestari', prodi: 'S1 Manajemen', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 4, nim: '456789012', dob: '25-07-2003', nama: 'Fajar Nugroho', prodi: 'S1 Hukum', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 5, nim: '567890123', dob: '08-12-2002', nama: 'Gita Permata', prodi: 'S1 Desain', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 6, nim: '678901234', dob: '03-04-2003', nama: 'Hendra Wijaya', prodi: 'S1 Akuntansi', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 7, nim: '789012345', dob: '17-09-2002', nama: 'Indah Cahyani', prodi: 'S1 Informatika', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 8, nim: '890123456', dob: '22-11-2003', nama: 'Joko Susilo', prodi: 'S1 Teknik Mesin', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 9, nim: '901234567', dob: '05-06-2002', nama: 'Kartika Sari', prodi: 'S1 Farmasi', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 10, nim: '112233445', dob: '12-08-2003', nama: 'Luki Hermawan', prodi: 'S1 Bisnis Digital', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() }
  ],
  candidates: [
    {
      id: 1,
      nomor_urut: 1,
      nama_ketua: 'Rini Puspita',
      prodi_ketua: 'S1 Informatika',
      foto_ketua: null,
      nama_wakil: 'Ahmad Pratama',
      prodi_wakil: 'S1 Teknik Sipil',
      foto_wakil: null,
      visi: 'Meningkatkan kualitas akademik dan membangun solidaritas antar mahasiswa untuk menciptakan lingkungan kampus yang lebih baik dan harmonis.',
      misi: '1. Memperkuat hubungan antar mahasiswa melalui kegiatan sosial\n2. Menyelenggarakan program akademik yang inovatif\n3. Meningkatkan fasilitas belajar bersama\n4. Membangun komunikasi aktif dengan seluruh civitas akademika',
      vote_count: 245,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      nomor_urut: 2,
      nama_ketua: 'Siti Nurhaliza',
      prodi_ketua: 'S1 Bisnis Digital',
      foto_ketua: null,
      nama_wakil: 'Dimas Prasetyo',
      prodi_wakil: 'S1 Ekonomi',
      foto_wakil: null,
      visi: 'Kampus yang lebih baik dengan inovasi dan kreativitas mahasiswa untuk kemajuan bersama.',
      misi: '1. Mengembangkan program-program inovatif\n2. Membangun kolaborasi antar himpunan\n3. Meningkatkan partisipasi mahasiswa\n4. Mendorong pembangunan infrastruktur kampus yang modern',
      vote_count: 192,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      nomor_urut: 3,
      nama_ketua: 'Farhan Rizki',
      prodi_ketua: 'S1 Komunikasi',
      foto_ketua: null,
      nama_wakil: 'Nadira Aurelia',
      prodi_wakil: 'S1 Psikologi',
      foto_wakil: null,
      visi: 'Kesejahteraan mahasiswa dan perwakilan suara seluruh civitas akademika dengan transparansi dan akuntabilitas.',
      misi: '1. Memberikan dukungan untuk semua program mahasiswa\n2. Membangun transparansi pengelolaan dana\n3. Menyelenggarakan komunikasi aktif dengan mahasiswa\n4. Memastikan hak suara setiap mahasiswa didengar',
      vote_count: 105,
      created_at: new Date().toISOString()
    }
  ],
  votingLog: [],
  settings: {
    voting_open_at: null,
    voting_close_at: null,
    app_title: 'Pemilihan Ketua Senat',
    app_subtitle: 'Periode 2026'
  },
  admin: {
    username: 'admin',
    password: 'admin123'
  }
};

fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2));

console.log('✅ Database seeded!');
console.log(`   - ${dbData.candidates.length} pasangan calon`);
console.log(`   - ${dbData.users.length} users`);
console.log('');
console.log('📋 Test Credentials:');
console.log('   User: NIM 123456789, DOB 15-01-2003');
console.log('   Admin: username admin, password admin123');