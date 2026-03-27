export default function StatChip({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-sm text-slate-300"><Icon className="h-4 w-4 text-accent-400" /> {label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{helper}</div>
    </div>
  );
}
