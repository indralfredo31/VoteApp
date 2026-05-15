import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: false, // Using JWT Bearer tokens instead of session cookies
  // NOTE: Do NOT set a default Content-Type here.
  // Axios must auto-set multipart/form-data + boundary when sending FormData.
});

// Request interceptor — inject JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    try {
      // Read token from Zustand persisted localStorage
      const stored = localStorage.getItem('voteapp-auth');
      if (stored) {
        const auth = JSON.parse(stored);
        if (auth.state?.token) {
          config.headers.Authorization = `Bearer ${auth.state.token}`;
        }
      }
    } catch (e) {
      // Ignore errors reading token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on 401 — user must re-login
      localStorage.removeItem('voteapp-auth');
    }
    return Promise.reject(error);
  }
);

export default apiClient;