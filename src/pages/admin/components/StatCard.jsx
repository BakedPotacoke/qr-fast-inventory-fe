import { HugeiconsIcon } from '@hugeicons/react';

const toneClasses = {
  primary: 'bg-[#14a2ba]/10 text-[#14a2ba] ring-[#14a2ba]/30',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function StatCard({ label, value, count, icon, tone = 'primary', iconWrap, className = '' }) {
  const displayValue = value !== undefined ? value : (count !== undefined ? count : 0);
  const toneStyle = iconWrap || toneClasses[tone] || toneClasses.primary;

  return (
    <div className={`flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${toneStyle}`}>
        <HugeiconsIcon icon={icon} size={20} color="currentColor" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-2xl font-semibold leading-none text-slate-800">{displayValue}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
