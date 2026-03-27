export default function SeasonTrend({ seasons }) {
  const maxRuns = Math.max(...seasons.map((season) => season.runs), 1);

  return (
    <div className="rounded-[24px] bg-slate-950/60 p-5 ring-1 ring-white/10">
      <h4 className="text-xl font-semibold text-white">Run trend</h4>
      <p className="mt-1 text-sm text-slate-400">A quick visual of batting output across IPL seasons.</p>
      <div className="mt-5 flex items-end gap-2 overflow-x-auto pb-2">
        {seasons.map((season) => (
          <div key={season.season} className="flex min-w-[52px] flex-col items-center gap-2">
            <div className="flex h-40 items-end">
              <div
                className="w-9 rounded-t-2xl bg-gradient-to-t from-accent-500 to-brand-500"
                style={{ height: `${Math.max((season.runs / maxRuns) * 160, 8)}px` }}
              />
            </div>
            <div className="text-xs text-slate-400">{season.season}</div>
            <div className="text-sm font-semibold text-white">{season.runs}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
