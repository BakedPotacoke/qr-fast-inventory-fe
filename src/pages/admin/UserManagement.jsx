import { useState, useEffect, useRef, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Add01Icon,
    PencilEdit02Icon,
    Delete02Icon,
    Search01Icon,
    Cancel01Icon,
    ViewIcon,
    ViewOffIcon,
    CheckmarkCircleIcon,
    AlertCircleIcon,
    Loading03Icon,
    UserGroupIcon,
    UserShield02Icon,
    UserIcon,
    SortByDown01Icon,
} from '@hugeicons/core-free-icons';
import Pagination from '../../components/Pagination';
import { showToast, showConfirm } from '../../utils/alert';

const DEFAULT_PAGE_LIMIT = 15;

const ROLE_OPTIONS = [
    { value: 'pegawai', label: 'Pegawai' },
    { value: 'admin', label: 'Admin' },
];

// Opsi urutan, disamakan dengan pola SORT_OPTIONS di Inventaris.jsx
const SORT_OPTIONS = [
    { key: 'terbaru', label: 'Terbaru Ditambahkan' },
    { key: 'terlama', label: 'Terlama Ditambahkan' },
    { key: 'az', label: 'Nama A-Z' },
    { key: 'za', label: 'Nama Z-A' },
];

// ===== ATURAN VALIDASI (selaras dengan PROFILE_RULES di Profil.jsx) =====
const USER_RULES = {
    nama_lengkap: (val) => {
        if (!val.trim()) return 'Nama lengkap wajib diisi.';
        if (val.trim().length < 2) return 'Nama lengkap minimal 2 karakter.';
        return '';
    },
    email: (val) => {
        if (!val.trim()) return 'Email wajib diisi.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Format email tidak valid.';
        return '';
    },
    role: (val) => {
        if (!val) return 'Role wajib dipilih.';
        if (!['admin', 'pegawai'].includes(val)) return 'Role hanya boleh Admin atau Pegawai.';
        return '';
    },
    // Password wajib saat tambah pengguna, opsional saat edit
    password: (val, allValues, mode) => {
        if (mode === 'create') {
            if (!val) return 'Password wajib diisi.';
            if (val.length < 8) return 'Password minimal 8 karakter.';
            return '';
        }
        if (!val) return '';
        if (val.length < 8) return 'Password minimal 8 karakter.';
        return '';
    },
    confirmPassword: (val, allValues, mode) => {
        const passwordRequired = mode === 'create' || !!allValues.password;
        if (!passwordRequired) return '';
        if (!val) return 'Konfirmasi password wajib diisi.';
        if (val !== allValues.password) return 'Konfirmasi password tidak cocok.';
        return '';
    },
};

function validateUserForm(fields, mode) {
    return {
        nama_lengkap: USER_RULES.nama_lengkap(fields.nama_lengkap),
        email: USER_RULES.email(fields.email),
        role: USER_RULES.role(fields.role),
        password: USER_RULES.password(fields.password, fields, mode),
        confirmPassword: USER_RULES.confirmPassword(fields.confirmPassword, fields, mode),
    };
}

function hasFormErrors(errors) {
    return Object.values(errors).some((msg) => msg !== '');
}

