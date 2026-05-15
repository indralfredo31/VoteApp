import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../../components/layout/Navbar';
import StaggerReveal from '../../components/animations/StaggerReveal';
import { votingApi } from '../../api/votingApi';
import { useAuthStore } from '../../store/authStore';
import { useVotingStore } from '../../store/votingStore';
import type { Candidate } from '../../types';

gsap.registerPlugin(ScrollTrigger);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { candidates, setCandidates, setSelectedCandidate, selectedCandidate } = useVotingStore();
  const [isLoading, setIsLoading] = useState(true);
  const [votingOpen, setVotingOpen] = useState(true);
  const [confirmModal, setConfirmModal] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load candidates
    const loadCandidates = async () => {
      try {
        const [candidatesRes, statusRes] = await Promise.all([
          votingApi.getCandidates(),
          votingApi.getStatus().catch(() => null),
        ]);

        if (candidatesRes.success && candidatesRes.data) {
          setCandidates(candidatesRes.data);
        }

        if (statusRes?.data) {
          setVotingOpen(statusRes.data.isOpen);
        }
      } catch (err) {
        console.error('Failed to load candidates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();

    // Check if already voted
    if (user?.hasVoted) {
      navigate('/results');
    }
  }, [setCandidates, user, navigate]);

  useEffect(() => {
    // Hero section scroll animation
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Pin hero while scrolling
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: '+=100%',
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      });

      // Hero content fade out on scroll
      gsap.to('.hero-content', {
        y: -50,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'center top',
          scrub: 1,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setConfirmModal(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;

    try {
      const response = await votingApi.submitVote({
        candidateId: selectedCandidate.id,
        userId: user?.id || '', // Send Firestore doc id for auth
      });

      if (response.success) {
        // Immediately fetch latest results to update vote counts on results page
        try {
          const resultsRes = await votingApi.getResults();
          if (resultsRes.success && resultsRes.data) {
            useVotingStore.getState().setResults(resultsRes.data);
          }
        } catch (_) {}
        navigate('/success');
      } else {
        alert(response.message || 'Gagal mengirim vote');
      }
    } catch (err) {
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="h-screen flex items-center justify-center relative overflow-hidden"
      >
        <div className="hero-content text-center px-4">
          <p className="text-accent font-semibold uppercase tracking-[0.3em] text-sm mb-4 opacity-80">
            {user?.prodi || 'Mahasiswa'}
          </p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold text-text-primary tracking-tight mb-6">
            Pilihlah<br />
            <span className="text-primary">Pemimpin</span>
          </h1>
          <p className="text-text-secondary text-lg sm:text-xl max-w-xl mx-auto mb-8">
            Scroll ke bawah untuk melihat pasangan calon ketua dan wakil ketua senat
          </p>
          <div className="animate-bounce">
            <span className="text-text-muted text-2xl">↓</span>
          </div>
        </div>
      </section>

      {/* Candidates Section */}
      <section ref={sectionRef} className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
              Pasangan Calon
            </h2>
            <p className="text-text-secondary">
              {votingOpen ? 'Pilih salah satu pasangan calon' : 'Voting sedang ditutup'}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-20 text-text-secondary">
              <p className="text-xl">Belum ada pasangan calon</p>
            </div>
          ) : (
            <StaggerReveal
              className="candidate-grid"
              selector=".stagger-item"
              stagger={0.15}
              threshold={0.8}
            >
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="stagger-item card group hover:border-primary/50 transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <span className="text-2xl font-extrabold text-primary">
                          {String(candidate.nomor_urut).padStart(2, '0')}
                        </span>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs uppercase tracking-wider">
                          Nomor Urut
                        </p>
                        <p className="text-text-secondary text-sm">
                          {candidate.vote_count} suara
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Photos */}
                  <div className="flex justify-center gap-6 mb-6">
                    <div className="text-center">
                      <div className="photo-circle w-24 h-24 mb-2 group-hover:border-primary transition-colors">
                        {candidate.foto_ketua ? (
                          <img src={candidate.foto_ketua} alt={candidate.nama_ketua} />
                        ) : (
                          <div className="w-full h-full bg-surface-light flex items-center justify-center text-3xl">
                            👤
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-text-primary">
                        {candidate.nama_ketua}
                      </p>
                      <p className="text-xs text-text-muted">
                        {candidate.prodi_ketua}
                      </p>
                    </div>

                    <div className="flex items-center text-text-muted text-2xl font-light self-center">
                      &
                    </div>

                    <div className="text-center">
                      <div className="photo-circle w-24 h-24 mb-2 group-hover:border-primary transition-colors">
                        {candidate.foto_wakil ? (
                          <img src={candidate.foto_wakil} alt={candidate.nama_wakil} />
                        ) : (
                          <div className="w-full h-full bg-surface-light flex items-center justify-center text-3xl">
                            👤
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-text-primary">
                        {candidate.nama_wakil}
                      </p>
                      <p className="text-xs text-text-muted">
                        {candidate.prodi_wakil}
                      </p>
                    </div>
                  </div>

                  {/* Visi Misi */}
                  <details className="mb-6">
                    <summary className="cursor-pointer text-sm text-text-secondary hover:text-primary transition-colors">
                      Visi & Misi
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                          Visi
                        </p>
                        <p className="text-sm text-text-secondary">
                          {candidate.visi}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                          Misi
                        </p>
                        <p className="text-sm text-text-secondary whitespace-pre-line">
                          {candidate.misi}
                        </p>
                      </div>
                    </div>
                  </details>

                  {/* Vote Button */}
                  <button
                    onClick={() => handleSelectCandidate(candidate)}
                    disabled={!votingOpen}
                    className="btn-base btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {votingOpen ? 'Pilih' : 'Voting Ditutup'}
                  </button>
                </div>
              ))}
            </StaggerReveal>
          )}
        </div>
      </section>

      {/* Confirmation Modal */}
      {confirmModal && selectedCandidate && (
        <div className="modal-overlay" onClick={() => setConfirmModal(false)}>
          <div
            className="bg-surface rounded-2xl p-8 max-w-md w-full border border-surface-light/30 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-text-primary mb-4 text-center">
              Konfirmasi Pilihan
            </h3>

            <div className="bg-surface-light/30 rounded-xl p-6 mb-6">
              <p className="text-center text-text-secondary mb-4">
                Anda memilih:
              </p>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-xl font-extrabold text-primary">
                    {String(selectedCandidate.nomor_urut).padStart(2, '0')}
                  </span>
                </div>
                <p className="font-bold text-text-primary">
                  {selectedCandidate.nama_ketua} & {selectedCandidate.nama_wakil}
                </p>
              </div>
            </div>

            <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 mb-6 text-center">
              <p className="text-error text-sm">
                ⚠️ Pilihan tidak dapat diubah setelah dikonfirmasi
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="btn-base btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmVote}
                className="btn-base btn-primary flex-1"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}