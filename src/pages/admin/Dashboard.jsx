import React, { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area,
} from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PackageIcon,
  UserGroupIcon,
  RepeatIcon,
  Alert01Icon,
  Clock01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";

// Konvensi disamakan dengan file lain di project (lihat Beranda.jsx):
// selalu `${VITE_API_URL}/api/...`, bukan VITE_API_URL yang sudah mengandung /api.
const getToken = () => localStorage.getItem("token");

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Minggu
  const sun = new Date(d); sun.setDate(d.getDate() - day);
  const sat = new Date(d); sat.setDate(d.getDate() + (6 - day));
  return { from: toDateKey(sun), to: toDateKey(sat) };
}

function getMonthRange(date) {
  const d = new Date(date);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: toDateKey(first), to: toDateKey(last) };
}

function getYearRange(date) {
  const d = new Date(date);
  const first = new Date(d.getFullYear(), 0, 1);
  const last = new Date(d.getFullYear(), 11, 31);
  return { from: toDateKey(first), to: toDateKey(last) };
}

async function fetchSummary({ from, to } = {}) {
  let url = `${import.meta.env.VITE_API_URL}/api/dashboard/summary`;
  if (from && to) url += `?date_from=${from}&date_to=${to}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Gagal memuat ringkasan dashboard.");
  }
  const json = await res.json();
  return json.data;
}

const STATUS_LABEL = { tersedia: "Tersedia", dipinjam: "Dipinjam", rusak: "Rusak", hilang: "Hilang" };
const STATUS_COLOR = { tersedia: "#0F6E56", dipinjam: "#185FA5", rusak: "#854F0B", hilang: "#A32D2D" };
const LAPORAN_LABEL = { baik: "Baik", rusak: "Rusak", hilang: "Hilang" };
const LAPORAN_COLOR = { baik: "#0F6E56", rusak: "#854F0B", hilang: "#A32D2D" };

const toDateKey = (d) => d.toISOString().slice(0, 10);

// compact=true → bulan saja ("Jan"), untuk range > 14 hari agar X-axis tidak cramped
const formatTanggal = (d, compact = false) =>
  d.toLocaleDateString("id-ID", compact
    ? { month: "short" }
    : { day: "2-digit", month: "short" }
  );

function diffDays(from, to) {
  return Math.round((new Date(to) - new Date(from)) / 86_400_000);
}

// Hasilkan array tanggal dari from..to (inklusif)
function daysInRange(from, to) {
  const days = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
};

function StatCard({ label, value, icon, tone }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClasses[tone]}`}>
        <HugeiconsIcon icon={icon} size={20} color="currentColor" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-800 leading-none">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function LegendRow({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="mt-4 text-sm text-slate-400">Belum ada data.</p>;
  return (
    <div className="mt-4 space-y-2">
      {data.map((d) => (
        <div key={d.name} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="text-slate-600">{d.name}</span>
          </div>
          <span className="font-medium text-slate-700">
            {d.value} <span className="text-slate-400">({Math.round((d.value / total) * 100)}%)</span>
          </span>
        </div>
      ))}
    </div>
  );
}

const PRESETS = [
  { label: "Minggu Ini", key: "week" },
  { label: "Bulan Ini", key: "month" },
  { label: "Tahun Ini", key: "year" },
];