// ===== BADGE ROLE =====
function RoleBadge({ role }) {
    const isAdmin = role === 'admin';
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-3 text-xs font-semibold ring-1 ring-inset ${isAdmin ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
                }`}
        >
            <HugeiconsIcon icon={isAdmin ? UserShield02Icon : UserIcon} size={14} color="currentColor" strokeWidth={1.5} />
            {isAdmin ? 'Admin' : 'Pegawai'}
        </span>
    );
}

// ===== FORM MODAL (Tambah / Edit) =====
function UserFormModal({ mode, initialUser, onClose, onSaved }) {
    const [form, setForm] = useState({
        nama_lengkap: initialUser?.nama_lengkap || '',
        email: initialUser?.email || '',
        role: initialUser?.role || 'pegawai',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEdit = mode === 'edit';

    const handleChange = (e) => {
        const { name, value } = e.target;
        const nextForm = { ...form, [name]: value };
        setForm(nextForm);
        setTouched((prev) => ({ ...prev, [name]: true }));

        setErrors((prev) => {
            const next = { ...prev };
            if (USER_RULES[name]) {
                next[name] = USER_RULES[name](value, nextForm, mode);
            }
            // Password berubah -> validasi ulang konfirmasi password
            if (name === 'password') {
                next.confirmPassword = USER_RULES.confirmPassword(nextForm.confirmPassword, nextForm, mode);
            }
            return next;
        });
        setServerError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ nama_lengkap: true, email: true, role: true, password: true, confirmPassword: true });

        const allErrors = validateUserForm(form, mode);
        setErrors(allErrors);
        if (hasFormErrors(allErrors)) return;

        setLoading(true);
        setServerError('');
        try {
            const token = localStorage.getItem('token');
            const endpoint = isEdit ? `${import.meta.env.VITE_API_URL}/api/users/${initialUser.id}` : `${import.meta.env.VITE_API_URL}/api/users`;
            const method = isEdit ? 'PUT' : 'POST';

            const body = {
                nama_lengkap: form.nama_lengkap.trim(),
                email: form.email,
                role: form.role,
                ...(form.password ? { password: form.password } : {}),
            };

            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const result = await res.json();

            if (!res.ok) {
                setServerError(result.message || 'Gagal menyimpan data pengguna.');
                setLoading(false);
                return;
            }

            onSaved(result.data, isEdit ? 'edit' : 'add', result.message);
        } catch (err) {
            console.error('Save user error:', err);
            setServerError('Terjadi kesalahan, coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const fieldError = (name) => (touched[name] && errors[name] ? errors[name] : '');
    const isInvalid = (name) => !!(touched[name] && errors[name]);

    const inputBase =
        'w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:ring-2';
    const inputState = (name) =>
        isInvalid(name)
            ? 'border-red-300 bg-red-50 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-200 placeholder-slate-400 focus:border-[#14a2ba] focus:ring-[#14a2ba]/20';

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">
                        {isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
                    </button>
                </div>

                {serverError && (
                    <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                        <HugeiconsIcon icon={AlertCircleIcon} size={18} strokeWidth={2} className="shrink-0" />
                        <p>{serverError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Nama Lengkap */}
                    <div>
                        <label htmlFor="nama_lengkap" className="mb-1.5 block text-xs font-semibold text-slate-500">
                            Nama Lengkap
                        </label>
                        <input
                            id="nama_lengkap"
                            type="text"
                            name="nama_lengkap"
                            value={form.nama_lengkap}
                            onChange={handleChange}
                            autoComplete="name"
                            className={`${inputBase} ${inputState('nama_lengkap')}`}
                            placeholder="Nama lengkap"
                        />
                        {fieldError('nama_lengkap') && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError('nama_lengkap')}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-500">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            className={`${inputBase} ${inputState('email')}`}
                            placeholder="Email"
                        />
                        {fieldError('email') && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError('email')}</p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label htmlFor="role" className="mb-1.5 block text-xs font-semibold text-slate-500">
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className={`${inputBase} bg-white ${inputState('role')}`}
                        >
                            {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {fieldError('role') && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError('role')}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-500">
                            Password {isEdit && <span className="font-normal text-slate-400">(opsional)</span>}
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                className={`${inputBase} pr-10 ${inputState('password')}`}
                                placeholder={isEdit ? 'Kosongkan jika tidak ingin ganti' : 'Minimal 8 karakter'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={17} strokeWidth={2} />
                            </button>
                        </div>
                        {fieldError('password') && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError('password')}</p>
                        )}
                    </div>

                    {/* Konfirmasi password: wajib saat tambah, atau saat edit jika password diisi */}
                    {(mode === 'create' || form.password) && (
                        <div>
                            <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-slate-500">
                                Konfirmasi Password
                            </label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                className={`${inputBase} ${inputState('confirmPassword')}`}
                                placeholder="Ulangi password"
                            />
                            {fieldError('confirmPassword') && (
                                <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError('confirmPassword')}</p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-2xl bg-[#14a2ba] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0f8ba0] disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} className="animate-spin" />
                                    Menyimpan...
                                </span>
                            ) : (
                                'Simpan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===== MODAL KONFIRMASI HAPUS =====
function DeleteConfirmModal({ targetUser, onClose, onConfirmed }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${targetUser.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();

            if (!res.ok) {
                setError(result.message || 'Gagal menghapus pengguna.');
                setLoading(false);
                return;
            }

            onConfirmed(targetUser.id, result.message);
        } catch (err) {
            console.error('Delete user error:', err);
            setError('Terjadi kesalahan, coba lagi.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-bold text-slate-800">Hapus Pengguna?</h2>
                <p className="mt-2 text-sm text-slate-500">
                    Anda akan menghapus akun{' '}
                    <span className="font-semibold text-slate-700">{targetUser.nama_lengkap}</span> (
                    {targetUser.email}). Tindakan ini tidak dapat dibatalkan.
                </p>

                {error && (
                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                        <HugeiconsIcon icon={AlertCircleIcon} size={18} strokeWidth={2} className="shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} className="animate-spin" />
                                Menghapus...
                            </span>
                        ) : (
                            'Hapus'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== ROW PENGGUNA (baris tabel) =====
function UserRow({ item, index, isSelf, onEdit, onDelete }) {
    const inisial = item.nama_lengkap?.charAt(0).toUpperCase() || 'U';
    return (
        <tr className="transition-colors hover:bg-slate-50/70">
            <td className="px-4 py-2.5 text-slate-500">{index + 1}</td>
            <td className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6f6f9] text-sm font-bold text-[#14a2ba]">
                        {inisial}
                    </div>
                    <p className="truncate text-sm font-semibold text-slate-800">
                        {item.nama_lengkap} {isSelf && <span className="font-normal text-slate-400">(Anda)</span>}
                    </p>
                </div>
            </td>
            <td className="px-4 py-2.5 text-slate-600">{item.email}</td>
            <td className="px-4 py-2.5">
                <RoleBadge role={item.role} />
            </td>
            <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#14a2ba]/10 hover:text-[#14a2ba]"
                        aria-label="Edit pengguna"
                        title="Edit"
                    >
                        <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={1.75} />
                    </button>
                    {isSelf ? (
                        <span
                            className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg text-slate-300"
                            title="Anda tidak dapat menghapus akun sendiri"
                        >
                            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.75} />
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Hapus pengguna"
                            title="Hapus"
                        >
                            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.75} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ===== MAIN COMPONENT =====
export default function UserManagement({ currentUser }) {
    // ── Server-side data ─────────────────────────────────────────────────────
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageLimit, setPageLimit] = useState(DEFAULT_PAGE_LIMIT);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    // ── Stats — globalStats untuk stat cards, filteredStats untuk tab counts ─
    const [globalStats, setGlobalStats] = useState({ total: 0, admin: 0, pegawai: 0 });
    const [filteredStats, setFilteredStats] = useState({ total: 0, admin: 0, pegawai: 0 });

    // ── Filter state ─────────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('semua');
    const [sortBy, setSortBy] = useState('terbaru');
    const [successMsg, setSuccessMsg] = useState('');

    const [formModal, setFormModal] = useState(null); // { mode: 'create' | 'edit', user? }
    const [deleteTarget, setDeleteTarget] = useState(null);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    // ── Bangun URL fetch ─────────────────────────────────────────────────────
    const buildUrl = useCallback((page) => {
        const params = new URLSearchParams({ page, limit: pageLimit });
        if (roleFilter !== 'semua')       params.set('role', roleFilter);
        if (debouncedSearch && debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        params.set('sortBy', sortBy);
        return `${import.meta.env.VITE_API_URL}/api/users?${params.toString()}`;
    }, [roleFilter, debouncedSearch, sortBy, pageLimit]);

    // ── Fetch halaman pengguna ───────────────────────────────────────────────
    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        setLoadError('');
        try {
            const res = await fetch(buildUrl(page), { headers: authHeaders() });
            const result = await res.json();

            if (!res.ok) {
                setLoadError(result.message || 'Gagal memuat data pengguna.');
                return;
            }

            setUsers(result.data || []);
            setPagination(result.pagination || null);
        } catch (err) {
            console.error('Fetch users error:', err);
            setLoadError('Tidak dapat terhubung ke server.');
        } finally {
            setLoading(false);
        }
    }, [buildUrl, authHeaders]);

    // ── Fetch stats global (tanpa filter) — sekali saat mount & setelah mutasi
    const fetchGlobalStats = useCallback(async () => {
        try {
            const headers = authHeaders();
            const base = `${import.meta.env.VITE_API_URL}/api/users`;
            const [totalRes, adminRes, pegawaiRes] = await Promise.all([
                fetch(`${base}?page=1&limit=1`, { headers }),
                fetch(`${base}?page=1&limit=1&role=admin`, { headers }),
                fetch(`${base}?page=1&limit=1&role=pegawai`, { headers }),
            ]);
            const [totalBody, adminBody, pegawaiBody] = await Promise.all([
                totalRes.json(), adminRes.json(), pegawaiRes.json(),
            ]);
            setGlobalStats({
                total:   totalBody.pagination?.total   ?? 0,
                admin:   adminBody.pagination?.total   ?? 0,
                pegawai: pegawaiBody.pagination?.total ?? 0,
            });
        } catch {
            // Stats tidak kritis — gagal diam-diam
        }
    }, [authHeaders]);

    // ── Fetch stats terfilter (berdasarkan kata kunci pencarian) ──────────────
    const fetchFilteredStats = useCallback(async ({ search: q } = {}) => {
        try {
            const headers = authHeaders();
            const base = `${import.meta.env.VITE_API_URL}/api/users`;

            const buildParams = (role) => {
                const params = new URLSearchParams({ page: 1, limit: 1 });
                if (role && role !== 'semua') params.set('role', role);
                if (q    && q.trim())         params.set('search', q.trim());
                return params.toString();
            };

            const [totalRes, adminRes, pegawaiRes] = await Promise.all([
                fetch(`${base}?${buildParams()}`, { headers }),
                fetch(`${base}?${buildParams('admin')}`, { headers }),
                fetch(`${base}?${buildParams('pegawai')}`, { headers }),
            ]);
            const [totalBody, adminBody, pegawaiBody] = await Promise.all([
                totalRes.json(), adminRes.json(), pegawaiRes.json(),
            ]);
            setFilteredStats({
                total:   totalBody.pagination?.total   ?? 0,
                admin:   adminBody.pagination?.total   ?? 0,
                pegawai: pegawaiBody.pagination?.total ?? 0,
            });
        } catch {
            // Stats tidak kritis — gagal diam-diam
        }
    }, [authHeaders]);

    // Debounce input search (500 ms) sebelum mengubah debouncedSearch
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch data saat currentPage, roleFilter, debouncedSearch, sortBy, atau pageLimit berubah
    useEffect(() => {
        fetchUsers(currentPage);
    }, [currentPage, roleFilter, debouncedSearch, sortBy, pageLimit, fetchUsers]);

    // Fetch stats global saat mount
    useEffect(() => {
        fetchGlobalStats();
    }, [fetchGlobalStats]);

    // Fetch stats terfilter saat debouncedSearch berubah
    useEffect(() => {
        fetchFilteredStats({ search: debouncedSearch });
    }, [debouncedSearch, fetchFilteredStats]);

    // ── Sort sudah dilakukan server-side — langsung pakai users ─────────────
    const filteredUsers = users;

    const flashSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleSaved = (savedUser, mode, message) => {
        setFormModal(null);
        if (mode === 'edit') {
            setUsers((prev) => prev.map((u) => (u.id === savedUser.id ? { ...u, ...savedUser } : u)));
        } else {
            setCurrentPage(1);
            fetchUsers(1);
        }
        showToast.success(message || (mode === 'edit' ? 'Pengguna berhasil diperbarui.' : 'Pengguna berhasil ditambahkan.'));
        fetchGlobalStats();
        fetchFilteredStats({ search: debouncedSearch });
    };

    const handleDeleted = (id, message) => {
        setDeleteTarget(null);
        showToast.success(message || 'Pengguna berhasil dihapus.');
        // Refresh halaman aktif; mundur 1 halaman jika halaman sekarang jadi kosong
        const nextPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(nextPage);
        fetchUsers(nextPage);
        fetchGlobalStats();
        fetchFilteredStats({ search: debouncedSearch });
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLimitChange = (newLimit) => {
        setPageLimit(newLimit);
        setCurrentPage(1);
    };

    // ── Handler filter role ──────────────────────────────────────────────────
    const handleRoleFilterChange = (key) => {
        setRoleFilter(key);
        setCurrentPage(1);
    };

    // Tab filter role — count dari filteredStats agar akurat sesuai pencarian
    const roleFilters = [
        { key: 'semua',   label: 'Semua',   count: filteredStats.total },
        { key: 'admin',   label: 'Admin',   count: filteredStats.admin },
        { key: 'pegawai', label: 'Pegawai', count: filteredStats.pegawai },
    ];

    // Kartu statistik, disamakan dengan pola StatCard di Dashboard.jsx, Inventaris.jsx & Transaksi.jsx
    const stats = [
        { key: 'total',   label: 'Total Pengguna', value: globalStats.total,   icon: UserGroupIcon,   iconWrap: 'bg-[#14a2ba]/10 text-[#14a2ba] ring-[#14a2ba]/30' },
        { key: 'admin',   label: 'Admin',           value: globalStats.admin,   icon: UserShield02Icon, iconWrap: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
        { key: 'pegawai', label: 'Pegawai',          value: globalStats.pegawai, icon: UserIcon,        iconWrap: 'bg-slate-100 text-slate-600 ring-slate-200' },
    ];

    return (
        <div>
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Pengguna</h1>
                <p className="mt-1 text-sm text-slate-500">Atur akun pengguna dan akses sistem</p>
            </div>

            {/* Banner sukses */}
            {successMsg && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#14a2ba]/10 p-4 text-sm text-[#0b6577] ring-1 ring-[#14a2ba]/30">
                    <HugeiconsIcon icon={CheckmarkCircleIcon} size={18} strokeWidth={2} className="shrink-0" />
                    <p>{successMsg}</p>
                </div>
            )}

            {/* Banner error load */}
            {loadError && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                    <HugeiconsIcon icon={AlertCircleIcon} size={18} strokeWidth={2} className="shrink-0" />
                    <p>{loadError}</p>
                </div>
            )}

            {/* STAT CARDS */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((s) => (
                    <div key={s.key} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

            {/* TOOLBAR: SEARCH + URUTKAN + TAMBAH */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau email..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => { setSearch(''); setDebouncedSearch(''); setCurrentPage(1); }}
                                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                                aria-label="Hapus pencarian"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>

                    <div className="relative shrink-0">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <HugeiconsIcon icon={SortByDown01Icon} size={15} strokeWidth={2} />
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                            aria-label="Urutkan"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Limit Baris Per Halaman */}
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

                    <button
                        type="button"
                        onClick={() => setFormModal({ mode: 'create' })}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#14a2ba] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#14a2ba]/25 transition hover:bg-[#0f8298] active:scale-[0.98]"
                    >
                        <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2.5} />
                        Tambah Pengguna
                    </button>
                </div>

                {/* TABS FILTER ROLE */}
                <div className="mt-3 flex items-center gap-2 overflow-x-auto pt-0.5 pb-0.5">
                    {roleFilters.map((f) => {
                        const active = roleFilter === f.key;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => handleRoleFilterChange(f.key)}
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

            {/* TABLE PENGGUNA */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center gap-2 p-14 text-slate-400">
                        <HugeiconsIcon icon={Loading03Icon} size={22} strokeWidth={2} className="animate-spin text-[#14a2ba]" />
                        <span className="text-sm">Memuat data pengguna...</span>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-14 text-center text-slate-400">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                            <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.75} />
                        </div>
                        <p className="text-sm">{search ? 'Tidak ada pengguna yang cocok.' : 'Belum ada data pengguna.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-slate-500">
                                <tr>
                                    <th className="w-12 px-4 py-3 text-xs font-semibold uppercase tracking-wide">No</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Nama Lengkap</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Email</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Role</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((item, index) => (
                                    <UserRow
                                        key={item.id}
                                        item={item}
                                        index={pagination ? (pagination.page - 1) * pagination.limit + index : index}
                                        isSelf={String(item.id) === String(currentUser?.id)}
                                        onEdit={(u) => setFormModal({ mode: 'edit', user: u })}
                                        onDelete={(u) => setDeleteTarget(u)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PAGINATION */}
            {!loading && !loadError && (
                <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                />
            )}

            {formModal && (
                <UserFormModal
                    mode={formModal.mode}
                    initialUser={formModal.user}
                    onClose={() => setFormModal(null)}
                    onSaved={(savedUser) => handleSaved(savedUser, formModal.mode)}
                />
            )}

            {deleteTarget && (
                <DeleteConfirmModal
                    targetUser={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirmed={handleDeleted}
                />
            )}
        </div>
    );
}