import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BarCode01Icon,
  ImageAdd02Icon,
  Cancel01Icon,
  PackageIcon,
  FlashlightIcon,
  FlashlightOffIcon,
  Camera01Icon,
  Search01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  Add01Icon,
  Refresh01Icon,
  AlertCircleIcon,
  Tag01Icon,
  SortByDown01Icon,
  PackageSearchIcon,
  Loading03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  AlertDiamondIcon,
  HelpCircleIcon,
  Upload01Icon,
  Download01Icon,
  FileUploadIcon,
} from '@hugeicons/core-free-icons';
import Pagination from '../../components/Pagination';
import { useImageViewer } from '../../components/ImageViewer';
import { showToast, showConfirm } from '../../utils/alert';
import { toSentenceCase } from '../../utils/string';

const API_URL = `${import.meta.env.VITE_API_URL}/api/items`;
const DEFAULT_PAGE_LIMIT = 15;

const STATUS_OPTIONS = ['tersedia', 'dipinjam', 'rusak', 'hilang'];
const SORT_OPTIONS = [
  { key: 'terbaru', label: 'Terbaru Ditambahkan' },
  { key: 'terlama', label: 'Terlama Ditambahkan' },
  { key: 'az', label: 'Nama A-Z' },
  { key: 'za', label: 'Nama Z-A' },
];

