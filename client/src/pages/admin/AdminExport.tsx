import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import gsap from 'gsap';
import { votingApi } from '../../api/votingApi';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import type { VotingStats } from '../../types';

export default function AdminExport() {
  const { logout, setAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<VotingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    if (!stats) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from('.export-item', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }, tableRef);

    return () => ctx.revert();
  }, [stats]);

  const loadResults = async () => {
    try {
      const response = await votingApi.getResults();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
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

  const handleExport = () => {
    if (!stats) return;
    setIsExporting(true);

    try {
      // Prepare data for Excel
      const data = stats.results.map((result, index) => ({
        'No': result.nomor_urut,
        'Nama Ketua': result.nama_ketua,
        'Nama Wakil': result.nama_wakil,
        'Jumlah Suara': result.vote_count,
        'Persentase': `${result.percentage}%`,
        'Ranking': index + 1,
      }));

      // Add summary
      const summary = [
        {},
        { 'No': 'RINGKASAN' },
        { 'No': 'Total Suara', 'Nama Ketua': stats.totalVotes },
        { 'No': 'Total Pemilih', 'Nama Ketua': stats.totalVoters },
        { 'No': 'Partisipasi', 'Nama Ketua': `${stats.participationRate}%` },
      ];

      const ws = XLSX.utils.json_to_sheet([...data, ...summary]);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 25 },  // Nama Ketua
        { wch: 25 },  // Nama Wakil
        { wch: 15 },  // Jumlah Suara
        { wch: 12 },  // Persentase
        { wch: 10 },  // Ranking
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hasil Voting');

      // Generate filename
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `hasil-voting-senat-${date}.xlsx`);

      setTimeout(() => setIsExporting(false), 1000);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Gagal export Excel');
      setIsExporting(false);
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-text-muted hover:text-text-primary transition-colors">← Dashboard</Link>
              <h1 className="text-lg font-bold text-text-primary">Export Hasil</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-text-primary">Export Hasil Voting</h2>
              <p className="text-text-secondary mt-1">Unduh hasil pemilihan dalam format Excel</p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || !stats}
              className="btn-base btn-primary flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  📊 Unduh Excel
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div ref={tableRef} className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-light/30">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">No</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Nama Pasangan</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Suara</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Persentase</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Ranking</th>
                </tr>
              </thead>
              <tbody>
                {stats?.results.map((result, index) => (
                  <tr key={result.id} className="export-item border-b border-surface-light/20 last:border-0">
                    <td className="py-4 px-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary'
                      }`}>
                        {String(result.nomor_urut).padStart(2, '0')}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-text-primary">{result.nama_ketua} & {result.nama_wakil}</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-2xl font-bold text-primary">{result.vote_count}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-semibold text-text-secondary">{result.percentage}%</span>
                      <div className="mt-1 h-1.5 bg-surface-light rounded-full overflow-hidden max-w-[100px] ml-auto">
                        <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full" style={{ width: `${result.percentage}%` }} />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`text-sm font-bold ${index === 0 ? 'text-primary' : 'text-text-muted'}`}>
                        #{index + 1}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="bg-surface-light/20 p-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Suara</p>
                <p className="text-2xl font-extrabold text-primary">{stats?.totalVotes || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Pemilih</p>
                <p className="text-2xl font-extrabold text-text-primary">{stats?.totalVoters || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Partisipasi</p>
                <p className="text-2xl font-extrabold text-accent">{stats?.participationRate || 0}%</p>
              </div>
            </div>
          </div>

          <p className="text-center text-text-muted text-sm mt-6">
            Klik "Unduh Excel" untuk menyimpan hasil voting ke file .xlsx
          </p>
        </div>
      </div>
    </div>
  );
}