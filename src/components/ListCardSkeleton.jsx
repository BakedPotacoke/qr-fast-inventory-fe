import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * ListCardSkeleton
 * Skeleton generik untuk item list berbentuk "card" dengan pola:
 * [thumbnail] [judul] [subjudul] [badge opsional]
 *
 * Dipakai di banyak halaman (Inventaris, Peminjaman, Pengguna, dll)
 * cukup dengan mengatur props-nya, tanpa perlu bikin skeleton baru
 * tiap kali ada page baru.
 *
 * Contoh pakai:
 *   <SkeletonList count={6}>
 *     <ListCardSkeleton showBadge thumbnailShape="square" />
 *   </SkeletonList>
 */
export function ListCardSkeleton({
  thumbnailSize = 64,      // px, ukuran thumbnail/avatar
  thumbnailShape = 'square', // 'square' | 'circle'
  lines = 2,                // jumlah baris teks (judul + subjudul, dst)
  showBadge = true,         // tampilkan placeholder badge/pill
  className = '',
}) {
  return (
    <div
      className={`flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 ${className}`}
    >
      {thumbnailSize > 0 && (
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: thumbnailSize,
            height: thumbnailSize,
            borderRadius: thumbnailShape === 'circle' ? '9999px' : '0.75rem',
          }}
        >
          <Skeleton height="100%" width="100%" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={i > 0 ? 'mt-1.5' : ''}>
            <Skeleton width={i === 0 ? '70%' : '35%'} height={i === 0 ? 15 : 12} />
          </div>
        ))}

        {showBadge && (
          <div className="mt-2">
            <Skeleton width={90} height={22} borderRadius={999} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * TransactionCardSkeleton
 * Skeleton generik untuk card yang lebih kompleks dengan pola:
 * [icon] [judul] [subjudul] ... [badge]
 * ---------------------------------------
 * [grid info label/value, N kolom]
 *
 * Cocok untuk card seperti riwayat transaksi, detail peminjaman, dll —
 * yang punya header + divider + beberapa pasang label/value di bawahnya.
 *
 * Contoh pakai:
 *   <SkeletonList count={4}>
 *     <TransactionCardSkeleton columns={3} />
 *   </SkeletonList>
 */
export function TransactionCardSkeleton({
  columns = 2,     // jumlah kolom info di grid bawah
  rows = 1,        // jumlah baris grid (biasanya 1, isi otomatis wrap kalau columns kecil)
  className = '',
}) {
  const cellCount = columns * rows;

  return (
    <div
      className={`w-full rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 ${className}`}
    >
      {/* Header: icon + nama + badge */}
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl">
          <Skeleton height="100%" width="100%" />
        </div>
        <div className="min-w-0 flex-1">
          <Skeleton width="55%" height={14} />
          <div className="mt-1.5">
            <Skeleton width="30%" height={11} />
          </div>
        </div>
        <div className="shrink-0">
          <Skeleton width={90} height={22} borderRadius={999} />
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 h-px w-full bg-slate-100" />

      {/* Info grid */}
      <div
        className="grid gap-x-4 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cellCount }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton width="60%" height={9} />
            <Skeleton width="80%" height={13} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * InlineCardSkeleton
 * Skeleton generik untuk row dengan pola:
 * [thumbnail] [judul] [subjudul] ......... [tombol aksi 1] [tombol aksi 2]
 *
 * Beda dari ListCardSkeleton: badge diganti dengan satu/lebih placeholder
 * tombol aksi yang ditempel di sisi kanan (bukan di bawah teks).
 * Cocok untuk row seperti "Sedang Kamu Pinjam" di Beranda, atau list apapun
 * yang barisnya diakhiri dengan tombol/ikon aksi.
 *
 * Contoh pakai:
 *   <SkeletonList count={3}>
 *     <InlineCardSkeleton
 *       thumbnailSize={48}
 *       actions={[{ width: 36, height: 36, borderRadius: 10 }, { width: 140, height: 36, borderRadius: 10 }]}
 *       className="rounded-xl border border-slate-200 bg-white p-4"
 *     />
 *   </SkeletonList>
 */
export function InlineCardSkeleton({
  thumbnailSize = 48,
  thumbnailShape = 'square',
  lines = 2,
  actions = [{ width: 36, height: 36, borderRadius: 10 }], // array of { width, height, borderRadius }
  className = 'rounded-xl border border-slate-200 bg-white p-4',
}) {
  return (
    <div className={`flex w-full items-center justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        {thumbnailSize > 0 && (
          <div
            className="shrink-0 overflow-hidden"
            style={{
              width: thumbnailSize,
              height: thumbnailSize,
              borderRadius: thumbnailShape === 'circle' ? '9999px' : '0.625rem',
            }}
          >
            <Skeleton height="100%" width="100%" />
          </div>
        )}

        <div className="min-w-0">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className={i > 0 ? 'mt-1.5' : ''}>
              <Skeleton width={i === 0 ? 120 : 80} height={i === 0 ? 14 : 12} />
            </div>
          ))}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex shrink-0 items-center gap-2">
          {actions.map((a, i) => (
            <Skeleton
              key={i}
              width={a.width}
              height={a.height}
              borderRadius={a.borderRadius ?? 8}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SkeletonList
 * Wrapper untuk mengulang skeleton sebanyak `count`, sekaligus
 * membungkusnya dengan SkeletonTheme agar warna animasi konsisten
 * di seluruh aplikasi. Cukup sekali dipakai di root/layout,
 * atau di tiap page seperti contoh di bawah.
 *
 * Contoh pakai:
 *   {loading ? (
 *     <SkeletonList count={6}>
 *       <ListCardSkeleton />
 *     </SkeletonList>
 *   ) : ( ...konten asli... )}
 */
export function SkeletonList({ count = 6, children, baseColor = '#f1f5f9', highlightColor = '#f8fafc' }) {
  return (
    <SkeletonTheme baseColor={baseColor} highlightColor={highlightColor}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{children}</div>
      ))}
    </SkeletonTheme>
  );
}