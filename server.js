import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();
const app = express();
const execFileAsync = promisify(execFile);
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(process.cwd(), '.cache');
const ZIP_PATH = path.join(DATA_DIR, 'ipl_json.zip');
const EXTRACT_DIR = path.join(DATA_DIR, 'ipl_json');
const SOURCE_URL = 'https://cricsheet.org/downloads/ipl_json.zip';
const REFRESH_MS = 1000 * 60 * 60 * 24 * 7;

app.use(cors());
app.use(express.json());

const teamAliases = new Map([
  ['Chennai Super Kings', 'CSK'],
  ['Mumbai Indians', 'MI'],
  ['Royal Challengers Bangalore', 'RCB'],
  ['Royal Challengers Bengaluru', 'RCB'],
  ['Kolkata Knight Riders', 'KKR'],
  ['Sunrisers Hyderabad', 'SRH'],
  ['Deccan Chargers', 'DEC'],
  ['Delhi Daredevils', 'DD'],
  ['Delhi Capitals', 'DC'],
  ['Kings XI Punjab', 'KXIP'],
  ['Punjab Kings', 'PBKS'],
  ['Rajasthan Royals', 'RR'],
  ['Gujarat Lions', 'GL'],
  ['Gujarat Titans', 'GT'],
  ['Lucknow Super Giants', 'LSG'],
  ['Rising Pune Supergiant', 'RPS'],
  ['Rising Pune Supergiants', 'RPS'],
  ['Pune Warriors', 'PWI'],
  ['Kochi Tuskers Kerala', 'KTK']
]);

let refreshPromise = null;

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function createPlayer(name) {
  return {
    playerSlug: slugify(name),
    playerName: name,
    team: 'Free Agent',
    role: 'Player',
    seasons: {},
    career: {
      matches: 0,
      innings: 0,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      outs: 0,
      wickets: 0,
      ballsBowled: 0,
      runsConceded: 0,
      maidens: 0,
      catches: 0,
      stumpings: 0,
      runOuts: 0,
      highestScore: 0,
      bestBowling: '0/0'
    }
  };
}

function ensureSeason(player, season) {
  if (!player.seasons[season]) {
    player.seasons[season] = {
      season,
      team: player.team,
      matches: 0,
      innings: 0,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      outs: 0,
      wickets: 0,
      ballsBowled: 0,
      runsConceded: 0,
      maidens: 0,
      catches: 0,
      stumpings: 0,
      runOuts: 0,
      highestScore: 0,
      bestBowlingWickets: 0,
      bestBowlingRuns: 999,
      teams: new Set()
    };
  }
  return player.seasons[season];
}

function finalizePlayer(player) {
  const seasons = Object.values(player.seasons)
    .map((season) => {
      const battingAverage = season.outs ? season.runs / season.outs : season.runs;
      const strikeRate = season.ballsFaced ? (season.runs / season.ballsFaced) * 100 : 0;
      const economy = season.ballsBowled ? (season.runsConceded / (season.ballsBowled / 6)) : 0;
      const bowlingAverage = season.wickets ? season.runsConceded / season.wickets : null;
      const bowlingStrikeRate = season.wickets ? season.ballsBowled / season.wickets : null;
      return {
        ...season,
        teams: Array.from(season.teams),
        battingAverage: Number(battingAverage.toFixed(2)),
        strikeRate: Number(strikeRate.toFixed(2)),
        economy: Number(economy.toFixed(2)),
        bowlingAverage: bowlingAverage ? Number(bowlingAverage.toFixed(2)) : null,
        bowlingStrikeRate: bowlingStrikeRate ? Number(bowlingStrikeRate.toFixed(2)) : null,
        bestBowling: season.bestBowlingRuns === 999 ? '0/0' : `${season.bestBowlingWickets}/${season.bestBowlingRuns}`
      };
    })
    .sort((a, b) => String(a.season).localeCompare(String(b.season)));

  const career = player.career;
  const battingAverage = career.outs ? career.runs / career.outs : career.runs;
  const strikeRate = career.ballsFaced ? (career.runs / career.ballsFaced) * 100 : 0;
  const economy = career.ballsBowled ? (career.runsConceded / (career.ballsBowled / 6)) : 0;
  const bowlingAverage = career.wickets ? career.runsConceded / career.wickets : null;
  const bowlingStrikeRate = career.wickets ? career.ballsBowled / career.wickets : null;

  return {
    ...player,
    seasons,
    career: {
      ...career,
      battingAverage: Number(battingAverage.toFixed(2)),
      strikeRate: Number(strikeRate.toFixed(2)),
      economy: Number(economy.toFixed(2)),
      bowlingAverage: bowlingAverage ? Number(bowlingAverage.toFixed(2)) : null,
      bowlingStrikeRate: bowlingStrikeRate ? Number(bowlingStrikeRate.toFixed(2)) : null
    }
  };
}

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let shouldDownload = false;
  try {
    const stat = await fs.stat(ZIP_PATH);
    if (Date.now() - stat.mtimeMs > REFRESH_MS) shouldDownload = true;
  } catch {
    shouldDownload = true;
  }

  if (shouldDownload) {
    const response = await axios.get(SOURCE_URL, { responseType: 'arraybuffer', timeout: 120000 });
    await fs.writeFile(ZIP_PATH, response.data);
    await fs.rm(EXTRACT_DIR, { recursive: true, force: true });
  }

  try {
    await fs.access(EXTRACT_DIR);
  } catch {
    await fs.mkdir(EXTRACT_DIR, { recursive: true });
    await execFileAsync('unzip', ['-o', ZIP_PATH, '-d', EXTRACT_DIR]);
  }
}

