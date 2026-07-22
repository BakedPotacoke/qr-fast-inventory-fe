import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  QrCode01Icon,
  Home01Icon,
  Package02Icon,
  HistoryIcon,
  User02Icon,
} from '@hugeicons/core-free-icons';

// ===== ICONS (Hugeicons — stroke) =====
const IconQR = () => <HugeiconsIcon icon={QrCode01Icon} size={24} color="currentColor" strokeWidth={1.8} />;
const IconHome = () => <HugeiconsIcon icon={Home01Icon} size={22} color="currentColor" strokeWidth={1.8} />;
const IconList = () => <HugeiconsIcon icon={Package02Icon} size={22} color="currentColor" strokeWidth={1.8} />;
const IconHistory = () => <HugeiconsIcon icon={HistoryIcon} size={22} color="currentColor" strokeWidth={1.8} />;
const IconUser = () => <HugeiconsIcon icon={User02Icon} size={22} color="currentColor" strokeWidth={1.8} />;

const navItemClass = ({ isActive }) =>
  `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
    isActive ? 'text-[#14a2ba]' : 'text-slate-400 hover:text-slate-600'
  }`;

// ===== MAIN COMPONENT =====
export default function DashboardLayout({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div
      className="main-shell min-h-screen w-full flex flex-col bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ===== SCROLLABLE CONTENT (halaman anak dirender di sini) ===== */}
      <div className="main-scroll flex-1 overflow-y-auto">
        <Outlet context={{ user, onLogout }} />
      </div>

      {/* ===== BOTTOM NAVIGATION ===== */}
      <nav className="bottom-nav fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <NavLink to="/" end className={navItemClass}>
          <IconHome />
          <span>Beranda</span>
        </NavLink>
        <NavLink to="/inventaris" className={navItemClass}>
          <IconList />
          <span>Inventaris</span>
        </NavLink>

        {/* QR Center Button */}
        <button
          className="nav-qr w-14 h-14 rounded-full bg-[#14a2ba] text-white flex items-center justify-center shadow-lg border-4 border-white -mt-6 hover:bg-[#0d8194] transition-colors active:scale-95"
          type="button"
          aria-label="Scan QR"
          onClick={() => navigate('/scan')}
        >
          <IconQR />
        </button>

        <NavLink to="/riwayat" className={navItemClass}>
          <IconHistory />
          <span>Riwayat</span>
        </NavLink>
        <NavLink to="/profil" className={navItemClass}>
          <IconUser />
          <span>Profil</span>
        </NavLink>
      </nav>
    </div>
  );
}