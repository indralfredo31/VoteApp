import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { votingApi } from '../../api/votingApi';
import { adminApi } from '../../api/adminApi';
import { useAuthStore } from '../../store/authStore';
import type { VotingStats } from '../../types';

gsap.registerPlugin(ScrollTrigger);

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<VotingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await votingApi.getResults();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Real-time polling: refresh stats every 3 seconds
    const pollInterval = setInterval(loadData, 3000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from('.admin-stat', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    }, statsRef);

    return () => ctx.revert();
  }, [stats]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleReset = async () => {
    if (!confirm('Yakin ingin reset semua voting? Data vote akan dihapus.')) return;

    // Check if token is still valid (not expired)
    const stored = localStorage.getItem('voteapp-auth');
    let tokenValid = false;
    if (stored) {
      try {
        const auth = JSON.parse(stored);
        const token = auth.state?.token;
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.exp && payload.exp * 1000 > Date.now()) tokenValid = true;
        }
      } catch (_) {}
    }
    if (!tokenValid) {
      alert('Sesi habis. Silakan login kembali.');
      logout();
      navigate('/admin/login');
      return;
    }

    try {
      const response = await adminApi.resetVoting();
      if (response.success) {
        window.location.reload();
      } else {
        alert(response.message || 'Gagal reset voting');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string }; status?: number } };
      if (err.response?.status === 401) {
        alert('Sesi habis. Silakan login kembali.');
        logout();
        navigate('/admin/login');
      } else {
        alert('Gagal reset voting: ' + (err.response?.data?.message || (e as Error).message || 'Unknown error'));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-surface-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <h1 className="text-lg font-bold text-text-primary">Admin Panel</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary mb-3 tracking-tight">
              Dashboard
            </h1>
            <p className="text-text-secondary text-lg">
              Kelola pemilihan ketua senat kampus
            </p>
          </div>

          {/* Stats Cards */}
          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="admin-stat card">
              <p className="text-text-muted text-sm uppercase tracking-wider mb-2">Total Suara</p>
              <p className="text-4xl font-extrabold text-primary">{stats?.totalVotes || 0}</p>
            </div>

            <div className="admin-stat card">
              <p className="text-text-muted text-sm uppercase tracking-wider mb-2">Total Pemilih</p>
              <p className="text-4xl font-extrabold text-text-primary">{stats?.totalVoters || 0}</p>
            </div>

            <div className="admin-stat card">
              <p className="text-text-muted text-sm uppercase tracking-wider mb-2">Partisipasi</p>
              <p className="text-4xl font-extrabold text-accent">{stats?.participationRate || 0}%</p>
            </div>

            <div className="admin-stat card">
              <p className="text-text-muted text-sm uppercase tracking-wider mb-2">Kandidat</p>
              <p className="text-4xl font-extrabold text-text-primary">{stats?.results?.length || 0}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Aksi Cepat</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Link
                to="/admin/candidates"
                className="card hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Kelola Paslon</p>
                    <p className="text-sm text-text-muted">Tambah, edit, hapus</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/admin/settings"
                className="card hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Pengaturan</p>
                    <p className="text-sm text-text-muted">Waktu voting</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/admin/export"
                className="card hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-light/20 flex items-center justify-center group-hover:bg-primary-light/30 transition-colors">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Export Excel</p>
                    <p className="text-sm text-text-muted">Unduh hasil voting</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/admin/voters"
                className="card hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Data Pemilih</p>
                    <p className="text-sm text-text-muted">Import CSV/Excel</p>
                  </div>
                </div>
              </Link>

              <button
                onClick={handleReset}
                className="card hover:border-error/50 transition-colors group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-error/20 flex items-center justify-center group-hover:bg-error/30 transition-colors">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Reset Voting</p>
                    <p className="text-sm text-text-muted">Hapus semua vote</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Results Preview */}
          {stats && stats.results.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">Perolehan Suara</h2>
              <div className="card space-y-4">
                {stats.results.map((result, index) => (
                  <div key={result.id} className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-extrabold ${
                        index === 0 ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary'
                      }`}
                    >
                      {String(result.nomor_urut).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-medium">
                        {result.nama_ketua} & {result.nama_wakil}
                      </p>
                      <div className="mt-1 h-2 bg-surface-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary">{result.percentage}%</p>
                      <p className="text-xs text-text-muted">{result.vote_count} suara</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}