import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Navbar from '../../components/layout/Navbar';
import { useAuthStore } from '../../store/authStore';

export default function Success() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const checkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Checkmark scale animation
      gsap.fromTo(
        checkRef.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'back.out(1.7)',
          delay: 0.3,
        }
      );

      // Content fade in
      gsap.from('.success-content', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.6,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, []);

  const now = new Date();
  const time = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <Navbar />
      <div className="text-center max-w-md w-full">
        {/* Animated Checkmark */}
        <div
          ref={checkRef}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary flex items-center justify-center"
        >
          <span className="text-white text-4xl font-bold">✓</span>
        </div>

        {/* Content */}
        <div className="success-content space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight">
            Suara Anda<br />
            <span className="text-primary">Tercatat!</span>
          </h1>

          <p className="text-text-secondary text-lg">
            Terima kasih telah berpartisipasi dalam pemilihan ketua senat kampus.
          </p>

          <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-6 border border-surface-light/30">
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-text-muted text-sm">Waktu Memilih</span>
                <span className="text-text-primary font-semibold">{time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted text-sm">Pemilih</span>
                <span className="text-text-primary font-semibold">{user?.nama}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={() => navigate('/results')}
              className="btn-base btn-primary w-full text-lg py-4"
            >
              Lihat Hasil Sementara
            </button>
            <button
              onClick={() => navigate('/vote')}
              className="btn-base btn-secondary w-full"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}