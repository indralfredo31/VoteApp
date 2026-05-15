import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const [nim, setNim] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Animate in on mount
    const ctx = gsap.context(() => {
      gsap.from('.login-animate', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.3,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleNimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setNim(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nim) {
      setError('NIM tidak boleh kosong');
      return;
    }

    if (nim.length !== 9) {
      setError('NIM harus 9 digit');
      return;
    }

    if (!dob) {
      setError('Tanggal lahir tidak boleh kosong');
      return;
    }

    setIsLoading(true);

    try {
      // Format DDMMYYYY to DD-MM-YYYY directly (without Date parsing)
      if (dob.length !== 8 || !/^\d{8}$/.test(dob)) {
        setError('Format tanggal lahir harus 8 digit (DDMMYYYY)');
        setIsLoading(false);
        return;
      }

      const day = dob.slice(0, 2);
      const month = dob.slice(2, 4);
      const year = dob.slice(4, 8);
      const formattedDob = `${day}-${month}-${year}`;

      const response = await authApi.login({ nim, dob: formattedDob });

      if (response.success && response.data) {
        setUser(response.data);

        // Animate out
        gsap.to(containerRef.current, {
          y: -30,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => {
            navigate('/vote');
          },
        });
      } else {
        // Shake animation on error
        gsap.to(formRef.current, {
          x: [-10, 10, -8, 8, -5, 5, -2, 2, 0] as any,
          duration: 0.4,
          ease: 'power2.out',
        });
        setError(response.message || 'Login gagal');
      }
    } catch (err: unknown) {
      gsap.to(formRef.current, {
        x: [-10, 10, -8, 8, -5, 5, -2, 2, 0] as any,
        duration: 0.4,
        ease: 'power2.out',
      });
      setError('NIM atau tanggal lahir salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center px-4 py-20"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12 login-animate">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-3xl">🗳️</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary mb-3 tracking-tight">
            VoteApp
          </h1>
          <p className="text-text-secondary text-lg">
            Pemilihan Ketua Senat Kampus
          </p>
        </div>

        {/* Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-surface/50 backdrop-blur-sm rounded-2xl p-8 border border-surface-light/30 login-animate"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                NIM
              </label>
              <input
                type="text"
                value={nim}
                onChange={handleNimChange}
                placeholder="123456789"
                className="input-base text-center text-xl tracking-widest font-mono"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                Tanggal Lahir (DDMMYYYY)
              </label>
              <input
                type="password"
                value={dob}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setDob(val);
                  setError('');
                }}
                placeholder="11082024"
                className="input-base text-center text-xl tracking-widest font-mono"
                maxLength={8}
                disabled={isLoading}
                autoComplete="off"
              />
              <p className="text-xs text-text-muted mt-1 text-center">
                Contoh: 15 Januari 2003 → ketik <strong>15012003</strong>
              </p>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error rounded-xl px-4 py-3 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-base btn-primary w-full text-lg py-4"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </button>

            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-center">
              <p className="text-primary-light text-sm">
                💡 Password Anda adalah tanggal lahir
              </p>
            </div>
          </div>
        </form>

        {/* Admin link */}
        <div className="text-center mt-6 login-animate">
          <Link
            to="/admin/login"
            className="text-text-muted hover:text-text-secondary text-sm transition-colors"
          >
            Halaman Admin →
          </Link>
        </div>
      </div>
    </div>
  );
}