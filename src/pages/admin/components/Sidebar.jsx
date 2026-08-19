import { NavLink } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  Package02Icon,
  HistoryIcon,
  User02Icon,
  ReturnRequestIcon,
  Cancel01Icon,
  MessageQuestionIcon,
} from '@hugeicons/core-free-icons';

// ===== NAV ITEMS =====
const navItems = [
  { to: '/admin', label: 'Dashboard', icon: Home01Icon, end: true },
  { to: '/admin/inventaris', label: 'Data Barang', icon: Package02Icon },
  { to: '/admin/transaksi', label: 'Kelola Transaksi', icon: HistoryIcon },
  { to: '/admin/laporan', label: 'Laporan Pengembalian', icon: ReturnRequestIcon },
  { to: '/admin/users', label: 'Kelola Pengguna', icon: User02Icon },
  { to: '/admin/faq', label: 'FAQ', icon: MessageQuestionIcon },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive ? 'bg-[#14a2ba]/10 text-[#0b6577]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
  }`;

// ===== MAIN COMPONENT =====
export default function AdminSidebar({ open, onClose, onLogout }) {
  return (
    <>
      {/* ===== OVERLAY (mobile) ===== */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`admin-sidebar fixed z-40 inset-y-0 left-0 w-64 h-screen bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 md:sticky md:top-0 md:shrink-0 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">Inventaris STI OPS</p>
            <p className="text-[11px] text-[#14a2ba] font-semibold mt-1">Admin Panel</p>
          </div>
          <button
            type="button"
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
              onClick={onClose}
            >
              <HugeiconsIcon icon={item.icon} size={19} strokeWidth={1.8} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}