const STATUS_CONFIG = {
  tersedia: {
    label: 'Tersedia',
    icon: CheckmarkCircle02Icon,
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    dot: 'bg-emerald-500',
    iconWrap: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  dipinjam: {
    label: 'Dipinjam',
    icon: Clock01Icon,
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    dot: 'bg-amber-500',
    iconWrap: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  rusak: {
    label: 'Rusak',
    icon: AlertDiamondIcon,
    badge: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    dot: 'bg-red-500',
    iconWrap: 'bg-red-50 text-red-700 ring-red-200',
  },
  hilang: {
    label: 'Hilang',
    icon: HelpCircleIcon,
    badge: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
    dot: 'bg-slate-400',
    iconWrap: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
};

export default function InventarisAdmin() {
  const { openViewer } = useImageViewer();
  // ── Server-side data ─────────────────────────────────────────────────────
  const [barangList, setBarangList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULT_PAGE_LIMIT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Summary stats — globalSummary untuk stat cards, filteredSummary untuk tab counts ──
  const [globalSummary, setGlobalSummary]     = useState({ total: 0, tersedia: 0, dipinjam: 0, rusak: 0, hilang: 0 });
  const [filteredSummary, setFilteredSummary] = useState({ total: 0, tersedia: 0, dipinjam: 0, rusak: 0, hilang: 0 });

  // ── Filter state — dikirim ke server sebagai query params ────────────────
  const [searchQuery, setSearchQuery]                   = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter]                 = useState('semua');     // status
  const [activeKategori, setActiveKategori]             = useState('semua');
  const [sortBy, setSortBy]                             = useState('terbaru');
  const [kategoriOptions, setKategoriOptions]           = useState([]);

  // ── Bulk delete ───────────────────────────────────────────────────────────
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [isDeleting, setIsDeleting]               = useState(false);

  // ── Modal Form ────────────────────────────────────────────────────────────
  const [showForm, setShowForm]   = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // ── Modal Import ──────────────────────────────────────────────────────────
  const [showImport, setShowImport] = useState(false);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }, []);

  // ── Bangun URL fetch berdasarkan state filter ────────────────────────────
  const buildUrl = useCallback((page) => {
    const params = new URLSearchParams({ page, limit: pageLimit });
    if (activeFilter !== 'semua')                            params.set('status', activeFilter);
    if (activeKategori !== 'semua')                          params.set('kategori', activeKategori);
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) params.set('search', debouncedSearchQuery.trim());
    params.set('sortBy', sortBy);
    return `${API_URL}?${params.toString()}`;
  }, [activeFilter, activeKategori, debouncedSearchQuery, sortBy, pageLimit]);

  // ── Fetch halaman aktif ──────────────────────────────────────────────────
  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl(page), { headers: authHeaders() });
      if (!res.ok) throw new Error('Gagal mengambil data inventaris');
      const body = await res.json();

      const mapped = (body.data || []).map((item) => ({
        ...item,
        nama: item.nama_barang,
        sku: item.qr_code,
        gambar: item.gambar_url,
      }));
      setBarangList(mapped);
      setPagination(body.pagination || null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildUrl, authHeaders]);

  // ── Fetch global summary stats — total keseluruhan lintas filter ─────────
  const fetchGlobalSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const statuses = ['tersedia', 'dipinjam', 'rusak', 'hilang'];

      const [totalRes, ...statusRes] = await Promise.all([
        fetch(`${API_URL}?page=1&limit=1`, { headers }),
        ...statuses.map((s) => fetch(`${API_URL}?page=1&limit=1&status=${s}`, { headers })),
      ]);

      const [totalBody, ...statusBodies] = await Promise.all([
        totalRes.json(),
        ...statusRes.map((r) => r.json()),
      ]);

      setGlobalSummary({
        total:    totalBody.pagination?.total   ?? 0,
        tersedia: statusBodies[0].pagination?.total ?? 0,
        dipinjam: statusBodies[1].pagination?.total ?? 0,
        rusak:    statusBodies[2].pagination?.total ?? 0,
        hilang:   statusBodies[3].pagination?.total ?? 0,
      });
    } catch {
      // Summary tidak kritis — gagal diam-diam
    }
  }, []);

  // ── Fetch filtered summary stats — terfilter sesuai kategori & search ─────
  const fetchFilteredSummary = useCallback(async ({ kategori, search: q } = {}) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const statuses = ['tersedia', 'dipinjam', 'rusak', 'hilang'];

      const buildSummaryParams = (status) => {
        const params = new URLSearchParams({ page: 1, limit: 1 });
        if (status   && status   !== 'semua') params.set('status',   status);
        if (kategori && kategori !== 'semua') params.set('kategori', kategori);
        if (q        && q.trim())             params.set('search',   q.trim());
        return params.toString();
      };

      const [totalRes, ...statusRes] = await Promise.all([
        fetch(`${API_URL}?${buildSummaryParams()}`, { headers }),
        ...statuses.map((s) => fetch(`${API_URL}?${buildSummaryParams(s)}`, { headers })),
      ]);

      const [totalBody, ...statusBodies] = await Promise.all([
        totalRes.json(),
        ...statusRes.map((r) => r.json()),
      ]);

      setFilteredSummary({
        total:    totalBody.pagination?.total   ?? 0,
        tersedia: statusBodies[0].pagination?.total ?? 0,
        dipinjam: statusBodies[1].pagination?.total ?? 0,
        rusak:    statusBodies[2].pagination?.total ?? 0,
        hilang:   statusBodies[3].pagination?.total ?? 0,
      });
    } catch {
      // Summary tidak kritis — gagal diam-diam
    }
  }, []);

  // Fetch kategori untuk dropdown filter
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const res = await fetch(`${API_URL}/kategori`, { headers: authHeaders() });
        if (!res.ok) return;
        const body = await res.json();
        setKategoriOptions(body.data || []);
      } catch (err) {
        console.error('Gagal mengambil daftar kategori:', err);
      }
    };
    fetchKategori();
  }, [authHeaders]);

  // Debounce input search (500 ms) sebelum mengubah debouncedSearchQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data saat page / filter status / filter kategori / debounced search query / sort / pageLimit berubah
  useEffect(() => {
    fetchItems(currentPage);
  }, [currentPage, activeFilter, activeKategori, debouncedSearchQuery, sortBy, pageLimit, fetchItems]);

  // Fetch global summary saat mount
  useEffect(() => {
    fetchGlobalSummary();
  }, [fetchGlobalSummary]);

  // Fetch filtered summary saat activeKategori atau debouncedSearchQuery berubah
  useEffect(() => {
    fetchFilteredSummary({
      kategori: activeKategori,
      search:   debouncedSearchQuery,
    });
  }, [activeKategori, debouncedSearchQuery, fetchFilteredSummary]);

  // ── Sort sudah dilakukan server-side — langsung pakai barangList ─────────
  const filteredBarang = barangList;

  // ── Handlers filter — reset ke halaman 1 saat filter berubah ─────────────
  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setCurrentPage(1);
    setSelectedForDelete([]);
  };
  const handleKategoriChange = (e) => {
    setActiveKategori(e.target.value);
    setCurrentPage(1);
    setSelectedForDelete([]);
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedForDelete([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (newLimit) => {
    setPageLimit(newLimit);
    setCurrentPage(1);
    setSelectedForDelete([]);
  };

  // ── Form modal handlers ───────────────────────────────────────────────────
  const handleOpenTambah = () => { setItemToEdit(null); setShowForm(true); };
  const handleOpenEdit   = (item) => { setItemToEdit(item); setShowForm(true); };

  const handleSaved = (savedItem, isNew, message) => {
    if (isNew) {
      // Refresh halaman pertama supaya item baru muncul di atas
      setCurrentPage(1);
      fetchItems(1);
    } else {
      setBarangList((prev) => prev.map((b) => (b.id === savedItem.id ? savedItem : b)));
    }
    fetchGlobalSummary();
    fetchFilteredSummary({ kategori: activeKategori, search: debouncedSearchQuery });
    setShowForm(false);
    setItemToEdit(null);
    showToast.success(message || (isNew ? 'Barang berhasil ditambahkan.' : 'Barang berhasil diperbarui.'));
  };

  // ── Hapus satu barang ─────────────────────────────────────────────────────
  const handleDelete = async (item) => {
    if (item.status === 'dipinjam') {
      showToast.warning('Barang yang sedang dipinjam tidak dapat dihapus!');
      return;
    }
    const confirmed = await showConfirm({
      title: 'Hapus Barang?',
      text: `Barang "${item.nama}" akan dihapus permanen.`,
      confirmButtonText: 'Ya, Hapus',
      confirmButtonColor: '#ef4444',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(API_URL, {
        method: 'DELETE',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [item.id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus barang');
      setSelectedForDelete((prev) => prev.filter((id) => id !== item.id));
      // Refresh halaman aktif; kalau halaman kosong setelah hapus, mundur 1
      const nextPage = barangList.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(nextPage);
      fetchItems(nextPage);
      fetchGlobalSummary();
      fetchFilteredSummary({ kategori: activeKategori, search: debouncedSearchQuery });
      showToast.success(data.message || 'Barang berhasil dihapus.');
    } catch (err) {
      console.error(err);
      showToast.error(err.message || 'Gagal menghapus barang.');
    }
  };

  // ── Hapus massal ──────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selectedForDelete.length === 0) return;
    const confirmed = await showConfirm({
      title: 'Hapus Barang Terpilih?',
      text: `Yakin ingin menghapus ${selectedForDelete.length} barang terpilih secara permanen?`,
      confirmButtonText: 'Ya, Hapus Semua',
      confirmButtonColor: '#ef4444',
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(API_URL, {
        method: 'DELETE',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedForDelete }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus barang secara massal');
      setSelectedForDelete([]);
      const nextPage = barangList.length === selectedForDelete.length && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(nextPage);
      fetchItems(nextPage);
      fetchGlobalSummary();
      fetchFilteredSummary({ kategori: activeKategori, search: debouncedSearchQuery });
      showToast.success(data.message || 'Barang terpilih berhasil dihapus.');
    } catch (err) {
      console.error(err);
      showToast.error(err.message || 'Gagal menghapus barang terpilih.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Checkbox handlers ─────────────────────────────────────────────────────
  const handleToggleSelect = (id, status) => {
    if (status === 'dipinjam') return;
    setSelectedForDelete((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectableBarang = useMemo(
    () => filteredBarang.filter((item) => item.status !== 'dipinjam'),
    [filteredBarang]
  );

  const isAllSelected =
    selectableBarang.length > 0 &&
    selectableBarang.every((item) => selectedForDelete.includes(item.id));

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedForDelete(selectableBarang.map((item) => item.id));
    } else {
      setSelectedForDelete([]);
    }
  };

  // ── Stats dari global summary (tidak berubah saat filter diterapkan) ────
  const stats = [
    { key: 'semua',      label: 'Total Barang',   count: globalSummary.total,                      icon: PackageIcon,      iconWrap: 'bg-[#14a2ba]/10 text-[#14a2ba] ring-[#14a2ba]/30' },
    { key: 'tersedia',   label: 'Tersedia',        count: globalSummary.tersedia,                   icon: STATUS_CONFIG.tersedia.icon,  iconWrap: STATUS_CONFIG.tersedia.iconWrap },
    { key: 'dipinjam',   label: 'Dipinjam',        count: globalSummary.dipinjam,                   icon: STATUS_CONFIG.dipinjam.icon,  iconWrap: STATUS_CONFIG.dipinjam.iconWrap },
    { key: 'bermasalah', label: 'Rusak / Hilang',  count: globalSummary.rusak + globalSummary.hilang,     icon: AlertDiamondIcon, iconWrap: STATUS_CONFIG.rusak.iconWrap },
  ];

  // ── Tab filter status — jumlah menyesuaikan dengan filter aktif ─────────
  const statusFilters = [
    { key: 'semua',    label: 'Semua',    count: filteredSummary.total },
    { key: 'tersedia', label: 'Tersedia', count: filteredSummary.tersedia },
    { key: 'dipinjam', label: 'Dipinjam', count: filteredSummary.dipinjam },
    { key: 'rusak',    label: 'Rusak',    count: filteredSummary.rusak },
    { key: 'hilang',   label: 'Hilang',   count: filteredSummary.hilang },
  ];

  return (
    <div>
      {/* HEADER & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventaris</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola dan pantau seluruh barang yang terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedForDelete.length > 0 && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
              {isDeleting ? 'Menghapus...' : `Hapus (${selectedForDelete.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#14a2ba] hover:text-[#14a2ba] active:scale-[0.98]"
          >
            <HugeiconsIcon icon={Upload01Icon} size={16} strokeWidth={2} />
            Import CSV
          </button>
          <button
            type="button"
            onClick={handleOpenTambah}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#14a2ba] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#14a2ba]/25 transition hover:bg-[#0f8298] active:scale-[0.98]"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2.5} />
            Tambah Barang
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${s.iconWrap}`}>
              <HugeiconsIcon icon={s.icon} size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none text-slate-800">{s.count}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search — server-side dengan debounce 500 ms */}
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau SKU barang..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedForDelete([]);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setDebouncedSearchQuery(''); setCurrentPage(1); setSelectedForDelete([]); }}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Hapus pencarian"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Filter Kategori — server-side */}
          <div className="relative shrink-0">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <HugeiconsIcon icon={Tag01Icon} size={15} strokeWidth={2} />
            </span>
            <select
              value={activeKategori}
              onChange={handleKategoriChange}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
              aria-label="Filter kategori"
            >
              <option value="semua">Semua Kategori</option>
              {kategoriOptions.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Urutkan — client-side */}
          <div className="relative shrink-0">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <HugeiconsIcon icon={SortByDown01Icon} size={15} strokeWidth={2} />
            </span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); setSelectedForDelete([]); }}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
              aria-label="Urutkan"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Limit Baris Per Halaman — server-side */}
          <div className="relative shrink-0">
            <select
              value={pageLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
              aria-label="Jumlah baris per halaman"
            >
              {[15, 30, 50, 100, 150].map((opt) => (
                <option key={opt} value={opt}>{opt} baris / hal</option>
              ))}
            </select>
          </div>
        </div>

        {/* TABS FILTER STATUS — server-side */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 pt-0.5">
          {statusFilters.map((f) => {
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterChange(f.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-[#14a2ba] text-white shadow-sm shadow-[#14a2ba]/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TABLE INVENTARIS */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    disabled={selectableBarang.length === 0}
                    className="h-4 w-4 rounded border-slate-300 accent-[#14a2ba] disabled:cursor-not-allowed disabled:opacity-40"
                    title={selectableBarang.length === 0 ? 'Tidak ada barang yang bisa dipilih' : 'Pilih semua barang yang dapat dihapus'}
                  />
                </th>
                <th className="w-12 px-3 py-3 text-xs font-semibold uppercase tracking-wide">No</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Foto</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Nama</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">SKU</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Kategori</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <HugeiconsIcon icon={Loading03Icon} size={22} strokeWidth={2} className="animate-spin text-[#14a2ba]" />
                      <span className="text-sm">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-3 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={1.75} />
                      </div>
                      <p className="text-sm text-red-500">{error}</p>
                      <button
                        type="button"
                        onClick={() => fetchItems(currentPage)}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#14a2ba] hover:text-[#14a2ba]"
                      >
                        <HugeiconsIcon icon={Refresh01Icon} size={14} strokeWidth={2} />
                        Coba lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredBarang.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                        <HugeiconsIcon icon={PackageSearchIcon} size={20} strokeWidth={1.75} />
                      </div>
                      <p className="text-sm">Barang tidak ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBarang.map((item, index) => {
                  const isChecked   = selectedForDelete.includes(item.id);
                  const isBorrowed  = item.status === 'dipinjam';
                  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.hilang;
                  const rowNumber   = pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${isChecked ? 'bg-[#14a2ba]/5' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isBorrowed}
                          onChange={() => handleToggleSelect(item.id, item.status)}
                          className="h-4 w-4 rounded border-slate-300 accent-[#14a2ba] disabled:cursor-not-allowed disabled:opacity-30"
                          title={isBorrowed ? 'Barang sedang dipinjam tidak dapat dipilih' : ''}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{rowNumber}</td>
                      <td className="px-3 py-2.5">
                        {item.gambar ? (
                          <button
                            type="button"
                            onClick={() =>
                              openViewer(
                                item.gambar.startsWith('http') || item.gambar.startsWith('blob:')
                                  ? item.gambar
                                  : `${import.meta.env.VITE_API_URL}${item.gambar}`
                              )
                            }
                            className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/70 transition hover:ring-[#14a2ba]"
                            title="Klik untuk lihat gambar penuh"
                          >
                            <img
                              src={
                                item.gambar.startsWith('http') || item.gambar.startsWith('blob:')
                                  ? item.gambar
                                  : `${import.meta.env.VITE_API_URL}${item.gambar}`
                              }
                              alt={item.nama}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          </button>
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/70">
                            <HugeiconsIcon icon={PackageIcon} size={17} className="text-slate-400" strokeWidth={1.5} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{item.nama}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{item.sku}</td>
                      <td className="px-3 py-2.5 text-slate-500">{item.kategori}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusConfig.badge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#14a2ba]/10 hover:text-[#14a2ba]"
                            aria-label={`Edit ${item.nama}`}
                            title="Edit"
                          >
                            <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={1.75} />
                          </button>
                          {isBorrowed ? (
                            <span
                              className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg text-slate-300"
                              title="Barang sedang dipinjam tidak dapat dihapus"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.75} />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                              aria-label={`Hapus ${item.nama}`}
                              title="Hapus"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {!loading && !error && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* FORM MODAL */}
      {showForm && (
        <BarangFormModal
          item={itemToEdit}
          onClose={() => { setShowForm(false); setItemToEdit(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* IMPORT MODAL */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setCurrentPage(1);
            fetchItems(1);
            fetchGlobalSummary();
            fetchFilteredSummary({ kategori: activeKategori, search: debouncedSearchQuery });
          }}
        />
      )}
    </div>
  );
}

// ===== IMPORT MODAL =====
function ImportModal({ onClose, onImported }) {
  const fileRef                     = useRef(null);
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting]   = useState(false);

  const REQUIRED_COLS    = ['nama_barang', 'qr_code', 'kategori'];
  const TEMPLATE_HEADERS = ['nama_barang', 'qr_code', 'kategori', 'status'];

  // ── Download template CSV ─────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const rows = [TEMPLATE_HEADERS];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'template_import_barang.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Parse CSV ─────────────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setParseError('');
    setPreview([]);
    setFile(null);

    const ext = f.name.split('.').pop().toLowerCase();
    if (ext !== 'csv') {
      setParseError('Format tidak didukung. Gunakan file .csv');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    Papa.parse(f, {
      header:           true,
      skipEmptyLines:   true,
      transformHeader:  (h) => h.trim().toLowerCase(),
      transform:        (v) => v.trim(),
      complete: ({ data: rows, errors }) => {
        if (errors.length > 0) {
          console.error('PapaParse errors:', errors);
          setParseError('Gagal membaca file. Pastikan format CSV valid.');
          return;
        }
        if (rows.length === 0) {
          setParseError('File kosong atau tidak ada data.');
          return;
        }
        const missing = REQUIRED_COLS.filter(c => !(c in rows[0]));
        if (missing.length > 0) {
          setParseError(`Kolom wajib tidak ditemukan: ${missing.join(', ')}. Pastikan header sesuai template.`);
          return;
        }
        setPreview(rows.slice(0, 5));
        setFile({ name: f.name, _parsed: rows });
      },
      error: (err) => {
        console.error(err);
        setParseError('Gagal membaca file. Pastikan format CSV valid.');
      },
    });
  };

  // ── Kirim ke server ───────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file?._parsed) return;

    const confirmed = await showConfirm({
      title:             'Konfirmasi Import',
      text:              `Yakin ingin mengimport ${file._parsed.length} baris data dari "${file.name}"?`,
      confirmButtonText: 'Ya, Import',
      confirmButtonColor: '#14a2ba',
    });
    if (!confirmed) return;

    setImporting(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/import`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ items: file._parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal import');

      const { inserted, skipped, errors } = data.results ?? {};

      if (inserted > 0) {
        showToast.success(data.message);
        onImported();
        onClose();
      } else {
        // Tidak ada yang masuk — tampilkan warning tapi tetap di modal
        showToast.warning(data.message || 'Tidak ada barang baru yang diimport.');
      }

      // Peringatan tambahan jika ada baris bermasalah
      if (skipped?.length > 0) {
        const detail = skipped.slice(0, 3).map(s => `${s.qr_code}: ${s.message}`).join('\n');
        const more   = skipped.length > 3 ? `\n...dan ${skipped.length - 3} lainnya` : '';
        showToast.warning(`${skipped.length} baris dilewati:\n${detail}${more}`);
      }
      if (errors?.length > 0) {
        const detail = errors.slice(0, 3).map(e => `Baris ${e.row} (${e.qr_code}): ${e.message}`).join('\n');
        const more   = errors.length > 3 ? `\n...dan ${errors.length - 3} lainnya` : '';
        showToast.error(`${errors.length} baris error:\n${detail}${more}`);
      }
    } catch (err) {
      console.error(err);
      showToast.error(err.message || 'Terjadi kesalahan saat import.');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setParseError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14a2ba]/10 text-[#14a2ba]">
              <HugeiconsIcon icon={Upload01Icon} size={17} strokeWidth={1.75} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Import Barang</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200">
            <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">

          {/* Download template */}
          <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Belum punya template?</p>
              <p className="text-xs text-slate-500">Unduh template CSV lalu isi datanya</p>
            </div>
            <button type="button" onClick={handleDownloadTemplate}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#14a2ba] hover:text-[#14a2ba]">
              <HugeiconsIcon icon={Download01Icon} size={14} strokeWidth={2} />
              Unduh Template
            </button>
          </div>

          {/* Upload area */}
          {!file ? (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-[#14a2ba] hover:bg-[#14a2ba]/5">
              <HugeiconsIcon icon={FileUploadIcon} size={24} strokeWidth={1.5} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-500">Klik untuk pilih file <span className="text-[#14a2ba]">.csv</span></span>
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={FileUploadIcon} size={18} strokeWidth={1.75} className="text-[#14a2ba]" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">{file._parsed.length} baris data ditemukan</p>
                </div>
              </div>
              <button type="button" onClick={reset} className="text-xs font-semibold text-slate-400 hover:text-red-500">Ganti</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              {parseError}
            </div>
          )}

          {/* Preview tabel */}
          {preview.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">Preview (5 baris pertama)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {TEMPLATE_HEADERS.map(h => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {TEMPLATE_HEADERS.map(h => (
                          <td key={h} className="px-3 py-2 text-slate-700">{row[h] || <span className="text-slate-300">—</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {file?._parsed.length > 5 && (
                <p className="mt-1 text-xs text-slate-400">...dan {file._parsed.length - 5} baris lainnya</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Batal
            </button>
            {file?._parsed && (
              <button type="button" onClick={handleImport} disabled={importing}
                className="flex-1 rounded-xl bg-[#14a2ba] py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#14a2ba]/25 transition hover:bg-[#0f8298] disabled:opacity-50">
                {importing ? 'Mengimport...' : `Import ${file._parsed.length} Barang`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SCANNER (QR & Barcode) =====
const SKU_SCANNER_ID = 'sku-scanner-viewport-admin';

function SkuScannerModal({ onClose, onDetected }) {
  const scannerRef       = useRef(null);
  const hasDetectedRef   = useRef(false);
  const [cameraError, setCameraError]       = useState(null);
  const [torchOn, setTorchOn]               = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (cancelled) return;

      const allFormats = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.AZTEC,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.MAXICODE,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.PDF_417,
        Html5QrcodeSupportedFormats.RSS_14,
        Html5QrcodeSupportedFormats.RSS_EXPANDED,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
      ];

      const scanner = new Html5Qrcode(SKU_SCANNER_ID, { formatsToSupport: allFormats, verbose: false });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (hasDetectedRef.current) return;
            hasDetectedRef.current = true;
            onDetected(decodedText);
          },
          () => {}
        );
        try {
          const cap = scanner.getRunningTrackCapabilities();
          if (!cancelled) setTorchSupported(!!cap?.torch);
        } catch { if (!cancelled) setTorchSupported(false); }
      } catch (err) {
        setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
        console.error(err);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      const s = scannerRef.current;
      if (s) {
        try { if (s.getState() === 2) s.stop().catch(() => {}); } catch { /* no-op */ }
      }
    };
  }, [onDetected]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    const next = !torchOn;
    try {
      await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (err) { console.error('Gagal mengaktifkan flash:', err); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <HugeiconsIcon icon={BarCode01Icon} size={17} strokeWidth={1.75} className="text-[#14a2ba]" />
            Scan QR / Barcode Barang
          </h3>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200" aria-label="Tutup">
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative mt-3 aspect-square overflow-hidden rounded-3xl bg-black">
          <div id={SKU_SCANNER_ID} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
          {!cameraError && (
            <div className="pointer-events-none absolute inset-6">
              <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-[#14a2ba]" />
              <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-[#14a2ba]" />
              <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-[#14a2ba]" />
              <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-[#14a2ba]" />
            </div>
          )}
          {!cameraError && torchSupported && (
            <button type="button" onClick={toggleTorch} aria-label={torchOn ? 'Matikan flash' : 'Nyalakan flash'}
              className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${torchOn ? 'bg-[#14a2ba] text-white' : 'bg-black/45 text-white hover:bg-black/60'}`}>
              <HugeiconsIcon icon={torchOn ? FlashlightIcon : FlashlightOffIcon} size={16} strokeWidth={2} />
            </button>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 px-6 text-center text-white">
              <HugeiconsIcon icon={BarCode01Icon} size={28} strokeWidth={1.5} />
              <p className="text-sm text-slate-200">{cameraError}</p>
            </div>
          )}
        </div>

        {!cameraError && (
          <div className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
            <HugeiconsIcon icon={Camera01Icon} size={14} strokeWidth={2} />
            <p>Arahkan kamera ke QR Code atau barcode. Hasil scan otomatis mengisi kolom SKU.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== FORM MODAL (Tambah & Edit) =====
function BarangFormModal({ item, onClose, onSaved }) {
  const { openViewer } = useImageViewer();
  const isEdit = Boolean(item);
  const [form, setForm] = useState({
    nama: item?.nama || '',
    sku: item?.sku || '',
    kategori: item?.kategori || '',
    status: item?.status || 'tersedia',
  });
  const [gambarFile, setGambarFile]   = useState(null);
  const [preview, setPreview]         = useState(item?.gambar || null);
  const [removeGambar, setRemoveGambar] = useState(false);
  const [errors, setErrors]           = useState({});
  const [saving, setSaving]           = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const fileRef = useRef();

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGambarFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoveGambar(false);
  };

  const handleRemoveImage = () => {
    setGambarFile(null);
    setPreview(null);
    setRemoveGambar(true);
  };

  const handleScanDetected = (decodedText) => {
    setForm((f) => ({ ...f, sku: decodedText }));
    setErrors((er) => ({ ...er, sku: '' }));
    setShowScanner(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.nama.trim())     errs.nama     = 'Nama wajib diisi';
    if (!form.sku.trim())      errs.sku      = 'SKU wajib diisi';
    if (!form.kategori.trim()) errs.kategori = 'Kategori wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('nama_barang', form.nama.trim());
      formData.append('qr_code', form.sku.trim().toUpperCase());
      formData.append('kategori', toSentenceCase(form.kategori));
      formData.append('status', form.status);
      if (gambarFile) {
        formData.append('gambar', gambarFile);
      } else if (isEdit && removeGambar) {
        formData.append('remove_gambar', 'true');
      }

      const url = isEdit
        ? `${import.meta.env.VITE_API_URL}/api/items/${item.id}`
        : `${import.meta.env.VITE_API_URL}/api/items`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan barang');

      const savedItem = {
        ...(isEdit ? item : {}),
        ...data.data,
        nama: data.data.nama_barang,
        sku: data.data.qr_code,
        gambar: data.data.gambar_url !== undefined ? data.data.gambar_url : item?.gambar,
      };
      onSaved(savedItem, !isEdit, data.message);
    } catch (err) {
      console.error(err);
      setErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14a2ba]/10 text-[#14a2ba]">
              <HugeiconsIcon icon={isEdit ? PencilEdit02Icon : Add01Icon} size={17} strokeWidth={1.75} />
            </div>
            <h2 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Barang' : 'Tambah Barang'}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="Tutup">
            <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2.5} />
          </button>
        </div>

        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {errors.api && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} strokeWidth={1.75} className="shrink-0" />
              {errors.api}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Barang</label>
            <input type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
              value={form.nama} onChange={handleChange('nama')} placeholder="Contoh: Proyektor Epson" />
            {errors.nama && <span className="mt-1 block text-xs text-red-500">{errors.nama}</span>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">SKU</label>
            <div className="flex items-stretch gap-2">
              <input type="text" className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                value={form.sku} onChange={handleChange('sku')} placeholder="Contoh: INV-0001" />
              <button type="button" onClick={() => setShowScanner(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-600 transition hover:border-[#14a2ba] hover:text-[#14a2ba]">
                <HugeiconsIcon icon={BarCode01Icon} size={16} strokeWidth={2} />
                Scan
              </button>
            </div>
            {errors.sku && <span className="mt-1 block text-xs text-red-500">{errors.sku}</span>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Kategori</label>
            <input type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
              value={form.kategori} onChange={handleChange('kategori')} placeholder="Contoh: Elektronik" />
            {errors.kategori && <span className="mt-1 block text-xs text-red-500">{errors.kategori}</span>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => {
                const config = STATUS_CONFIG[s];
                const active = form.status === s;
                return (
                  <button key={s} type="button"
                    onClick={() => { setForm((f) => ({ ...f, status: s })); if (errors.status) setErrors((er) => ({ ...er, status: '' })); }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium capitalize transition ${active ? 'border-[#14a2ba] bg-[#14a2ba]/5 text-[#14a2ba]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Foto Barang</label>
            {(() => {
              const resolvedSrc = preview
                ? preview.startsWith('http') || preview.startsWith('blob:')
                  ? preview
                  : `${import.meta.env.VITE_API_URL}${preview}`
                : null;
              return preview ? (
                <>
                  <button
                    type="button"
                    onClick={() => openViewer(resolvedSrc)}
                    className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    title="Klik untuk lihat gambar penuh"
                  >
                    <img
                      src={resolvedSrc}
                      alt="Preview"
                      className="max-h-72 w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
                      <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
                        Lihat penuh
                      </span>
                    </div>
                  </button>
                  <div className="mt-1.5 flex items-center gap-3">
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#14a2ba] hover:text-[#0f8298]"
                      onClick={() => fileRef.current?.click()}
                    >
                      Ganti foto
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                      onClick={handleRemoveImage}
                    >
                      Hapus foto
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-[#14a2ba] hover:bg-[#14a2ba]/5"
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-1.5 text-slate-400">
                    <HugeiconsIcon icon={ImageAdd02Icon} size={22} strokeWidth={1.5} />
                    <span className="text-xs font-medium text-slate-500">Tap untuk pilih foto</span>
                  </div>
                </button>
              );
            })()}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
          </div>

          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#14a2ba] py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#14a2ba]/25 transition hover:bg-[#0f8298] disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <div onClick={(e) => e.stopPropagation()}>
          <SkuScannerModal onClose={() => setShowScanner(false)} onDetected={handleScanDetected} />
        </div>
      )}
    </div>
  );
}