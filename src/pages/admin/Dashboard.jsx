// ===== ADMIN DASHBOARD (placeholder) =====
// TODO: pindahkan/ganti dengan ringkasan statistik admin (total pengguna,
// total barang, transaksi hari ini, laporan hilang/rusak, dsb).
export default function Dashboard() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan aktivitas dan statistik sistem</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Total Pengguna', 'Total Barang', 'Sedang Dipinjam', 'Laporan Aktif'].map((label) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="block h-7 w-12 rounded bg-slate-100 animate-pulse" />
            <p className="mt-2 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
        Konten dashboard admin belum dipindahkan ke sini.
      </div>
    </div>
  );
}