function addMatchAppearance(player, season, team) {
  const seasonStats = ensureSeason(player, season);
  seasonStats.matches += 1;
  seasonStats.team = team;
  seasonStats.teams.add(team);
  player.team = team;
  player.career.matches += 1;
}

async function rebuildDatabase() {
  await ensureDataFiles();
  const files = (await fs.readdir(EXTRACT_DIR)).filter((file) => file.endsWith('.json'));
  const players = new Map();

  for (const file of files) {
    const raw = await fs.readFile(path.join(EXTRACT_DIR, file), 'utf8');
    const match = JSON.parse(raw);
    const season = String(match.info?.season ?? 'Unknown');
    const teams = match.info?.teams ?? [];
    const playersByTeam = match.info?.players ?? {};
    const matchPlayers = new Set();

    for (const teamName of teams) {
      const squad = playersByTeam[teamName] ?? [];
      for (const name of squad) {
        if (!players.has(name)) players.set(name, createPlayer(name));
        const player = players.get(name);
        addMatchAppearance(player, season, teamAliases.get(teamName) ?? teamName);
        matchPlayers.add(name);
      }
    }

    const battingScore = new Map();
    const bowlingFigures = new Map();
    const maidenTracker = new Map();

    for (const innings of match.innings ?? []) {
      const overEntries = innings.overs ?? [];
      for (const over of overEntries) {
        const overNumber = over.over;
        const bowlerRuns = new Map();
        for (const delivery of over.deliveries ?? []) {
          const batterName = delivery.batter;
          const bowlerName = delivery.bowler;
          const runs = delivery.runs?.batter ?? 0;
          const totalRuns = delivery.runs?.total ?? 0;
          const extras = delivery.runs?.extras ?? 0;

          if (!players.has(batterName)) players.set(batterName, createPlayer(batterName));
          if (!players.has(bowlerName)) players.set(bowlerName, createPlayer(bowlerName));

          const batter = players.get(batterName);
          const bowler = players.get(bowlerName);
          const batterSeason = ensureSeason(batter, season);
          const bowlerSeason = ensureSeason(bowler, season);

          if (!battingScore.has(`${season}:${batterName}`)) battingScore.set(`${season}:${batterName}`, 0);
          battingScore.set(`${season}:${batterName}`, battingScore.get(`${season}:${batterName}`) + runs);

          batterSeason.runs += runs;
          batterSeason.ballsFaced += 1;
          batterSeason.innings += 1;
          batter.career.runs += runs;
          batter.career.ballsFaced += 1;
          batter.career.innings += 1;
          if (runs === 4) {
            batterSeason.fours += 1;
            batter.career.fours += 1;
          }
          if (runs === 6) {
            batterSeason.sixes += 1;
            batter.career.sixes += 1;
          }

          bowlerSeason.ballsBowled += 1;
          bowlerSeason.runsConceded += totalRuns;
          bowler.career.ballsBowled += 1;
          bowler.career.runsConceded += totalRuns;

          const maidenKey = `${season}:${bowlerName}:${overNumber}`;
          maidenTracker.set(maidenKey, (maidenTracker.get(maidenKey) ?? 0) + totalRuns);
          bowlerRuns.set(bowlerName, (bowlerRuns.get(bowlerName) ?? 0) + totalRuns);

          for (const wicket of delivery.wickets ?? []) {
            const kind = wicket.kind;
            const playerOut = wicket.player_out;
            if (playerOut && players.has(playerOut) && !['retired hurt', 'retired out', 'obstructing the field'].includes(kind)) {
              const outPlayer = players.get(playerOut);
              ensureSeason(outPlayer, season).outs += 1;
              outPlayer.career.outs += 1;
            }
            if (['bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket'].includes(kind)) {
              bowlerSeason.wickets += 1;
              bowler.career.wickets += 1;
              const figureKey = `${season}:${bowlerName}`;
              const current = bowlingFigures.get(figureKey) ?? { wickets: 0, runs: 0 };
              current.wickets += 1;
              current.runs = bowlerRuns.get(bowlerName) ?? current.runs;
              bowlingFigures.set(figureKey, current);
            }
            for (const fielder of wicket.fielders ?? []) {
              const fielderName = fielder.name;
              if (!players.has(fielderName)) players.set(fielderName, createPlayer(fielderName));
              const fieldingPlayer = players.get(fielderName);
              const fieldingSeason = ensureSeason(fieldingPlayer, season);
              if (kind === 'caught' || kind === 'caught and bowled') {
                fieldingSeason.catches += 1;
                fieldingPlayer.career.catches += 1;
              } else if (kind === 'stumped') {
                fieldingSeason.stumpings += 1;
                fieldingPlayer.career.stumpings += 1;
              } else if (kind === 'run out') {
                fieldingSeason.runOuts += 1;
                fieldingPlayer.career.runOuts += 1;
              }
            }
          }
        }
      }
    }

    for (const name of matchPlayers) {
      const player = players.get(name);
      const seasonStats = ensureSeason(player, season);
      const score = battingScore.get(`${season}:${name}`) ?? 0;
      seasonStats.highestScore = Math.max(seasonStats.highestScore, score);
      player.career.highestScore = Math.max(player.career.highestScore, score);
      const figure = bowlingFigures.get(`${season}:${name}`);
      if (figure) {
        if (figure.wickets > seasonStats.bestBowlingWickets || (figure.wickets === seasonStats.bestBowlingWickets && figure.runs < seasonStats.bestBowlingRuns)) {
          seasonStats.bestBowlingWickets = figure.wickets;
          seasonStats.bestBowlingRuns = figure.runs;
        }
        const currentCareer = player.career.bestBowling.split('/').map(Number);
        if (figure.wickets > currentCareer[0] || (figure.wickets === currentCareer[0] && figure.runs < currentCareer[1])) {
          player.career.bestBowling = `${figure.wickets}/${figure.runs}`;
        }
      }
    }

    for (const [key, runs] of maidenTracker.entries()) {
      if (runs === 0) {
        const [, bowlerName] = key.split(':');
        const bowler = players.get(bowlerName);
        if (bowler) {
          ensureSeason(bowler, season).maidens += 1;
          bowler.career.maidens += 1;
        }
      }
    }
  }

  const payload = Array.from(players.values()).map(finalizePlayer);
  await prisma.playerStat.deleteMany();
  for (const player of payload) {
    await prisma.playerStat.create({
      data: {
        playerSlug: player.playerSlug,
        playerName: player.playerName,
        team: player.team,
        role: player.career.wickets > 25 && player.career.runs > 500 ? 'All-rounder' : player.career.wickets > player.career.runs / 50 ? 'Bowler' : 'Batter',
        seasons: player.seasons,
        career: player.career,
        imageUrl: null
      }
    });
  }

  return payload.length;
}

