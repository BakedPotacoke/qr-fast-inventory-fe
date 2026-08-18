import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import BottomNavigation from './components/BottomNavigation'; // Eager — layout tetap, selalu dibutuhkan user login
import { ImageViewerProvider } from './components/ImageViewer';
import { showConfirm, showToast } from './utils/alert';
import './App.css';

// Auth — dimuat hanya untuk user yang belum login
const LoginRegister = lazy(() => import('./pages/LoginRegister'));

// User pages — dimuat saat user login sebagai non-admin
const Beranda    = lazy(() => import('./pages/Beranda'));
const Inventaris = lazy(() => import('./pages/Inventaris'));
const Riwayat    = lazy(() => import('./pages/Riwayat'));
const Profil     = lazy(() => import('./pages/Profil'));
// Scan juga membawa html5-qrcode (~300KB); chunk-nya tidak akan diunduh
// sebelum user membuka halaman /scan.
const Scan       = lazy(() => import('./pages/Scan'));
const FAQ        = lazy(() => import('./pages/Faq'));

// Admin area — seluruh bagian admin (termasuk AdminLayout, Sidebar, Topbar)
// hanya diunduh oleh user dengan role 'admin'.
const AdminLayout         = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard      = lazy(() => import('./pages/admin/Dashboard'));
const AdminInventaris     = lazy(() => import('./pages/admin/Inventaris'));
const AdminTransaksi      = lazy(() => import('./pages/admin/Transaksi'));
const AdminLaporan        = lazy(() => import('./pages/admin/Laporan'));
const AdminUserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminFaq            = lazy(() => import('./pages/admin/Adminfaq'));



// =============================================================================
// ROUTE GUARDS
// =============================================================================

// Khusus user non-admin. Jika admin → /admin.
function UserRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

// Khusus admin. Jika bukan admin (termasuk setelah role diturunkan) → /.
function AdminRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// Route publik. Jika sudah login, lempar ke halaman utama.
function PublicRoute({ user, children }) {
  if (user) return <Navigate to="/" replace />;
  return children;
}

// =============================================================================
// APP
// =============================================================================
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Session tidak valid');

        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      } catch {
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
    navigate(userData.role === 'admin' ? '/admin' : '/', { replace: true });
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: 'Keluar dari Akun?',
      text: 'Anda harus masuk kembali untuk mengakses aplikasi.',
      confirmButtonText: 'Ya, Keluar',
      confirmButtonColor: '#ef4444',
      icon: 'question',
    });
    if (!confirmed) return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showToast.info('Anda telah keluar.');
    navigate('/login', { replace: true });
  };

  const handleUpdateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    // Suspense tunggal membungkus seluruh Routes.
    // React akan menampilkan <PageLoader /> setiap kali chunk halaman baru
    // sedang diunduh, lalu merender halaman begitu chunk tersedia.
    <ImageViewerProvider>
    <Suspense fallback={null}>
      <Routes>

        {/* ===== LOGIN / REGISTER ===== */}
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
            <UserRoute user={user}>
              <Scan user={user} />
            </UserRoute>
          }
        />

        {/* ===== LAYOUT UTAMA (dengan bottom nav) ===== */}
        <Route
          path="/"
          element={
            <UserRoute user={user}>
              <BottomNavigation user={user} onLogout={handleLogout} />
            </UserRoute>
          }
        >
          <Route index element={<Beranda user={user} />} />
          <Route path="inventaris" element={<Inventaris user={user} />} />
          <Route path="riwayat" element={<Riwayat user={user} />} />
          <Route
            path="profil"
            element={
              <Profil
                user={user}
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
              />
            }
          />
          <Route path="faq" element={<FAQ />} />
        </Route>

        {/* ===== ADMIN CONTROL PANEL ===== */}
        {/* AdminLayout (+ Sidebar & Topbar) baru diunduh saat user admin login. */}
        {/* Navigasi antar sub-halaman admin (inventaris, transaksi, dll.)       */}
        {/* hanya mengunduh chunk halaman yang dituju, bukan seluruh admin area. */}
        <Route
          path="/admin"
          element={
            <AdminRoute user={user}>
              <AdminLayout user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="inventaris" element={<AdminInventaris />} />
          <Route path="transaksi" element={<AdminTransaksi />} />
          <Route path="laporan" element={<AdminLaporan />} />
          <Route path="users" element={<AdminUserManagement currentUser={user} />} />
          <Route path="faq" element={<AdminFaq />} />
        </Route>

        {/* ===== FALLBACK ===== */}
        <Route
          path="*"
          element={
            <Navigate
              to={user ? (user.role === 'admin' ? '/admin' : '/') : '/login'}
              replace
            />
          }
        />

      </Routes>
    </Suspense>
    </ImageViewerProvider>
  );
}

export default App;