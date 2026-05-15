import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { initLenis, destroyLenis } from './lib/lenis';

// Pages - User
import Login from './pages/user/Login';
import Dashboard from './pages/user/Dashboard';
import Success from './pages/user/Success';
import Results from './pages/user/Results';

// Pages - Admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCandidates from './pages/admin/AdminCandidates';
import AdminSettings from './pages/admin/AdminSettings';
import AdminExport from './pages/admin/AdminExport';
import AdminVoters from './pages/admin/AdminVoters';

// Components
import MeshBackground from './components/animations/MeshBackground';
import Layout from './components/layout/Layout';

function App() {
  const { isAuthenticated, isAdmin } = useAuthStore();

  useEffect(() => {
    initLenis();
    return () => destroyLenis();
  }, []);

  return (
    <>
      <MeshBackground />
      <div className="grain-overlay" />
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* User routes */}
            <Route
              path="/vote"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/success"
              element={isAuthenticated ? <Success /> : <Navigate to="/login" />}
            />
            <Route
              path="/results"
              element={isAuthenticated ? <Results /> : <Navigate to="/login" />}
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" />}
            />
            <Route
              path="/admin/candidates"
              element={isAdmin ? <AdminCandidates /> : <Navigate to="/admin/login" />}
            />
            <Route
              path="/admin/settings"
              element={isAdmin ? <AdminSettings /> : <Navigate to="/admin/login" />}
            />
            <Route
              path="/admin/export"
              element={isAdmin ? <AdminExport /> : <Navigate to="/admin/login" />}
            />
            <Route
              path="/admin/voters"
              element={isAdmin ? <AdminVoters /> : <Navigate to="/admin/login" />}
            />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route
              path="*"
              element={<Navigate to="/login" />}
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;