function DateRangePicker({ range, onChange, error }) {
  const now = new Date();
  const presetRanges = {
    week: getWeekRange(now),
    month: getMonthRange(now),
    year: getYearRange(now),
  };

  const activePreset = PRESETS.find(
    (p) => range.from === presetRanges[p.key].from && range.to === presetRanges[p.key].to
  );

  const setPreset = (key) => onChange(presetRanges[key]);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${activePreset?.key === p.key
              ? "bg-[#14a2ba] text-white shadow-sm shadow-[#14a2ba]/30"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            {p.label}
          </button>
        ))}
        <div className={`flex shrink-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 border ${error ? "border-red-400" : "border-slate-200"}`}>
          <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
          <input
            type="date"
            value={range.from}
            onChange={(e) => onChange({ ...range, from: e.target.value })}
            className="bg-transparent text-sm text-slate-600 outline-none"
          />
          <span className="text-sm text-slate-400">-</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => onChange({ ...range, to: e.target.value })}
            className="bg-transparent text-sm text-slate-600 outline-none"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(() => getWeekRange(new Date()));
  const [rangeError, setRangeError] = useState(null);

  const handleRangeChange = (next) => {
    if (next.from && next.to && next.from > next.to) {
      setRangeError("Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
      setRange(next);
      return;
    }
    setRangeError(null);
    setRange(next);
  };

  useEffect(() => {
    if (rangeError || !range.from || !range.to) return;

    let active = true;
    setError(null);

    fetchSummary(range)
      .then((data) => { if (active) setSummary(data); })
      .catch((err) => { if (active) setError(err.message); });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Admin</h1>
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const inv = summary?.inventory ?? {};

  const itemStatusData = ["tersedia", "dipinjam", "rusak", "hilang"].map((key) => ({
    key,
    name: STATUS_LABEL[key],
    value: Number(
      key === "tersedia" ? inv.tersedia :
        key === "dipinjam" ? inv.sedangDipinjam :
          key === "rusak" ? inv.jumlahRusak :
            inv.jumlahHilang
    ) || 0,
    color: STATUS_COLOR[key],
  }));

  const kategoriRaw = (summary?.kategoriBreakdown ?? []).map((k) => ({
    kategori: k.kategori,
    jumlah: Number(k.jumlah),
  }));
  const kategoriMax = Math.max(0, ...kategoriRaw.map((k) => k.jumlah));
  const kategoriData = kategoriRaw.map((k) => ({
    ...k,
    fill: k.jumlah === kategoriMax && kategoriMax > 0 ? "#14a2ba" : "#0F6E56",
  }));

  const rangeDays = diffDays(range.from, range.to);
  const compactLabel = rangeDays > 14;
  const trenMap = new Map(
    (summary?.trenPeminjaman ?? []).map((t) => [new Date(t.tanggal).toISOString().slice(0, 10), Number(t.jumlah)])
  );
  const trenPeminjaman = daysInRange(range.from, range.to).map((d) => ({
    tanggal: toDateKey(d),                              // unik — dipakai recharts sebagai identifier
    label: formatTanggal(d, compactLabel),            // display-only, dipakai XAxis tickFormatter
    jumlah: trenMap.get(toDateKey(d)) ?? 0,
  }));

  const laporanData = (summary?.laporanBreakdown ?? []).map((l) => ({
    name: LAPORAN_LABEL[l.jenis_laporan] ?? l.jenis_laporan,
    value: Number(l.jumlah),
    color: LAPORAN_COLOR[l.jenis_laporan] ?? "#5F5E5A",
  }));

  const topBarangRaw = (summary?.topBarang ?? []).map((b) => ({
    nama: b.nama_barang,
    dipinjam: Number(b.dipinjam),
  }));
  const topBarangMax = Math.max(0, ...topBarangRaw.map((b) => b.dipinjam));
  const topBarang = topBarangRaw.map((b) => ({
    ...b,
    fill: b.dipinjam === topBarangMax && topBarangMax > 0 ? "#14a2ba" : "#534AB7",
  }));

  const stats = [
    { label: "Total Barang", value: inv.totalBarang ?? 0, icon: PackageIcon, tone: "blue" },
    { label: "Total Pengguna", value: summary?.totalPengguna ?? 0, icon: UserGroupIcon, tone: "purple" },
    { label: "Transaksi Aktif", value: summary?.transaksiAktif ?? 0, icon: RepeatIcon, tone: "amber" },
    { label: "Laporan 30 Hari Terakhir", value: summary?.laporanTerbaru ?? 0, icon: Alert01Icon, tone: "red" },
  ];

  const trenSubtitle = `Jumlah transaksi baru per hari (${rangeDays + 1} hari, ${range.from} – ${range.to})`;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan aktivitas dan statistik sistem</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Filter rentang waktu untuk grafik di bawah</p>
        <DateRangePicker range={range} onChange={handleRangeChange} error={rangeError} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card title="Status barang" subtitle="Distribusi kondisi seluruh item">
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={itemStatusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2} stroke="none">
                      {itemStatusData.map((d) => <Cell key={d.key} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <LegendRow data={itemStatusData} />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card title="Tren peminjaman" subtitle={trenSubtitle}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trenPeminjaman} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="colorTren" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#185FA5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#185FA5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f4" />
                  <XAxis
                    dataKey="tanggal"
                    tickFormatter={(iso) => {
                      // iso = "YYYY-MM-DD" — parse as local midnight to avoid UTC-shift
                      const [y, m, d] = iso.split("-").map(Number);
                      return formatTanggal(new Date(y, m - 1, d), compactLabel);
                    }}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    interval={compactLabel ? "preserveStartEnd" : 0}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(iso) => {
                      const [y, m, d] = iso.split("-").map(Number);
                      return new Date(y, m - 1, d).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
                    }}
                  />
                  <Area type="monotone" dataKey="jumlah" stroke="#185FA5" strokeWidth={2} fill="url(#colorTren)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card title="Barang per kategori" subtitle="Jumlah item terdaftar tiap kategori">
            <div style={{ height: Math.max(224, kategoriData.length * 44), maxHeight: 480, overflowY: "auto" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kategoriData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef1f4" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="kategori" width={90} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} interval={0} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="jumlah" radius={[0, 4, 4, 0]} barSize={16}>
                    {kategoriData.map((d) => (
                      <Cell key={d.kategori} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Jenis laporan kondisi" subtitle="Hasil pengembalian barang">
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={laporanData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2} stroke="none">
                      {laporanData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <LegendRow data={laporanData} />
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card title="Barang paling sering dipinjam" subtitle="Top 5 berdasarkan jumlah transaksi">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBarang} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef1f4" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nama" width={140} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="dipinjam" radius={[0, 4, 4, 0]} barSize={16}>
                  {topBarang.map((b) => (
                    <Cell key={b.nama} fill={b.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}