function AvatarIcon({ nama }) {
  return (
    <div className="w-9 h-9 rounded-full bg-[#14a2ba] text-white flex items-center justify-center font-semibold text-sm shrink-0">
      {nama?.charAt(0).toUpperCase() || 'A'}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function AdminTopbar({ user, onMenuClick }) {
  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-5">
      <button
        type="button"
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        onClick={onMenuClick}
        aria-label="Buka menu"
      >
        <span className="block w-5 h-0.5 bg-current relative before:content-[''] before:absolute before:-top-1.5 before:left-0 before:w-5 before:h-0.5 before:bg-current after:content-[''] after:absolute after:top-1.5 after:left-0 after:w-5 after:h-0.5 after:bg-current" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-900 leading-none">{user?.nama_lengkap}</p>
          <p className="text-[11px] text-slate-400 mt-1">Administrator</p>
        </div>
        <AvatarIcon nama={user?.nama_lengkap} />
      </div>
    </header>
  );
}