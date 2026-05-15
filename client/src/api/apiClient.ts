import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  // NOTE: Do NOT set a default Content-Type here.
  // Axios must auto-set multipart/form-data + boundary when sending FormData.
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
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
      // Handle unauthorized - could trigger logout
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
    }
    return Promise.reject(error);
  }
);

export default apiClient;