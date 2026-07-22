import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginRegister from './pages/LoginRegister';
import DashboardLayout from './pages/DashboardLayout';
import Beranda from './pages/Beranda';
import Inventaris from './pages/Inventaris';
import Riwayat from './pages/Riwayat';
import Profil from './pages/Profil';
import Scan from './pages/Scan';
import UserManagement from './pages/UserManagement';
import './App.css';

// Membungkus route yang WAJIB login. Jika belum login, lempar ke /login.
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Membungkus route khusus admin. Jika belum login -> /login,
// jika login tapi bukan admin (termasuk setelah role diturunkan) -> /.
function AdminRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// Membungkus route login. Jika sudah login, lempar ke halaman utama.
function PublicRoute({ user, children }) {
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    return token && savedUser ? JSON.parse(savedUser) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token) {
      localStorage.removeItem('user');
      setUser(null);
      return;
    }

    if (!savedUser) {
      setUser(null);
      return;
    }

    const validateSession = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Session tidak valid');
        }

        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    };

    validateSession();
  }, []);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate('/', { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  const handleUpdateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <Routes>
      {/* ===== HALAMAN LOGIN / REGISTER ===== */}
      <Route
        path="/login"
        element={
          <PublicRoute user={user}>
            <LoginRegister onLoginSuccess={handleLoginSuccess} />
          </PublicRoute>
        }
      />

      {/* ===== SCAN (fullscreen, tanpa bottom nav) ===== */}
      <Route
        path="/scan"
        element={
          <ProtectedRoute user={user}>
            <Scan user={user} />
          </ProtectedRoute>
        }
      />

      {/* ===== LAYOUT UTAMA (dengan bottom nav) ===== */}
      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <DashboardLayout user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >

        <Route
        path="usermanagement"
        element={
            <AdminRoute user={user}>
            <UserManagement currentUser={user} />
          </AdminRoute>
          }
        />
        <Route index element={<Beranda user={user} />} />
        <Route path="inventaris" element={<Inventaris user={user} />} />
        <Route path="riwayat" element={<Riwayat user={user} />} />
        <Route path="profil" element={<Profil user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />} />
      </Route>

      {/* ===== FALLBACK ===== */}
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}


export default App;