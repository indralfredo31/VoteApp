/**
 * Firestore Seed Script
 * Run: node server/seed-firestore.js
 *
 * Creates initial admin account and sample data in Firebase Firestore
 */

require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
function initFirebase() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const credentials = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
    console.error('❌ Missing Firebase env vars. Set in .env or check Vercel dashboard.');
    console.error('   Required: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
    process.exit(1);
  }

  const app = initializeApp({ credential: cert(credentials) });
  return getFirestore(app);
}

async function seed() {
  console.log('🌱 Starting Firestore seed...\n');

  const db = initFirebase();

  // 1. Create admin account
  console.log('👤 Creating admin account...');
  const adminRef = db.collection('admin').doc('main');
  await adminRef.set({
    username: 'admin',
    password: 'admin123',
    updated_at: new Date().toISOString()
  });
  console.log('   ✅ Admin created: admin / admin123\n');

  // 2. Create settings
  console.log('⚙️  Creating settings...');
  const settingsRef = db.collection('settings').doc('config');
  await settingsRef.set({
    voting_enabled: true,
    voting_open_at: null,
    voting_close_at: null,
    app_title: 'Pemilihan Ketua Senat',
    app_subtitle: 'Periode 2026',
    created_at: new Date().toISOString()
  });
  console.log('   ✅ Settings created\n');

  // 3. Create sample voters
  console.log('👥 Creating sample voters...');
  const sampleUsers = [
    { id: 1, nim: '123456789', dob: '15-01-2003', nama: 'Budi Santoso', prodi: 'S1 Informatika', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 2, nim: '234567890', dob: '20-03-2003', nama: 'Ani Rahmawati', prodi: 'S1 Teknik Elektro', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
    { id: 3, nim: '345678901', dob: '10-05-2002', nama: 'Dewi Lestari', prodi: 'S1 Manajemen', has_voted: 0, voted_at: null, voted_for: null, created_at: new Date().toISOString() },
  ];

  const batchUsers = db.batch();
  sampleUsers.forEach((user, i) => {
    const ref = db.collection('users').doc();
    batchUsers.set(ref, user);
  });
  await batchUsers.commit();
  console.log(`   ✅ ${sampleUsers.length} voters created\n`);

  // 4. Create sample candidates
  console.log('🗳️  Creating sample candidates...');
  const sampleCandidates = [
    {
      id: 1, nomor_urut: 1,
      nama_ketua: 'Ahmad Fauzi', prodi_ketua: 'S1 Informatika', foto_ketua: null,
      nama_wakil: 'Sari Wulandari', prodi_wakil: 'S1 Sistem Informasi', foto_wakil: null,
      visi: 'Membangun kampus yang transparan dan responsif terhadap kebutuhan mahasiswa.',
      misi: '1. Perbaikan fasilitas belajar\n2. Transparansi dana osis\n3. Program kerja inovatif',
      vote_count: 0, created_at: new Date().toISOString()
    },
    {
      id: 2, nomor_urut: 2,
      nama_ketua: 'Rizky Pratama', prodi_ketua: 'S1 Teknik Elektro', foto_ketua: null,
      nama_wakil: 'Nadia Safitri', prodi_wakil: 'S1 Akuntansi', foto_wakil: null,
      visi: 'Mahasiswa aktif, kampus bersahabat.',
      misi: '1. Kegiatan mahasiswa yang variatif\n2. Kolaborasi antar prodi\n3. Digitalisasi administrasi',
      vote_count: 0, created_at: new Date().toISOString()
    },
  ];

  const batchCandidates = db.batch();
  sampleCandidates.forEach(c => {
    const ref = db.collection('candidates').doc();
    batchCandidates.set(ref, c);
  });
  await batchCandidates.commit();
  console.log(`   ✅ ${sampleCandidates.length} candidates created\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Firestore seed complete!');
  console.log('');
  console.log('📋 Admin Login:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('');
  console.log('👥 Sample Voters (login NIM + DOB DDMMYYYY):');
  sampleUsers.forEach(u => console.log(`   NIM: ${u.nim} | DOB: ${u.dob} | ${u.nama}`));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});