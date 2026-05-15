import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setAdmin, setToken } = useAuthStore();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Redirect to dashboard if already logged in
    const stored = localStorage.getItem('voteapp-auth');
    if (stored) {
      try {
        const auth = JSON.parse(stored);
        if (auth.state?.isAdmin && auth.state?.token) {
          navigate('/admin');
        }
      } catch (e) {
        // ignore
      }
    }
    const ctx = gsap.context(() => {
      gsap.from('.admin-animate', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.3,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username dan password harus diisi');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.adminLogin({ username, password });

      if (response.success) {
        // Store JWT token for API requests
        if (response.data?.token) {
          setToken(response.data.token);
          setAdmin(true);
          setUser(null); // Admin doesn't need user data
        }
        gsap.to(containerRef.current, {
          y: -30,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => navigate('/admin'),
        });
      } else {
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
      setError('Username atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-12 admin-animate">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-3xl">⚙️</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary mb-3 tracking-tight">
            Admin Panel
          </h1>
          <p className="text-text-secondary text-lg">
            Kelola Pemilihan Ketua Senat
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-surface/50 backdrop-blur-sm rounded-2xl p-8 border border-surface-light/30 admin-animate"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="admin"
                className="input-base"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="input-base"
                disabled={isLoading}
              />
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
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6 admin-animate">
          <a href="/login" className="text-text-muted hover:text-text-secondary text-sm transition-colors">
            ← Halaman User
          </a>
        </div>
      </div>
    </div>
  );
}