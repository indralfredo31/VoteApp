import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../../components/layout/Navbar';
import ProgressBar from '../../components/animations/ProgressBar';
import StaggerReveal from '../../components/animations/StaggerReveal';
import { votingApi } from '../../api/votingApi';
import type { VotingStats } from '../../types';

gsap.registerPlugin(ScrollTrigger);

export default function Results() {
  const [stats, setStats] = useState<VotingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    loadResults();
  }, []);

  // Count up animation for total votes
  useEffect(() => {
    if (!statsRef.current || !stats) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Animate stat numbers on scroll
      gsap.from('.stat-animate', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Gagal memuat hasil voting</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12" ref={statsRef}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary mb-3 tracking-tight">
              Hasil <span className="text-primary">Voting</span>
            </h1>
            <p className="text-text-secondary text-lg">
              Perolehan suara sementara
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="stat-animate card text-center">
              <p className="text-text-muted text-sm uppercase tracking-wider mb-2">
                Total Suara
              </p>
              <p className="text-4xl font-extrabold text-primary">
                {stats.totalVotes}
              </p>
            </div>

            <div className="stat-animate card text-center">
              <p className="text-text-muted text-sm uppercase tracking-wider mb-2">
                Partisipasi
              </p>
              <p className="text-4xl font-extrabold text-accent">
                {stats.participationRate}%
              </p>
            </div>

            <div className="stat-animate card text-center">
              <p className="text-text-muted text-sm uppercase tracking-wider mb-2">
                Total Pemilih
              </p>
              <p className="text-4xl font-extrabold text-text-primary">
                {stats.totalVoters}
              </p>
            </div>
          </div>

          {/* Results List */}
          <StaggerReveal
            className="space-y-4"
            selector=".result-item"
            stagger={0.1}
            threshold={0.8}
          >
            {stats.results.map((result, index) => (
              <div
                key={result.id}
                className="result-item card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg ${
                        index === 0
                          ? 'bg-primary text-white'
                          : 'bg-surface-light text-text-secondary'
                      }`}
                    >
                      {String(result.nomor_urut).padStart(2, '0')}
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">
                        {result.nama_ketua} & {result.nama_wakil}
                      </p>
                      <p className="text-sm text-text-muted">
                        Suara: {result.vote_count}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-primary">
                      {result.percentage}%
                    </p>
                  </div>
                </div>

                <ProgressBar value={result.percentage} />

                {index === 0 && stats.results.length > 1 && (
                  <div className="mt-3 flex items-center gap-2 text-primary text-sm">
                    <span>🏆</span>
                    <span>Perolehan suara tertinggi</span>
                  </div>
                )}
              </div>
            ))}
          </StaggerReveal>

          {/* Info */}
          <div className="mt-8 text-center text-text-muted text-sm">
            <p>Hasil update secara real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}