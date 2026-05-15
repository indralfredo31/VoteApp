import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { adminApi } from '../../api/adminApi';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

export default function AdminVoters() {
  const { logout, setAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [voters, setVoters] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [voted, setVoted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; error: number; errors: string[] } | null>(null);
  const [search, setSearch] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadVoters();
  }, []);

  useEffect(() => {
    if (!voters.length) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('.voter-row', { y: 20, opacity: 0, duration: 0.4, stagger: 0.03, ease: 'power3.out' });
    }, tableRef);
    return () => ctx.revert();
  }, [voters]);

  const loadVoters = async () => {
    try {
      const response = await adminApi.getVoters();
      if (response.success && response.data) {
        setVoters(response.data.users);
        setTotal(response.data.total);
        setVoted(response.data.voted);
      }
    } catch (err) {
      console.error('Failed to load voters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.adminLogout(); } catch (e) { /* continue */ }
    logout(); setAdmin(false); navigate('/admin/login');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await adminApi.importVoters(file);
      if (response.success && response.data) {
        setUploadResult({ success: response.data.successCount, error: response.data.errorCount, errors: response.data.errors });
        loadVoters();
      } else {
        setUploadResult({ success: 0, error: 1, errors: [response.message || 'Upload gagal'] });
      }
    } catch (err: any) {
      setUploadResult({ success: 0, error: 1, errors: [err?.response?.data?.message || 'Terjadi kesalahan'] });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin hapus "${nama}"?`)) return;
    try {
      const response = await adminApi.deleteVoter(id);
      if (response.success) loadVoters();
      else alert(response.message);
    } catch { alert('Gagal menghapus'); }
  };

  const filtered = voters.filter(v =>
    v.nama.toLowerCase().includes(search.toLowerCase()) ||
    v.nim.includes(search) ||
    (v.prodi || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-surface-light/30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-text-muted hover:text-text-primary transition-colors">← Dashboard</Link>
            <h1 className="text-lg font-bold text-text-primary">Data Pemilih</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors">Logout</button>
        </div>
      </header>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Upload Section */}
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">📥 Import Data Pemilih</h3>
            <p className="text-text-secondary text-sm mb-4">Upload file CSV atau Excel (.csv, .xlsx). Kolom wajib: <strong className="text-text-primary">NIM</strong> dan <strong className="text-text-primary">Nama</strong>. Opsional: Prodi, Tanggal Lahir.</p>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label className="btn-base btn-primary cursor-pointer flex items-center gap-2">
                {isUploading ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Mengupload...</>
                ) : (
                  <><span>📁</span>Pilih File CSV/Excel</>
                )}
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
              </label>

              <a href="/template-pemilih.csv" download className="btn-base btn-secondary text-sm">
                📄 Download Template CSV
              </a>
            </div>

            {uploadResult && (
              <div className={`mt-4 p-4 rounded-xl border ${uploadResult.error === 0 ? 'border-primary/30 bg-primary/5' : 'border-accent/30 bg-accent/5'}`}>
                <p className={`font-semibold ${uploadResult.error === 0 ? 'text-primary' : 'text-accent'}`}>
                  ✅ Berhasil: {uploadResult.success} | ❌ Gagal: {uploadResult.error}
                </p>
                {uploadResult.errors.length > 0 && (
                  <div className="mt-2 text-sm text-text-secondary max-h-32 overflow-y-auto">
                    {uploadResult.errors.map((err, i) => <p key={i}>• {err}</p>)}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 p-3 bg-surface-light/20 rounded-xl text-sm text-text-muted">
              <p><strong>Format CSV:</strong> NIM,Nama,Prodi,DDMMYYYY (tanpa header)</p>
              <p className="mt-1"><strong>Contoh (koma):</strong></p>
              <code className="block bg-surface p-2 rounded mt-1 text-xs text-text-secondary overflow-x-auto">
                123456789,Budi Santoso,S1 Informatika,15012003{'\n'}
                234567890,Ani Rahmawati,S1 Teknik Elektro,20032003
              </code>
              <p className="mt-2"><strong>Contoh (titik koma):</strong></p>
              <code className="block bg-surface p-2 rounded mt-1 text-xs text-text-secondary overflow-x-auto">
                123456789;Budi Santoso;S1 Informatika;15012003
              </code>
              <p className="mt-2 text-accent"><strong>Kolom Prodi & Tanggal Lahir opsional</strong></p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card text-center">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Pemilih</p>
              <p className="text-3xl font-extrabold text-text-primary">{total}</p>
            </div>
            <div className="card text-center">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Sudah Voting</p>
              <p className="text-3xl font-extrabold text-primary">{voted}</p>
            </div>
            <div className="card text-center">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Belum Voting</p>
              <p className="text-3xl font-extrabold text-accent">{total - voted}</p>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary">Daftar Pemilih</h3>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIM, atau prodi..."
                className="input-base max-w-xs"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <p className="text-xl mb-2">{search ? 'Tidak ada hasil pencarian' : 'Belum ada data pemilih'}</p>
                {search && <button onClick={() => setSearch('')} className="text-primary hover:underline text-sm">Clear search</button>}
              </div>
            ) : (
              <div ref={tableRef} className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-light/30">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">NIM</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Nama</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Prodi</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((voter) => (
                      <tr key={voter.id} className="voter-row border-b border-surface-light/20 last:border-0 hover:bg-surface-light/10 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm text-text-primary">{voter.nim}</td>
                        <td className="py-3 px-4 text-text-primary font-medium">{voter.nama}</td>
                        <td className="py-3 px-4 text-text-secondary text-sm">{voter.prodi || '-'}</td>
                        <td className="py-3 px-4">
                          {voter.hasVoted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">✓ Sudah Vote</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent">Belum Vote</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(voter.id, voter.nama)} className="px-3 py-1.5 text-xs text-error hover:bg-error/10 rounded-lg transition-colors">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {search && (
              <p className="text-center text-text-muted text-sm mt-4">
                Menampilkan {filtered.length} dari {voters.length} data
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}