import { HugeiconsIcon } from '@hugeicons/react';
import { ReloadIcon } from '@hugeicons/core-free-icons';

// ===== STATE: GAGAL MEMUAT DATA =====
// Komponen konsisten untuk semua halaman ketika fetch data gagal.
// Tanpa border/background, teks slate-400, tombol reload di bawah teks.
export default function GagalMuatData({ onRetry, pesan = 'Gagal memuat data' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <p className="text-sm text-slate-400">{pesan}</p>
      <button
        type="button"
        onClick={onRetry}
        aria-label="Muat ulang"
        title="Muat ulang"
        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 active:scale-95"
      >
        <HugeiconsIcon icon={ReloadIcon} size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
