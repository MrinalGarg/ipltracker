import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, BadgeIndianRupee, Flame, Search, Shield, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import PlayerCard from './components/PlayerCard';
import StatChip from './components/StatChip';
import SeasonTable from './components/SeasonTable';

const sortOptions = [
  { value: 'runs', label: 'Most runs' },
  { value: 'wickets', label: 'Most wickets' },
  { value: 'strikeRate', label: 'Best strike rate' },
  { value: 'economy', label: 'Best economy' },
  { value: 'matches', label: 'Most matches' }
];

export default function App() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState('all');
  const [sort, setSort] = useState('runs');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    loadData();
  }, [search, team, sort]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [playersResponse, summaryResponse] = await Promise.all([
        axios.get('/api/players', { params: { search, team, sort } }),
        axios.get('/api/summary')
      ]);
      setPlayers(playersResponse.data.players);
      setTeams(playersResponse.data.teams);
      setUpdatedAt(playersResponse.data.updatedAt);
      setSummary(summaryResponse.data);
      if (!selectedPlayer && playersResponse.data.players[0]) {
        setSelectedPlayer(playersResponse.data.players[0]);
      } else if (selectedPlayer) {
        const refreshed = playersResponse.data.players.find((player) => player.playerSlug === selectedPlayer.playerSlug);
        if (refreshed) setSelectedPlayer(refreshed);
      }
    } catch (err) {
      setError('Unable to load IPL player stats right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const heroStats = useMemo(() => {
    if (!summary) return [];
    return [
      { icon: Trophy, label: 'Tracked players', value: summary.totalPlayers },
      { icon: Flame, label: 'Run king', value: summary.topRuns?.[0]?.playerName ?? '—' },
      { icon: Shield, label: 'Wicket boss', value: summary.topWickets?.[0]?.playerName ?? '—' }
    ];
  }, [summary]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.35),_transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#020617_100%)] text-white">
      <section className="px-4 pb-10 pt-6 sm:px-5">
        <div className="mx-auto max-w-7xl space-y-6">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur md:p-8">
            <div className="grid gap-6 md:grid-cols-[1.4fr_0.9fr] md:items-end">
              <div className="space-y-4">
                <span className="inline-flex min-h-[44px] items-center rounded-full bg-accent-500/20 px-4 py-2 text-sm font-semibold text-amber-200">Live IPL archive powered by Cricsheet</span>
                <div className="space-y-3">
                  <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl">Track every IPL player across every season.</h1>
                  <p className="max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">Search the full IPL player pool, compare batting and bowling output, and dive into season-by-season trends from the league&apos;s historical ball-by-ball archive.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {heroStats.map((item) => (
                    <div key={item.label} className="min-h-[44px] rounded-2xl bg-white/10 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-300"><item.icon className="h-4 w-4 text-accent-400" /> {item.label}</div>
                      <div className="mt-1 text-lg font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] bg-slate-950/70 p-5 ring-1 ring-white/10">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatChip icon={Activity} label="Top strike rate" value={summary?.topStrikeRate?.[0]?.career?.strikeRate ? `${summary.topStrikeRate[0].career.strikeRate}` : '—'} helper={summary?.topStrikeRate?.[0]?.playerName ?? 'Loading'} />
                  <StatChip icon={BadgeIndianRupee} label="Data refresh" value={updatedAt ? format(new Date(updatedAt), 'dd MMM yyyy') : 'Syncing'} helper="Weekly auto-refresh" />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Player explorer</h2>
                  <p className="text-slate-400">Filter by team, search by name, and sort by the stat that matters most.</p>
                </div>
                <button onClick={loadData} className="min-h-[44px] rounded-full bg-brand-500 px-5 py-3 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]">Refresh board</button>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <label className="flex min-h-[44px] items-center gap-3 rounded-2xl bg-slate-950/70 px-4 py-3 ring-1 ring-white/10">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players" className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500" />
                </label>
                <select value={team} onChange={(e) => setTeam(e.target.value)} className="min-h-[44px] rounded-2xl bg-slate-950/70 px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none">
                  <option value="all">All teams</option>
                  {teams.map((teamName) => <option key={teamName} value={teamName}>{teamName}</option>)}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="min-h-[44px] rounded-2xl bg-slate-950/70 px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none">
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>

              {loading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-3xl bg-white/5" />)}
                </div>
              ) : error ? (
                <div className="rounded-3xl bg-red-500/10 p-6 text-red-100 ring-1 ring-red-400/30">
                  <p>{error}</p>
                  <button onClick={loadData} className="mt-4 min-h-[44px] rounded-full bg-red-500 px-5 py-3 font-semibold">Try again</button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {players.map((player, index) => (
                    <motion.div key={player.playerSlug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                      <PlayerCard player={player} active={selectedPlayer?.playerSlug === player.playerSlug} onClick={() => setSelectedPlayer(player)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur md:p-5">
              {selectedPlayer ? (
                <>
                  <div className="rounded-[24px] bg-gradient-to-br from-brand-500/30 via-brand-600/20 to-pitch-500/20 p-5 ring-1 ring-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Player spotlight</p>
                        <h3 className="mt-2 text-3xl font-bold tracking-tight">{selectedPlayer.playerName}</h3>
                        <p className="mt-2 text-slate-300">{selectedPlayer.team} · {selectedPlayer.role}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-right">
                        <div className="text-sm text-slate-400">Career matches</div>
                        <div className="text-2xl font-bold">{selectedPlayer.career.matches}</div>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <StatChip icon={Flame} label="Runs" value={selectedPlayer.career.runs} helper={`SR ${selectedPlayer.career.strikeRate}`} />
                      <StatChip icon={Shield} label="Wickets" value={selectedPlayer.career.wickets} helper={`Eco ${selectedPlayer.career.economy}`} />
                      <StatChip icon={Trophy} label="Best bowling" value={selectedPlayer.career.bestBowling} helper={`HS ${selectedPlayer.career.highestScore}`} />
                      <StatChip icon={Activity} label="Fielding" value={selectedPlayer.career.catches} helper={`${selectedPlayer.career.stumpings} stumpings`} />
                    </div>
                  </div>
                  <SeasonTable seasons={selectedPlayer.seasons} />
                </>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center rounded-[24px] bg-slate-950/60 text-slate-400 ring-1 ring-white/10">Pick a player to inspect their season log.</div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
