import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { votingApi } from '../../api/votingApi';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import type { VotingSettings } from '../../types';

// Custom datetime input that works in Firefox
function DateTimeInput({
  label,
  value,
  onChange,
  helpText,
}: {
  label: string;
  value: string | null;
  onChange: (val: string) => void;
  helpText: string;
}) {
  // Parse ISO string to local date/time for input
  const parseValue = (iso: string | null): string => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  // Convert local datetime string to ISO string
  const handleChange = (localVal: string) => {
    if (!localVal) {
      onChange('');
      return;
    }
    const d = new Date(localVal);
    if (isNaN(d.getTime())) return;
    onChange(d.toISOString());
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-text-secondary mb-2">{label}</label>
      <input
        type="datetime-local"
        value={parseValue(value)}
        onChange={(e) => handleChange(e.target.value)}
        className="input-base"
        // Firefox polyfill hints
        inputMode="none"
        onFocus={(e) => {
          // On focus, switch to text input to force picker on Firefox
          if (!e.target.value) {
            e.target.showPicker?.();
          }
        }}
      />
      <p className="text-xs text-text-muted mt-1">{helpText}</p>
    </div>
  );
}

// Slide Toggle Switch component
function SlideToggle({
  checked,
  onChange,
  labelOn,
  labelOff,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        checked ? 'bg-primary' : 'bg-surface-light'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-8' : 'translate-x-1'
        }`}
      />
      <span className="sr-only">{checked ? labelOn : labelOff}</span>
    </button>
  );
}

export default function AdminSettings() {
  const { logout, setAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<VotingSettings>({
    voting_enabled: true,
    voting_open_at: null,
    voting_close_at: null,
    app_title: '',
    app_subtitle: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'open' | 'closed' | 'unknown'>('unknown');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsRes, statusRes] = await Promise.all([
        adminApi.getSettings(),
        votingApi.getStatus().catch(() => null),
      ]);
      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
      }
      if (statusRes?.success && statusRes.data) {
        setCurrentStatus(statusRes.data.isOpen ? 'open' : 'closed');
      } else {
        setCurrentStatus('unknown');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const response = await adminApi.updateSettings(settings);
      if (response.success) {
        setMessage('✅ Pengaturan berhasil disimpan');
        // Refresh status after save
        const statusRes = await votingApi.getStatus().catch(() => null);
        if (statusRes?.success && statusRes.data) {
          setCurrentStatus(statusRes.data.isOpen ? 'open' : 'closed');
        }
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Gagal menyimpan: ' + (response.message || ''));
      }
    } catch (err) {
      setMessage('❌ Terjadi kesalahan');
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatLocal = (iso: string | null | undefined) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return null;
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-text-muted hover:text-text-primary transition-colors">← Dashboard</Link>
              <h1 className="text-lg font-bold text-text-primary">Pengaturan</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary">Pengaturan Voting</h2>
            <p className="text-text-secondary mt-1">Atur jadwal dan informasi voting</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* App Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Informasi Aplikasi</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Judul Aplikasi</label>
                  <input
                    type="text"
                    value={settings.app_title}
                    onChange={(e) => setSettings({ ...settings, app_title: e.target.value })}
                    className="input-base"
                    placeholder="Pemilihan Ketua Senat"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={settings.app_subtitle}
                    onChange={(e) => setSettings({ ...settings, app_subtitle: e.target.value })}
                    className="input-base"
                    placeholder="Periode 2026"
                  />
                </div>
              </div>
            </div>

            {/* Manual Toggle */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Kontrol Voting</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Voting Aktif</p>
                  <p className="text-xs text-text-muted mt-1">
                    {settings.voting_enabled
                      ? 'Buka/Tutup voting secara manual — jadwal tidak aktif'
                      : 'Gunakan jadwal otomatis — voting dibuka & ditutup sesuai jadwal'}
                  </p>
                </div>
                <SlideToggle
                  checked={settings.voting_enabled}
                  onChange={(v) => setSettings({ ...settings, voting_enabled: v })}
                  labelOn="Manual"
                  labelOff="Jadwal"
                />
              </div>
              <p className="text-xs text-text-muted mt-3">
                {settings.voting_enabled ? (
                  <>Toggle <strong>Aktif</strong>: Voting dikontrol manual (tombol di atas). Jadwal di bawah diabaikan.</>
                ) : (
                  <>Toggle <strong>Nonaktif</strong>: Voting dikontrol oleh jadwal di bawah. Pastikan Tanggal Buka dan Tutup sudah diatur.</>
                )}
              </p>
            </div>

            {/* Voting Schedule */}
            <div className={`card transition-opacity ${settings.voting_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Jadwal Voting</h3>
              <p className="text-xs text-text-muted mb-4">
                Jadwal hanya aktif saat Kontrol Voting Nonaktif. Jika Voting Aktif, jadwal diabaikan.
              </p>
              <div className="space-y-4">
                <DateTimeInput
                  label="Voting Dibuka"
                  value={settings.voting_open_at ?? null}
                  onChange={(val) => setSettings({ ...settings, voting_open_at: val || null })}
                  helpText="Kosongkan untuk tidak ada batas buka"
                />
                <DateTimeInput
                  label="Voting Ditutup"
                  value={settings.voting_close_at ?? null}
                  onChange={(val) => setSettings({ ...settings, voting_close_at: val || null })}
                  helpText="Kosongkan untuk tidak ada batas tutup otomatis"
                />
              </div>
            </div>

            {/* Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Status Voting Saat Ini</h3>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  currentStatus === 'open'
                    ? 'bg-primary animate-pulse'
                    : currentStatus === 'closed'
                    ? 'bg-error'
                    : 'bg-surface-light'
                }`} />
                <span className="text-text-secondary font-medium">
                  {currentStatus === 'open'
                    ? '🟢 Voting SEDANG DIBUKA'
                    : currentStatus === 'closed'
                    ? '🔴 Voting SEDANG DITUTUP'
                    : 'Status tidak diketahui'}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${settings.voting_enabled ? 'bg-primary' : 'bg-accent'}`} />
                  <span className="text-text-secondary text-sm">
                    Kontrol: {settings.voting_enabled ? '🖐️ Manual (toggle aktif)' : '⏰ Jadwal Otomatis (toggle nonaktif)'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${settings.voting_open_at ? 'bg-primary' : 'bg-surface-light'}`} />
                  <span className="text-text-secondary text-sm">
                    Jadwal Buka: {formatLocal(settings.voting_open_at) ?? 'Tidak diatur'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${settings.voting_close_at ? 'bg-error' : 'bg-surface-light'}`} />
                  <span className="text-text-secondary text-sm">
                    Jadwal Tutup: {formatLocal(settings.voting_close_at) ?? 'Tidak diatur'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-text-muted mt-3">
                Waktu ditampilkan dalam zona waktu lokal Anda (ID: WIB/WITA/WIT).
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className="bg-surface/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-surface-light/30 text-center">
                <p className="text-text-primary">{message}</p>
              </div>
            )}

            <button type="submit" disabled={isSaving} className="btn-base btn-primary w-full text-lg py-4">
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
