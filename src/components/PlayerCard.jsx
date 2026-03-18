import clsx from 'clsx';
import { ChevronRight, Shield, Swords, Trophy } from 'lucide-react';

export default function PlayerCard({ player, active, onClick }) {
  return (
    <button onClick={onClick} className={clsx('w-full rounded-[24px] p-4 text-left transition-all duration-200', active ? 'bg-brand-500/20 ring-2 ring-brand-500/60' : 'bg-slate-950/60 ring-1 ring-white/10 hover:-translate-y-1 hover:bg-white/10')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-white">{player.playerName}</div>
          <div className="mt-1 text-sm text-slate-400">{player.team} · {player.role}</div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 text-slate-500" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric icon={Trophy} label="Runs" value={player.career.runs} />
        <Metric icon={Shield} label="Wickets" value={player.career.wickets} />
        <Metric icon={Swords} label="Matches" value={player.career.matches} />
      </div>
    </button>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Icon className="h-4 w-4" /> {label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
