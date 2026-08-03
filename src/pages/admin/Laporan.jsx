import { useEffect, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Search01Icon,
    RefreshIcon,
    CheckmarkCircle02Icon,
    Alert02Icon,
    AlertCircleIcon,
    PackageIcon,
    InboxIcon,
    Loading03Icon,
    Calendar03Icon,
    FileDownloadIcon,
    Cancel01Icon,
    ImageNotFound01Icon,
    Tag01Icon,
    SortByDown01Icon,
} from '@hugeicons/core-free-icons';

// Sesuaikan jika base URL API Anda berbeda (mis. lewat proxy Vite / env var)
const API_URL = `${import.meta.env.VITE_API_URL}/api/reports`;

// Opsi urutan, disamakan dengan pola SORT_OPTIONS di Inventaris.jsx
const SORT_OPTIONS = [
    { key: 'terbaru', label: 'Terbaru Dilaporkan' },
    { key: 'terlama', label: 'Terlama Dilaporkan' },
    { key: 'az', label: 'Nama Barang A-Z' },
    { key: 'za', label: 'Nama Barang Z-A' },
];

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

// Konfigurasi tampilan badge berdasarkan jenis_laporan (kondisi barang)
const KONDISI_STYLE = {
    baik: {
        label: 'Baik',
        icon: CheckmarkCircle02Icon,
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    rusak: {
        label: 'Rusak',
        icon: AlertCircleIcon,
        className: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
    hilang: {
        label: 'Hilang',
        icon: Alert02Icon,
        className: 'bg-red-50 text-red-700 ring-red-200',
    },
};

// Ubah data tabel menjadi file CSV dan unduh langsung di browser.
const exportToCsv = (rows) => {
    const header = ['Peminjam', 'Barang', 'Kategori', 'Kondisi', 'Keterangan', 'Waktu Pinjam', 'Waktu Kembali'];
    const body = rows.map((r) => [
        r.peminjam,
        r.nama_barang,
        r.kategori,
        KONDISI_STYLE[r.jenis_laporan]?.label ?? r.jenis_laporan,
        r.keterangan,
        formatTanggal(r.waktu_pinjam),
        formatTanggal(r.waktu_kembali),
    ]);

    const csv = [header, ...body]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-barang-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

export default function Laporan() {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [activeKondisi, setActiveKondisi] = useState('semua');
    const [activeKategori, setActiveKategori] = useState('semua');
    const [sortBy, setSortBy] = useState('terbaru');
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalAkhir, setTanggalAkhir] = useState('');
    const [previewFoto, setPreviewFoto] = useState(null);

    const authHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    const fetchReports = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(API_URL, { headers: authHeaders() });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Gagal memuat data laporan.');
            setReports(body.data || []);
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat memuat data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Daftar kategori unik untuk isi dropdown filter, disamakan dengan pola di Inventaris.jsx
    const kategoriOptions = useMemo(() => {
        const unique = new Set(reports.map((r) => r.kategori).filter(Boolean));
        return [...unique].sort((a, b) => a.localeCompare(b, 'id'));
    }, [reports]);

    // Tab filter kondisi dengan jumlah, disamakan dengan pola tab filter di Inventaris.jsx
    const kondisiFilters = useMemo(() => {
        const countBy = (jenis) => reports.filter((r) => r.jenis_laporan === jenis).length;
        return [
            { key: 'semua', label: 'Semua', count: reports.length },
            { key: 'baik', label: 'Baik', count: countBy('baik') },
            { key: 'rusak', label: 'Rusak', count: countBy('rusak') },
            { key: 'hilang', label: 'Hilang', count: countBy('hilang') },
        ];
    }, [reports]);

    const filtered = useMemo(() => {
        const result = reports.filter((r) => {
            const q = search.trim().toLowerCase();
            const matchSearch =
                !q ||
                r.nama_barang?.toLowerCase().includes(q) ||
                r.peminjam?.toLowerCase().includes(q) ||
                r.kategori?.toLowerCase().includes(q);

            const matchKondisi = activeKondisi === 'semua' || r.jenis_laporan === activeKondisi;
            const matchKategori = activeKategori === 'semua' || r.kategori === activeKategori;

            const tanggalLaporan = r.created_at ? r.created_at.slice(0, 10) : null;
            const matchMulai = !tanggalMulai || (tanggalLaporan && tanggalLaporan >= tanggalMulai);
            const matchAkhir = !tanggalAkhir || (tanggalLaporan && tanggalLaporan <= tanggalAkhir);

            return matchSearch && matchKondisi && matchKategori && matchMulai && matchAkhir;
        });

        return [...result].sort((a, b) => {
            switch (sortBy) {
                case 'terlama':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'az':
                    return (a.nama_barang || '').localeCompare(b.nama_barang || '', 'id');
                case 'za':
                    return (b.nama_barang || '').localeCompare(a.nama_barang || '', 'id');
                case 'terbaru':
                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });
    }, [reports, search, activeKondisi, activeKategori, tanggalMulai, tanggalAkhir, sortBy]);

    const bulanIniCount = useMemo(() => {
        const now = new Date();
        return reports.filter((r) => {
            if (!r.created_at) return false;
            const d = new Date(r.created_at);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
    }, [reports]);

    const perluPerhatianCount = useMemo(
        () => reports.filter((r) => r.jenis_laporan === 'rusak' || r.jenis_laporan === 'hilang').length,
        [reports]
    );

    // Kartu statistik, disamakan dengan pola StatCard di Transaksi.jsx & Inventaris.jsx
    const stats = [
        { key: 'total', label: 'Total Laporan', value: reports.length, icon: PackageIcon, iconWrap: 'bg-[#14a2ba]/10 text-[#14a2ba] ring-[#14a2ba]/30' },
        { key: 'bulan-ini', label: 'Laporan Bulan Ini', value: bulanIniCount, icon: Calendar03Icon, iconWrap: 'bg-amber-50 text-amber-700 ring-amber-200' },
        { key: 'perlu-perhatian', label: 'Kondisi Rusak / Hilang', value: perluPerhatianCount, icon: AlertCircleIcon, iconWrap: 'bg-red-50 text-red-700 ring-red-200' },
    ];

    return (
        <div>
            {/* HEADER & ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Barang</h1>
                    <p className="mt-1 text-sm text-slate-500">Rekap seluruh laporan kondisi barang dari pegawai</p>
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

            {/* TOOLBAR: SEARCH + FILTER KATEGORI + URUTKAN + RENTANG TANGGAL + FILTER KONDISI */}
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
                            placeholder="Cari nama barang, peminjam, atau kategori..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                                aria-label="Hapus pencarian"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>

                    <div className="relative shrink-0">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <HugeiconsIcon icon={Tag01Icon} size={15} strokeWidth={2} />
                        </span>
                        <select
                            value={activeKategori}
                            onChange={(e) => setActiveKategori(e.target.value)}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                            aria-label="Filter kategori"
                        >
                            <option value="semua">Semua Kategori</option>
                            {kategoriOptions.map((k) => (
                                <option key={k} value={k}>{k}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative shrink-0">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <HugeiconsIcon icon={SortByDown01Icon} size={15} strokeWidth={2} />
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                            aria-label="Urutkan"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
                        <input
                            type="date"
                            value={tanggalMulai}
                            onChange={(e) => setTanggalMulai(e.target.value)}
                            className="bg-transparent text-sm text-slate-600 outline-none"
                            aria-label="Tanggal laporan mulai"
                        />
                        <span className="text-sm text-slate-400">-</span>
                        <input
                            type="date"
                            value={tanggalAkhir}
                            onChange={(e) => setTanggalAkhir(e.target.value)}
                            className="bg-transparent text-sm text-slate-600 outline-none"
                            aria-label="Tanggal laporan akhir"
                        />
                    </div>
                </div>

                {/* TABS FILTER KONDISI */}
                <div className="mt-3 flex items-center gap-2 overflow-x-auto pt-0.5 pb-0.5">
                    {kondisiFilters.map((f) => {
                        const active = activeKondisi === f.key;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setActiveKondisi(f.key)}
                                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                                    active
                                        ? 'bg-[#14a2ba] text-white shadow-sm shadow-[#14a2ba]/30'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {f.label}
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                                        active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {f.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TABLE LAPORAN BARANG */}
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
                            onClick={fetchReports}
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
                        <p className="text-sm">Belum ada laporan yang cocok dengan pencarian atau filter ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-slate-500">
                                <tr>
                                    <th className="w-12 px-4 py-3 text-xs font-semibold uppercase tracking-wide">No</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Peminjam</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Barang</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Kategori</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Kondisi</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Keterangan</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Bukti Foto</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Waktu Pinjam</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Waktu Kembali</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((r, index) => {
                                    const kondisi = KONDISI_STYLE[r.jenis_laporan] ?? {
                                        label: r.jenis_laporan ?? '-',
                                        icon: AlertCircleIcon,
                                        className: 'bg-slate-100 text-slate-600 ring-slate-200',
                                    };
                                    return (
                                        <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                                            <td className="px-4 py-2.5 text-slate-500">{index + 1}</td>
                                            <td className="px-4 py-2.5 font-medium text-slate-800">{r.peminjam || '-'}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-slate-800">{r.nama_barang || '-'}</div>
                                                <div className="font-mono text-xs text-slate-400">{r.qr_code}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600">{r.kategori || '-'}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-3 text-xs font-semibold ring-1 ring-inset ${kondisi.className}`}>
                                                    <HugeiconsIcon icon={kondisi.icon} size={14} color="currentColor" strokeWidth={1.5} />
                                                    {kondisi.label}
                                                </span>
                                            </td>
                                            <td className="max-w-[220px] px-4 py-2.5 text-slate-600">
                                                <span className="line-clamp-2">{r.keterangan || '-'}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {r.foto_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewFoto(r.foto_url)}
                                                        className="group relative block h-12 w-12 overflow-hidden rounded-lg border border-slate-200"
                                                        aria-label="Lihat bukti foto"
                                                    >
                                                        <img
                                                            src={r.foto_url}
                                                            alt={`Bukti laporan ${r.nama_barang ?? ''}`}
                                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                                        />
                                                    </button>
                                                ) : (
                                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 text-slate-300">
                                                        <HugeiconsIcon icon={ImageNotFound01Icon} size={18} strokeWidth={1.5} />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600">{formatTanggal(r.waktu_pinjam)}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{formatTanggal(r.waktu_kembali)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL PREVIEW FOTO */}
            {previewFoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
                    onClick={() => setPreviewFoto(null)}
                >
                    <div className="relative max-h-[85vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={previewFoto}
                            alt="Pratinjau bukti foto"
                            className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
                        />
                        <button
                            type="button"
                            onClick={() => setPreviewFoto(null)}
                            className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg hover:bg-slate-100"
                            aria-label="Tutup pratinjau"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}