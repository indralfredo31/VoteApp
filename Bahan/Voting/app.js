/* ================================
   VOTING APP - MAIN APPLICATION
   ================================ */

// Application State
const appState = {
  currentUser: null,
  candidates: [
    {
      id: 1,
      number: 1,
      name: 'Rini Puspita',
      prodi: 'S1 Informatika',
      visi: 'Meningkatkan kualitas akademik',
      misi: 'Memperkuat hubungan antar mahasiswa',
      votes: 245
    },
    {
      id: 2,
      number: 2,
      name: 'Ahmad Pratama',
      prodi: 'S1 Teknik Sipil',
      visi: 'Kampus yang lebih baik',
      misi: 'Program-program inovatif',
      votes: 192
    },
    {
      id: 3,
      number: 3,
      name: 'Siti Nurhaliza',
      prodi: 'S1 Bisnis',
      visi: 'Kesejahteraan mahasiswa',
      misi: 'Dukungan untuk semua program',
      votes: 105
    }
  ],
  selectedCandidate: null,
  totalVoters: 800,
  currentVoters: 542
};

// Screen Management
const screens = {
  splash: document.getElementById('splash'),
  login: document.getElementById('login'),
  voting: document.getElementById('voting'),
  confirm: document.getElementById('confirm'),
  success: document.getElementById('success'),
  results: document.getElementById('results')
};

/**
 * Show specific screen and hide others
 */
function showScreen(screenName) {
  Object.keys(screens).forEach(key => {
    if (key === screenName) {
      screens[key].classList.remove('hidden');
      screens[key].style.zIndex = 10;
    } else {
      screens[key].classList.add('hidden');
      screens[key].style.zIndex = 1;
    }
  });
}

/**
 * Initialize Application
 */
function initApp() {
  // Show splash screen first
  showScreen('splash');

  // After 2 seconds, redirect to login
  setTimeout(() => {
    showScreen('login');
    attachLoginHandlers();
  }, 2000);
}

/**
 * Format date to DD-MM-YYYY
 */
function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Validate NIM format (9 digits)
 */
function validateNIM(nim) {
  return /^\d{9}$/.test(nim);
}

/**
 * Clear error messages
 */
function clearErrors() {
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });

  const loginError = document.getElementById('loginError');
  if (loginError) {
    loginError.textContent = '';
    loginError.classList.remove('show');
  }
}

/**
 * Show error message
 */
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.classList.add('show');
  }
}

/**
 * Attach Login Screen Handlers
 */
function attachLoginHandlers() {
  const loginForm = document.getElementById('loginForm');
  const nimInput = document.getElementById('nim');
  const dobInput = document.getElementById('dob');

  // Input validation
  nimInput.addEventListener('input', (e) => {
    clearErrors();
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
  });

  dobInput.addEventListener('change', clearErrors);

  // Form submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin();
  });
}

/**
 * Handle Login
 */
function handleLogin() {
  const nim = document.getElementById('nim').value.trim();
  const dob = document.getElementById('dob').value;

  clearErrors();

  // Validation
  if (!nim) {
    showError('nimError', 'NIM tidak boleh kosong');
    return;
  }

  if (!validateNIM(nim)) {
    showError('nimError', 'NIM harus 9 digit angka');
    return;
  }

  if (!dob) {
    showError('dobError', 'Tanggal lahir tidak boleh kosong');
    return;
  }

  // Simulate authentication (in real app, this would call API)
  const user = {
    nim: nim,
    dob: dob,
    name: 'Budi Santoso',
    hasVoted: false,
    votedFor: null
  };

  // Check if user has already voted (in real app, check from database)
  // For demo, we'll always allow voting
  user.hasVoted = false;

  appState.currentUser = user;

  // Clear form
  document.getElementById('loginForm').reset();

  // Show voting screen
  setTimeout(() => {
    showScreen('voting');
    attachVotingHandlers();
    updateVotingUI();
  }, 300);
}

/**
 * Update Voting UI
 */
function updateVotingUI() {
  const user = appState.currentUser;
  document.getElementById('userGreeting').textContent = `Halo, ${user.name}`;

  const statusText = user.hasVoted ? 
    `Anda sudah memilih ${user.votedFor}` : 
    'Belum memilih';
  document.getElementById('votingStatus').textContent = statusText;

  // Render candidates
  renderCandidates();
}

/**
 * Render Candidates List
 */
function renderCandidates() {
  const candidatesList = document.getElementById('candidatesList');
  candidatesList.innerHTML = '';

  appState.candidates.forEach(candidate => {
    const card = document.createElement('div');
    card.className = 'candidate-card';
    card.innerHTML = `
      <div class="candidate-number">${candidate.number}</div>
      <div class="candidate-name">${candidate.name}</div>
      <div class="candidate-prodi">${candidate.prodi}</div>
      <button class="candidate-select-btn" data-id="${candidate.id}">
        Pilih Kandidat
      </button>
    `;

    card.querySelector('.candidate-select-btn').addEventListener('click', (e) => {
      e.preventDefault();
      selectCandidate(candidate.id);
    });

    candidatesList.appendChild(card);
  });
}

