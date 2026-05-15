import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (isAdmin) {
        await authApi.adminLogout();
      } else {
        await authApi.logout();
      }
    } catch (e) {
      // Continue even if API fails
    }
    logout();
    navigate(isAdmin ? '/admin/login' : '/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-surface-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to={isAdmin ? '/admin' : '/vote'}
            className="text-xl font-bold text-text-primary hover:text-primary-light transition-colors"
          >
            {isAdmin ? 'Admin Panel' : 'VoteApp'}
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && !isAdmin && (
              <span className="text-text-secondary text-sm hidden sm:block">
                {user?.nama}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}