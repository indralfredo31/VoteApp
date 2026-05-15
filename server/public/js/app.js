/* ================================
   VOTING APP - MAIN APPLICATION
   ================================ */

// Application State
const appState = {
  currentUser: null,
  candidates: [],
  selectedCandidate: null,
  totalVoters: 0,
  currentVoters: 0
};

// API Helper
const API = {
  async login(nim, dob) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim, dob })
    });
    return response.json();
  },

  async logout() {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    return response.json();
  },

  async getCandidates() {
    const response = await fetch('/api/voting/candidates');
    return response.json();
  },

  async submitVote(candidateId) {
    const response = await fetch('/api/voting/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId })
    });
    return response.json();
  },

  async getResults() {
    const response = await fetch('/api/voting/results');
    return response.json();
  }
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
async function initApp() {
  showScreen('splash');

  try {
    // Load candidates from server
    const candidatesResponse = await API.getCandidates();
    if (candidatesResponse.success) {
      appState.candidates = candidatesResponse.data;
    }
  } catch (err) {
    console.log('Using local data');
  }

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
 * Show login error
 */
function showLoginError(message) {
  const loginError = document.getElementById('loginError');
  if (loginError) {
    loginError.textContent = message;
    loginError.classList.add('show');
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
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
  });
}

/**
 * Handle Login
 */
async function handleLogin() {
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

  const loginBtn = document.getElementById('loginBtn');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Memproses...';

  try {
    // Format DOB to DD-MM-YYYY for API
    const formattedDob = formatDate(dob);
    const response = await API.login(nim, formattedDob);

    if (response.success) {
      appState.currentUser = response.data;

      // Clear form
      document.getElementById('loginForm').reset();

      // Load candidates if not loaded
      if (appState.candidates.length === 0) {
        const candidatesResponse = await API.getCandidates();
        if (candidatesResponse.success) {
          appState.candidates = candidatesResponse.data;
        }
      }

      // Show voting screen
      setTimeout(() => {
        showScreen('voting');
        attachVotingHandlers();
        updateVotingUI();
      }, 300);
    } else {
      showLoginError(response.message || 'Login gagal');
    }
  } catch (error) {
    console.error('Login error:', error);
    showLoginError('Terjadi kesalahan. Silakan coba lagi.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Masuk';
  }
}

/**
 * Update Voting UI
 */
async function updateVotingUI() {
  const user = appState.currentUser;
  document.getElementById('userGreeting').textContent = `Halo, ${user.nama}`;

  // Get candidate name if already voted
  let votedForName = null;
  if (user.hasVoted && user.votedFor) {
    const candidate = appState.candidates.find(c => c.id === user.votedFor);
    votedForName = candidate ? candidate.nama : null;
  }

  const statusText = user.hasVoted && votedForName
    ? `Anda sudah memilih ${votedForName}`
    : 'Belum memilih';
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

  if (appState.candidates.length === 0) {
    candidatesList.innerHTML = '<p class="text-center text-error">Belum ada kandidat</p>';
    return;
  }

  appState.candidates.forEach(candidate => {
    const card = document.createElement('div');
    card.className = 'candidate-card';
    card.innerHTML = `
      <div class="candidate-number">${candidate.nomor_urut}</div>
      <div class="candidate-name">${candidate.nama}</div>
      <div class="candidate-prodi">${candidate.prodi || ''}</div>
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
    <div class="confirm-number">${candidate.nomor_urut}</div>
    <div class="confirm-name">${candidate.nama}</div>
    <div class="confirm-prodi">${candidate.prodi || ''}</div>
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

  submitVoteBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await submitVote();
  });
}

/**
 * Submit Vote
 */
async function submitVote() {
  const candidate = appState.selectedCandidate;
  const submitVoteBtn = document.getElementById('submitVoteBtn');

  submitVoteBtn.disabled = true;
  submitVoteBtn.textContent = 'Memproses...';

  try {
    const response = await API.submitVote(candidate.id);

    if (response.success) {
      // Update local state
      appState.currentUser.hasVoted = true;
      appState.currentUser.votedFor = candidate.id;

      // Update candidate vote count
      const localCandidate = appState.candidates.find(c => c.id === candidate.id);
      if (localCandidate) {
        localCandidate.vote_count = (localCandidate.vote_count || 0) + 1;
      }

      // Show success screen
      showScreen('success');
      renderSuccess();
      attachSuccessHandlers();
    } else {
      alert(response.message || 'Gagal mengirim vote');
      submitVoteBtn.disabled = false;
      submitVoteBtn.textContent = 'Konfirmasi Pilihan';
    }
  } catch (error) {
    console.error('Submit vote error:', error);
    alert('Terjadi kesalahan. Silakan coba lagi.');
    submitVoteBtn.disabled = false;
    submitVoteBtn.textContent = 'Konfirmasi Pilihan';
  }
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
      <span class="success-detail-value">${candidate.nama}</span>
    </div>
  `;
}

/**
 * Attach Success Screen Handlers
 */
function attachSuccessHandlers() {
  const viewResultsBtn = document.getElementById('viewResultsBtn');
  const logoutBtn2 = document.getElementById('logoutBtn2');

  viewResultsBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    showScreen('results');
    await renderResults();
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
async function renderResults() {
  try {
    const response = await API.getResults();

    if (response.success) {
      const { results, totalVotes, totalVoters, participationRate } = response.data;

      // Render stats
      const resultStats = document.getElementById('resultStats');
      resultStats.innerHTML = `
        <div class="results-stat-item">
          Total suara: <span class="results-stat-value">${totalVotes}</span> |
          Total pemilih: <span class="results-stat-value">${totalVoters}</span> |
          Partisipasi: <span class="results-stat-value">${participationRate}%</span>
        </div>
      `;

      // Render results
      const resultsList = document.getElementById('resultsList');
      resultsList.innerHTML = '';

      results.forEach(candidate => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card fade-in';
        resultCard.innerHTML = `
          <div class="result-header">
            <div class="result-info">
              <h3>${candidate.nomor_urut}. ${candidate.nama}</h3>
              <p>${candidate.prodi || ''}</p>
            </div>
            <div>
              <div class="result-votes">${candidate.vote_count}</div>
              <div class="result-percentage">${candidate.percentage}%</div>
            </div>
          </div>
          <div class="result-bar">
            <div class="result-bar-fill" style="width: ${candidate.percentage}%"></div>
          </div>
        `;

        resultsList.appendChild(resultCard);
      });
    }
  } catch (error) {
    console.error('Get results error:', error);
  }
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
async function logout() {
  try {
    await API.logout();
  } catch (err) {
    console.log('Logout request failed, clearing anyway');
  }

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
  if (logoutBtn1) {
    logoutBtn1.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
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