/**
 * Select Candidate
 */
function selectCandidate(candidateId) {
  const candidate = appState.candidates.find(c => c.id === candidateId);
  appState.selectedCandidate = candidate;

  // Show confirmation screen
  showScreen('confirm');
  renderConfirmation();
  attachConfirmHandlers();
}

/**
 * Render Confirmation Screen
 */
function renderConfirmation() {
  const candidate = appState.selectedCandidate;
  const confirmCard = document.getElementById('confirmCard');

  confirmCard.innerHTML = `
    <div class="confirm-number">${candidate.number}</div>
    <div class="confirm-name">${candidate.name}</div>
    <div class="confirm-prodi">${candidate.prodi}</div>
  `;
}

/**
 * Attach Confirmation Screen Handlers
 */
function attachConfirmHandlers() {
  const cancelBtn = document.getElementById('cancelBtn');
  const submitVoteBtn = document.getElementById('submitVoteBtn');

  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    appState.selectedCandidate = null;
    showScreen('voting');
  });

  submitVoteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitVote();
  });
}

/**
 * Submit Vote
 */
function submitVote() {
  const candidate = appState.selectedCandidate;
  const user = appState.currentUser;

  // In real app, send to backend API
  // API.submitVote(user.nim, candidate.id)

  // Update local state
  user.hasVoted = true;
  user.votedFor = candidate.name;
  candidate.votes += 1;
  appState.currentVoters += 1;

  // Simulate network delay
  setTimeout(() => {
    showScreen('success');
    renderSuccess();
    attachSuccessHandlers();
  }, 300);
}

/**
 * Render Success Screen
 */
function renderSuccess() {
  const candidate = appState.selectedCandidate;
  const successDetails = document.getElementById('successDetails');

  const now = new Date();
  const time = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  successDetails.innerHTML = `
    <div class="success-detail-item">
      <span class="success-detail-label">Waktu Memilih:</span>
      <span class="success-detail-value">${time}</span>
    </div>
    <div class="success-detail-item">
      <span class="success-detail-label">Kandidat Terpilih:</span>
      <span class="success-detail-value">${candidate.name}</span>
    </div>
  `;
}

/**
 * Attach Success Screen Handlers
 */
function attachSuccessHandlers() {
  const viewResultsBtn = document.getElementById('viewResultsBtn');
  const logoutBtn2 = document.getElementById('logoutBtn2');

  viewResultsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('results');
    renderResults();
    attachResultsHandlers();
  });

  logoutBtn2.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

/**
 * Render Results Screen
 */
function renderResults() {
  // Render stats
  const resultStats = document.getElementById('resultStats');
  const totalVoters = appState.totalVoters;
  const currentVoters = appState.currentVoters;

  resultStats.innerHTML = `
    <div class="results-stats">
      <div class="results-stat-item">
        Total pemilih: <span class="results-stat-value">${currentVoters} / ${totalVoters}</span> peserta
      </div>
    </div>
  `;

  // Calculate total votes for percentage
  const totalVotes = appState.candidates.reduce((sum, c) => sum + c.votes, 0);

  // Render results
  const resultsList = document.getElementById('resultsList');
  resultsList.innerHTML = '';

  appState.candidates.forEach(candidate => {
    const percentage = totalVotes > 0 ? 
      Math.round((candidate.votes / totalVotes) * 100) : 0;

    const resultCard = document.createElement('div');
    resultCard.className = 'result-card fade-in';
    resultCard.innerHTML = `
      <div class="result-header">
        <div class="result-info">
          <h3>${candidate.number}. ${candidate.name}</h3>
          <p>${candidate.prodi}</p>
        </div>
        <div>
          <div class="result-votes">${candidate.votes}</div>
          <div class="result-percentage">${percentage}%</div>
        </div>
      </div>
      <div class="result-bar">
        <div class="result-bar-fill" style="width: ${percentage}%"></div>
      </div>
    `;

    resultsList.appendChild(resultCard);
  });
}

/**
 * Attach Results Screen Handlers
 */
function attachResultsHandlers() {
  const backBtn = document.getElementById('backToVotingBtn');
  const logoutBtn3 = document.getElementById('logoutBtn3');

  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('success');
  });

  logoutBtn3.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

/**
 * Logout
 */
function logout() {
  appState.currentUser = null;
  appState.selectedCandidate = null;

  // Clear forms
  document.getElementById('loginForm').reset();
  clearErrors();

  // Return to login
  showScreen('login');
  attachLoginHandlers();
}

/**
 * Attach Logout Buttons
 */
function attachLogoutButtons() {
  const logoutBtn1 = document.getElementById('logoutBtn1');
  logoutBtn1.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  attachLogoutButtons();
});

// Prevent zooming on input focus (iOS specific)
document.addEventListener('touchmove', (e) => {
  if (e.target.tagName === 'INPUT') {
    return;
  }
}, { passive: true });
