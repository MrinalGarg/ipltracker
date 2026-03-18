export default function SeasonTable({ seasons }) {
  return (
    <div className="overflow-hidden rounded-[24px] bg-slate-950/60 ring-1 ring-white/10">
      <div className="border-b border-white/10 px-5 py-4">
        <h4 className="text-xl font-semibold text-white">Season-by-season breakdown</h4>
        <p className="text-sm text-slate-400">Batting, bowling, and fielding output for every IPL campaign.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Season</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Mat</th>
              <th className="px-4 py-3">Runs</th>
              <th className="px-4 py-3">SR</th>
              <th className="px-4 py-3">HS</th>
              <th className="px-4 py-3">Wkts</th>
              <th className="px-4 py-3">Eco</th>
              <th className="px-4 py-3">BBI</th>
              <th className="px-4 py-3">Cts</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season) => (
              <tr key={season.season} className="border-t border-white/5">
                <td className="px-4 py-3 font-semibold text-white">{season.season}</td>
                <td className="px-4 py-3">{season.teams.join(', ')}</td>
                <td className="px-4 py-3">{season.matches}</td>
                <td className="px-4 py-3">{season.runs}</td>
                <td className="px-4 py-3">{season.strikeRate}</td>
                <td className="px-4 py-3">{season.highestScore}</td>
                <td className="px-4 py-3">{season.wickets}</td>
                <td className="px-4 py-3">{season.economy}</td>
                <td className="px-4 py-3">{season.bestBowling}</td>
                <td className="px-4 py-3">{season.catches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
