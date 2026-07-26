// ===== ADMIN - RIWAYAT TRANSAKSI (placeholder) =====
// TODO: pindahkan tampilan riwayat "semua transaksi" (bukan hanya milik
// user) dari pages/Riwayat.jsx (bagian yang dibungkus `isAdmin && ...`).
export default function Riwayat() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Riwayat Transaksi</h1>
        <p className="mt-1 text-sm text-slate-500">Seluruh aktivitas pinjam & kembali di sistem</p>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
        Belum ada konten. Logic riwayat transaksi menyusul di tahap berikutnya.
      </div>
    </div>
  );
}