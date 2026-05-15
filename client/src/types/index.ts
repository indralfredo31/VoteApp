// User Types
export interface User {
  id: string; // Firestore document ID
  nim: string;
  nama: string;
  prodi: string;
  hasVoted: boolean;
  votedFor: string | null;
}

// Candidate (Paslon) Types
export interface Candidate {
  id: string; // Firestore document ID
  nomor_urut: number;
  nama_ketua: string;
  prodi_ketua: string;
  foto_ketua: string | null;
  nama_wakil: string;
  prodi_wakil: string;
  foto_wakil: string | null;
  visi: string;
  misi: string;
  vote_count: number;
  created_at: string;
}

// Voting Result Types
export interface VotingResult {
  id: string; // Firestore document ID
  nomor_urut: number;
  nama_ketua: string;
  nama_wakil: string;
  vote_count: number;
  percentage: number;
}

export interface VotingStats {
  results: VotingResult[];
  totalVotes: number;
  totalVoters: number;
  participationRate: number;
}

// Settings Types
export interface VotingSettings {
  voting_enabled: boolean;
  voting_open_at: string | null;
  voting_close_at: string | null;
  app_title: string;
  app_subtitle: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Login Types
export interface LoginRequest {
  nim: string;
  dob: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

// Vote Types
export interface VoteRequest {
  candidateId: string;
  userId: string;
}

// Candidate Form Types
export interface CandidateFormData {
  nomor_urut: number;
  nama_ketua: string;
  prodi_ketua: string;
  nama_wakil: string;
  prodi_wakil: string;
  visi: string;
  misi: string;
  foto_ketua?: File;
  foto_wakil?: File;
}

// Admin Voters Response
export interface VoterRecord {
  id: string;
  nim: string;
  nama: string;
  prodi: string;
  hasVoted: boolean;
}