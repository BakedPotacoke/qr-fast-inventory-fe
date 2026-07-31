import { useEffect, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Search01Icon,
    RefreshIcon,
    CheckmarkCircle02Icon,
    Alert02Icon,
    PackageIcon,
    InboxIcon,
    Loading03Icon,
    Clock01Icon,
    Calendar03Icon,
    FileDownloadIcon,
} from '@hugeicons/core-free-icons';

// Sesuaikan jika base URL API Anda berbeda (mis. lewat proxy Vite / env var)
const API_URL = '/api/transactions';

const formatTanggal = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Selisih hari antara waktu pinjam dan waktu kembali, dibulatkan ke atas.
const hitungDurasi = (mulai, akhir) => {
    if (!mulai || !akhir) return null;
    const ms = new Date(akhir) - new Date(mulai);
    if (Number.isNaN(ms) || ms < 0) return null;
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

// Ubah data tabel menjadi file CSV dan unduh langsung di browser.
const exportToCsv = (rows) => {
    const header = ['Barang', 'SKU', 'Peminjam', 'Kategori', 'Waktu Pinjam', 'Waktu Kembali', 'Durasi (hari)'];
    const body = rows.map((t) => [
        t.nama_barang,
        t.sku,
        t.peminjam,
        t.kategori,
        formatTanggal(t.waktu_pinjam),
        formatTanggal(t.waktu_kembali),
        hitungDurasi(t.waktu_pinjam, t.waktu_kembali) ?? '-',
    ]);

    const csv = [header, ...body]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-pengembalian-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

export default function Laporan() {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalAkhir, setTanggalAkhir] = useState('');

    const authHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    const fetchTransactions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(API_URL, { headers: authHeaders() });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Gagal memuat data laporan.');
            setTransactions(body.data || []);
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat memuat data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Laporan Pengembalian hanya menampilkan transaksi yang sudah selesai (dikembalikan).
    const pengembalian = useMemo(
        () => transactions.filter((t) => t.status === 'selesai'),
        [transactions]
    );

    const filtered = useMemo(() => {
        return pengembalian.filter((t) => {
            const q = search.trim().toLowerCase();
            const matchSearch =
                !q ||
                t.nama_barang?.toLowerCase().includes(q) ||
                t.peminjam?.toLowerCase().includes(q) ||
                t.sku?.toLowerCase().includes(q);

            const tanggalKembali = t.waktu_kembali ? t.waktu_kembali.slice(0, 10) : null;
            const matchMulai = !tanggalMulai || (tanggalKembali && tanggalKembali >= tanggalMulai);
            const matchAkhir = !tanggalAkhir || (tanggalKembali && tanggalKembali <= tanggalAkhir);

            return matchSearch && matchMulai && matchAkhir;
        });
    }, [pengembalian, search, tanggalMulai, tanggalAkhir]);

    // Rata-rata durasi pinjam (dalam hari) dari data yang sedang ditampilkan.
    const rataDurasi = useMemo(() => {
        const durasiList = filtered
            .map((t) => hitungDurasi(t.waktu_pinjam, t.waktu_kembali))
            .filter((d) => d !== null);
        if (durasiList.length === 0) return 0;
        return Math.round(durasiList.reduce((a, b) => a + b, 0) / durasiList.length);
    }, [filtered]);

    const bulanIniCount = useMemo(() => {
        const now = new Date();
        return pengembalian.filter((t) => {
            if (!t.waktu_kembali) return false;
            const d = new Date(t.waktu_kembali);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
    }, [pengembalian]);

    // Kartu statistik, disamakan dengan pola StatCard di Transaksi.jsx & Inventaris.jsx
    const stats = [
        { key: 'total', label: 'Total Pengembalian', value: pengembalian.length, icon: PackageIcon, iconWrap: 'bg-[#14a2ba]/10 text-[#14a2ba] ring-[#14a2ba]/30' },
        { key: 'bulan-ini', label: 'Dikembalikan Bulan Ini', value: bulanIniCount, icon: Calendar03Icon, iconWrap: 'bg-amber-50 text-amber-700 ring-amber-200' },
        { key: 'durasi', label: 'Rata-rata Durasi Pinjam', value: `${rataDurasi} hari`, icon: Clock01Icon, iconWrap: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    ];

    return (
        <div>
            {/* HEADER & ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Pengembalian</h1>
                    <p className="mt-1 text-sm text-slate-500">Rekap seluruh barang yang telah dikembalikan</p>
                </div>
                <button
                    type="button"
                    onClick={() => exportToCsv(filtered)}
                    disabled={filtered.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#14a2ba] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#14a2ba]/25 transition hover:bg-[#0f8298] active:scale-[0.98] disabled:opacity-50"
                >
                    <HugeiconsIcon icon={FileDownloadIcon} size={16} strokeWidth={2} />
                    Ekspor CSV
                </button>
            </div>

            {/* STAT CARDS */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((s) => (
                    <div
                        key={s.key}
                        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${s.iconWrap}`}>
                            <HugeiconsIcon icon={s.icon} size={20} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold leading-none text-slate-800">{s.value}</p>
                            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* TOOLBAR: SEARCH + RENTANG TANGGAL */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative min-w-[220px] flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama barang, peminjam, atau SKU..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                        />
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
                        <input
                            type="date"
                            value={tanggalMulai}
                            onChange={(e) => setTanggalMulai(e.target.value)}
                            className="bg-transparent text-sm text-slate-600 outline-none"
                            aria-label="Tanggal kembali mulai"
                        />
                        <span className="text-sm text-slate-400">-</span>
                        <input
                            type="date"
                            value={tanggalAkhir}
                            onChange={(e) => setTanggalAkhir(e.target.value)}
                            className="bg-transparent text-sm text-slate-600 outline-none"
                            aria-label="Tanggal kembali akhir"
                        />
                    </div>
                </div>
            </div>

            {/* TABLE LAPORAN PENGEMBALIAN */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2 p-14 text-slate-400">
                        <HugeiconsIcon icon={Loading03Icon} size={22} strokeWidth={2} className="animate-spin text-[#14a2ba]" />
                        <span className="text-sm">Memuat data laporan...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-2 p-14 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={1.75} />
                        </div>
                        <p className="text-sm text-red-500">{error}</p>
                        <button
                            onClick={fetchTransactions}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#14a2ba] hover:text-[#14a2ba]"
                        >
                            <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={2} />
                            Coba lagi
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-14 text-center text-slate-400">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                            <HugeiconsIcon icon={InboxIcon} size={20} strokeWidth={1.75} />
                        </div>
                        <p className="text-sm">Belum ada pengembalian yang cocok dengan pencarian atau filter ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Barang</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Peminjam</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Kategori</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Waktu Pinjam</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Waktu Kembali</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Durasi</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((t) => {
                                    const durasi = hitungDurasi(t.waktu_pinjam, t.waktu_kembali);
                                    return (
                                        <tr key={t.id} className="transition-colors hover:bg-slate-50/70">
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-slate-800">{t.nama_barang}</div>
                                                <div className="font-mono text-xs text-slate-400">{t.sku}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600">{t.peminjam}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{t.kategori}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{formatTanggal(t.waktu_pinjam)}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{formatTanggal(t.waktu_kembali)}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{durasi ? `${durasi} hari` : '-'}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 py-1 pl-2.5 pr-3 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} color="currentColor" strokeWidth={1.5} />
                                                    Selesai
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}