async function ensureFreshData(force = false) {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const latest = await prisma.playerStat.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!force && latest && Date.now() - new Date(latest.updatedAt).getTime() < REFRESH_MS) {
      return latest;
    }
    return rebuildDatabase();
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', service: 'ipl-tracker' });
});

app.post('/api/refresh', async (req, res) => {
  try {
    const count = await ensureFreshData(true);
    res.json({ refreshed: true, players: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to refresh IPL data.' });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    await ensureFreshData();
    const { search = '', team = 'all', sort = 'runs' } = req.query;
    const players = await prisma.playerStat.findMany();
    const filtered = players.filter((player) => {
      const matchesSearch = player.playerName.toLowerCase().includes(String(search).toLowerCase());
      const matchesTeam = team === 'all' || player.team === team;
      return matchesSearch && matchesTeam;
    });

    const sorters = {
      runs: (a, b) => b.career.runs - a.career.runs,
      wickets: (a, b) => b.career.wickets - a.career.wickets,
      strikeRate: (a, b) => b.career.strikeRate - a.career.strikeRate,
      economy: (a, b) => a.career.economy - b.career.economy,
      matches: (a, b) => b.career.matches - a.career.matches
    };

    filtered.sort(sorters[sort] ?? sorters.runs);
    res.json({
      players: filtered,
      teams: [...new Set(players.map((player) => player.team))].sort(),
      updatedAt: players[0]?.updatedAt ?? null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load players.' });
  }
});

app.get('/api/players/:slug', async (req, res) => {
  try {
    await ensureFreshData();
    const player = await prisma.playerStat.findUnique({ where: { playerSlug: req.params.slug } });
    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }
    res.json(player);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load player.' });
  }
});

app.get('/api/summary', async (req, res) => {
  try {
    await ensureFreshData();
    const players = await prisma.playerStat.findMany();
    const topRuns = [...players].sort((a, b) => b.career.runs - a.career.runs).slice(0, 5);
    const topWickets = [...players].sort((a, b) => b.career.wickets - a.career.wickets).slice(0, 5);
    const topStrikeRate = [...players].filter((p) => p.career.ballsFaced > 250).sort((a, b) => b.career.strikeRate - a.career.strikeRate).slice(0, 5);
    res.json({ topRuns, topWickets, topStrikeRate, totalPlayers: players.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load summary.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`IPL tracker API listening on ${PORT}`);
});
