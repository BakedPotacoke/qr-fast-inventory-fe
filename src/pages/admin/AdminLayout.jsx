import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './components/Sidebar';
import AdminTopbar from './components/Topbar';

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

        {/* ===== PAGE CONTENT (halaman admin dirender di sini) ===== */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <Outlet context={{ user, onLogout }} />
        </main>
      </div>
    </div>
  );
}