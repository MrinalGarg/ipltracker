import { Crown, Shield, Zap } from 'lucide-react';

const iconMap = {
  runs: Crown,
  wickets: Shield,
  strikeRate: Zap,
};

export default function Leaderboard({ title, statKey, items, formatter = (value) => value }) {
  const Icon = iconMap[statKey] ?? Crown;

  return (
    <div className="rounded-[24px] bg-slate-950/60 p-4 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
        <Icon className="h-4 w-4 text-accent-400" />
        {title}
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={item.playerSlug} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div>
              <div className="text-sm text-slate-400">#{index + 1}</div>
              <div className="font-semibold text-white">{item.playerName}</div>
              <div className="text-sm text-slate-400">{item.team}</div>
            </div>
            <div className="text-right text-lg font-bold text-white">{formatter(item.career[statKey])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
