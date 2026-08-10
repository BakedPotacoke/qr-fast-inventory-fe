import { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './components/Sidebar';
import AdminTopbar from './components/Topbar';

// Fallback ringan khusus untuk konten halaman admin.
// Berbeda dengan PageLoader di App.jsx yang full-screen, loader ini
// hanya mengisi area <main> — sidebar dan topbar tetap terlihat
// saat pengguna navigasi antar halaman dalam area admin.
function AdminPageLoader() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#14a2ba] border-t-transparent" />
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function AdminLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="admin-shell min-h-screen w-full flex bg-[#f8fafc]"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar user={user} onMenuClick={() => setSidebarOpen(true)} />

        {/* ===== PAGE CONTENT =====
            Suspense di sini (inner) bekerja sama dengan Suspense di App.jsx (outer):
            - Pertama kali /admin diakses → outer Suspense di App.jsx aktif
              (full-screen loader, karena AdminLayout sendiri masih diunduh).
            - Setelah AdminLayout ter-cache, navigasi antar sub-halaman admin
              hanya men-trigger inner Suspense ini → sidebar & topbar tetap tampil,
              hanya konten <main> yang menampilkan loader sementara chunk halaman diunduh.
        ===== */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <Suspense fallback={<AdminPageLoader />}>
            <Outlet context={{ user, onLogout }} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}