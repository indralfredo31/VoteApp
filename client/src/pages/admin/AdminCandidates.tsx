import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { adminApi } from '../../api/adminApi';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import type { Candidate } from '../../types';

export default function AdminCandidates() {
  const { logout, setAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nomor_urut: '',
    nama_ketua: '',
    prodi_ketua: '',
    nama_wakil: '',
    prodi_wakil: '',
    visi: '',
    misi: '',
  });
  const [foto_ketua, setFoto_ketua] = useState<File | null>(null);
  const [foto_wakil, setFoto_wakil] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const response = await adminApi.getCandidates();
      if (response.success && response.data) {
        setCandidates(response.data);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.adminLogout(); } catch (e) { /* continue */ }
    logout();
    setAdmin(false);
    navigate('/admin/login');
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ nomor_urut: '', nama_ketua: '', prodi_ketua: '', nama_wakil: '', prodi_wakil: '', visi: '', misi: '' });
    setFoto_ketua(null);
    setFoto_wakil(null);
    setShowModal(true);
  };

  const openEditModal = (candidate: Candidate) => {
    setEditId(candidate.id);
    setFormData({
      nomor_urut: String(candidate.nomor_urut),
      nama_ketua: candidate.nama_ketua,
      prodi_ketua: candidate.prodi_ketua,
      nama_wakil: candidate.nama_wakil,
      prodi_wakil: candidate.prodi_wakil,
      visi: candidate.visi,
      misi: candidate.misi,
    });
    setFoto_ketua(null);
    setFoto_wakil(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        nomor_urut: parseInt(formData.nomor_urut),
        foto_ketua: foto_ketua || undefined,
        foto_wakil: foto_wakil || undefined,
      };

      let response;
      if (editId) {
        response = await adminApi.editCandidate(editId, data);
      } else {
        response = await adminApi.addCandidate(data);
      }

      if (response.success) {
        setShowModal(false);
        loadCandidates();
        gsap.from('.candidate-item', {
          opacity: 0,
          y: 20,
          stagger: 0.05,
          duration: 0.3,
        });
      } else {
        alert(response.message || 'Gagal menyimpan');
      }
    } catch (err) {
      alert('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin hapus "${name}"?`)) return;
    try {
      const response = await adminApi.deleteCandidate(id);
      if (response.success) {
        loadCandidates();
      } else {
        alert(response.message);
      }
    } catch (err) {
      alert('Gagal menghapus');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-surface-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-text-muted hover:text-text-primary transition-colors">← Dashboard</Link>
              <h1 className="text-lg font-bold text-text-primary">Kelola Pasangan Calon</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-text-primary">Pasangan Calon</h2>
              <p className="text-text-secondary mt-1">{candidates.length} pasangan</p>
            </div>
            <button onClick={openAddModal} className="btn-base btn-primary">
              + Tambah Paslon
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="card text-center py-20">
              <p className="text-text-secondary text-xl mb-4">Belum ada pasangan calon</p>
              <button onClick={openAddModal} className="btn-base btn-primary">+ Tambah Paslon</button>
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="candidate-item card flex items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-extrabold text-primary">{String(candidate.nomor_urut).padStart(2, '0')}</span>
                  </div>

                  <div className="flex items-center gap-4 flex-1">
                    <div className="photo-circle w-12 h-12">
                      {candidate.foto_ketua ? (
                        <img src={candidate.foto_ketua} alt={candidate.nama_ketua} />
                      ) : (
                        <div className="w-full h-full bg-surface-light flex items-center justify-center text-xl">👤</div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{candidate.nama_ketua} & {candidate.nama_wakil}</p>
                      <p className="text-sm text-text-muted">{candidate.prodi_ketua} • {candidate.prodi_wakil}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-primary">{candidate.vote_count}</p>
                    <p className="text-xs text-text-muted">suara</p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEditModal(candidate)} className="px-3 py-2 text-sm bg-surface-light hover:bg-surface-light/80 rounded-lg transition-colors">Edit</button>
                    <button onClick={() => handleDelete(candidate.id, `${candidate.nama_ketua} & ${candidate.nama_wakil}`)} className="px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="bg-surface rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-surface-light/30"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-text-primary mb-6">
              {editId ? 'Edit' : 'Tambah'} Pasangan Calon
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Nomor Urut</label>
                <input type="number" value={formData.nomor_urut} onChange={(e) => setFormData({ ...formData, nomor_urut: e.target.value })} className="input-base" min="1" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Nama Ketua</label>
                  <input type="text" value={formData.nama_ketua} onChange={(e) => setFormData({ ...formData, nama_ketua: e.target.value })} className="input-base" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Prodi Ketua</label>
                  <input type="text" value={formData.prodi_ketua} onChange={(e) => setFormData({ ...formData, prodi_ketua: e.target.value })} className="input-base" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Nama Wakil</label>
                  <input type="text" value={formData.nama_wakil} onChange={(e) => setFormData({ ...formData, nama_wakil: e.target.value })} className="input-base" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Prodi Wakil</label>
                  <input type="text" value={formData.prodi_wakil} onChange={(e) => setFormData({ ...formData, prodi_wakil: e.target.value })} className="input-base" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Foto Ketua</label>
                <input type="file" accept="image/*" onChange={(e) => setFoto_ketua(e.target.files?.[0] || null)} className="input-base file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-surface-light file:text-text-primary hover:file:bg-surface-light/80 file:cursor-pointer" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Foto Wakil</label>
                <input type="file" accept="image/*" onChange={(e) => setFoto_wakil(e.target.files?.[0] || null)} className="input-base file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-surface-light file:text-text-primary hover:file:bg-surface-light/80 file:cursor-pointer" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Visi</label>
                <textarea value={formData.visi} onChange={(e) => setFormData({ ...formData, visi: e.target.value })} className="input-base min-h-[80px]" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Misi</label>
                <textarea value={formData.misi} onChange={(e) => setFormData({ ...formData, misi: e.target.value })} className="input-base min-h-[120px]" required />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-base btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={isSubmitting} className="btn-base btn-primary flex-1">
                  {isSubmitting ? 'Memproses...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}