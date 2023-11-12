import { find, first, keyBy, last, mapValues, sortBy } from 'lodash-es';
import { join } from 'node:path/posix';
import * as cache from './cache';

export interface Game {
  id: number;
  season: number;
  week: number;
  season_type: 'regular';
  start_date: string;
  start_time_tbd: boolean;
  completed: boolean;
  neutral_site: boolean;
  conference_game: boolean;
  attendance: number | null;
  venue_id: number;
  venue: string;
  home_id: number;
  home_team: string;
  home_conference: string;
  home_division: 'fbs' | 'fcs';
  home_points: number | null;
  home_line_scores: null;
  home_post_win_prob: number | null;
  home_pregame_elo: number;
  home_postgame_elo: number | null;
  away_id: number;
  away_team: string;
  away_conference: string;
  away_division: 'fbs' | 'fcs';
  away_points: number | null;
  away_line_scores: null;
  away_post_win_prob: number | null;
  away_pregame_elo: number;
  away_postgame_elo: number | null;
  excitement_index: number | null;
  highlights: string | null;
  notes: string | null;
}

export async function getGames(
  { apiUrl, apiKey, cachePath }: { apiUrl: string; apiKey: string; cachePath: string },
  week: number
): Promise<Game[]> {
  cachePath = join(cachePath, 'games');

  const url = new URL(`${apiUrl}/games`);
  url.searchParams.set('year', '2023');
  url.searchParams.set('week', '' + week);
  url.searchParams.set('seasonType', 'regular');
  url.searchParams.set('division', 'fbs');

  const headResponse = await fetch(url, { method: 'head', headers: { authorization: `Bearer ${apiKey}` } });
  const cachedData = await cache.load(cachePath, `${url}-${headResponse.headers.get('etag')}`);

  if (cachedData != null) {
    return cachedData as Game[];
  }

  const response = await fetch(url, { method: 'get', headers: { authorization: `Bearer ${apiKey}` } });
  const result = await response.json();
  await cache.save(cachePath, `${url}-${response.headers.get('etag')}`, result);
  return result;
}

interface PollRank {
  rank: number;
  school: string;
  conference: string;
  firstPlaceVotes: number;
  points: number;
}

interface Poll {
  poll: string;
  ranks: PollRank[];
}

interface Polls {
  season: number;
  seasonType: string;
  polls: Poll[];
}

export async function getPollRanks(
  {
    apiUrl,
    apiKey,
    cachePath,
  }: {
    apiUrl: string;
    apiKey: string;
    cachePath: string;
  },
  { year, week, poll }: { year?: number; week: number; poll: 'ap' | 'cfp' }
): Promise<Record<string, number>> {
  cachePath = join(cachePath, 'rankings');
  year ||= new Date().getFullYear();

  const pollName = poll === 'ap' ? 'AP Top 25' : poll === 'cfp' ? 'Playoff Committee Rankings' : undefined;
  if (!pollName) {
    throw new Error('Unexpected poll: must be "ap" or "cfp"');
  }

  const url = new URL(`${apiUrl}/rankings`);
  url.searchParams.set('year', '' + year);
  url.searchParams.set('week', '' + week);
  url.searchParams.set('seasonType', 'regular');

  const headResponse = await fetch(url, { method: 'head', headers: { authorization: `Bearer ${apiKey}` } });
  const cachedData = await cache.load(cachePath, `${url}-${headResponse.headers.get('etag')}`);

  if (cachedData != null) {
    return cachedData as Record<string, number>;
  }

  const response = await fetch(url, { method: 'get', headers: { authorization: `Bearer ${apiKey}` } });
  const result = (await response.json()) as Polls[];
  const pollData = find(first(result)?.polls, p => p.poll === pollName);
  const data = mapValues(
    keyBy(pollData?.ranks, p => p.school),
    r => r.rank
  );
  await cache.save(cachePath, `${url}-${response.headers.get('etag')}`, data);
  return data;
}

export interface Venue {
  id: number;
  name: string;
  capacity: number;
  grass: boolean;
  city: string;
  state: string;
  zip: string;
  country_code: string;
  location: {
    x: number;
    y: number;
  };
  elevation: string;
  year_constructed: number;
  dome: boolean;
  timezone: string;
}

export async function getVenues({
  apiUrl,
  apiKey,
  cachePath,
}: {
  apiUrl: string;
  apiKey: string;
  cachePath: string;
}): Promise<Record<number, Venue>> {
  cachePath = join(cachePath, 'venues');
  const url = new URL(`${apiUrl}/venues`);

  const headResponse = await fetch(url, { method: 'head', headers: { authorization: `Bearer ${apiKey}` } });
  const cachedData = await cache.load(cachePath, `${url}-${headResponse.headers.get('etag')}`);

  if (cachedData != null) {
    return cachedData as Record<number, Venue>;
  }

  const response = await fetch(url, { method: 'get', headers: { authorization: `Bearer ${apiKey}` } });

  const result = (await response.json()) as Venue[];

  const data = keyBy(result, v => v.id);
  await cache.save(cachePath, `${url}-${response.headers.get('etag')}`, data);
  return data;
}

export interface BettingGame {
  id: number;
  season: number;
  seasonType: 'regular';
  week: number;
  startDate: string;
  homeTeam: string;
  homeConference: string;
  homeScore: number;
  awayTeam: string;
  awayConference: string;
  awayScore: number;
  lines: {
    provider: string;
    spread: string;
    formattedSpread: string;
    spreadOpen: string;
    overUnder: string;
    overUnderOpen: string | null;
    homeMoneyline: string | null;
    awayMoneyline: string | null;
  }[];
}

export async function getGameSpread(
  {
    apiUrl,
    apiKey,
    cachePath,
  }: {
    apiUrl: string;
    apiKey: string;
    cachePath: string;
  },
  gameId: number
): Promise<string | undefined> {
  cachePath = join(cachePath, 'lines');

  const url = new URL(`${apiUrl}/lines`);
  url.searchParams.set('gameId', '' + gameId);

  const headResponse = await fetch(url, { method: 'head', headers: { authorization: `Bearer ${apiKey}` } });
  const cachedData = await cache.load(cachePath, `${url}-${headResponse.headers.get('etag')}`);

  if (cachedData != null) {
    return cachedData as string;
  }

  const response = await fetch(url, { method: 'get', headers: { authorization: `Bearer ${apiKey}` } });
  const result = (await response.json()) as BettingGame[];
  const lines = sortBy(first(result)?.lines || [], l => l.spread);
  // Log.debug('getGameSpread(): lines', lines);

  const spreads = lines.reduce((s, l) => ({ [l.spread]: (s[l.spread] || 0) + 1 }), {} as Record<string, number>);
  // Log.debug('getGameSpread(): spreads', spreads);
  const [majoritySpread] = Object.entries(spreads).find(([, c]) => c > lines.length / 2) || [];
  // Log.debug('getGameSpread(): majoritySpread', majoritySpread);

  let data: string | undefined;
  if (majoritySpread) {
    data = majoritySpread;
  } else {
    const [mostCommonSpread] = last(sortBy(Object.entries(spreads), ([, c]) => c)) || [];
    // Log.debug('getGameSpread(): mostCommonSpread', mostCommonSpread);
    data = mostCommonSpread;
  }

  await cache.save(cachePath, `${url}-${response.headers.get('etag')}`, data);
  return data;
}

export interface ScoreboardGame {
  id: number;
  startDate: string;
  startTimeTBD: boolean;
  tv: string;
  neutralSite: boolean;
  conferenceGame: boolean;
  status: 'scheduled' | 'in_progress' | 'completed';
  period: 1 | 2 | 3 | 4 | null;
  clock: string | null;
  situation: string | null;
  possession: 'home' | 'away' | null;
  venue: {
    name: string;
    city: string;
    state: string;
  };
  homeTeam: {
    id: number;
    name: string;
    conference: string;
    classification: 'fbs';
    points: number | null;
  };
  awayTeam: {
    id: number;
    name: string;
    conference: string;
    classification: 'fbs';
    points: number | null;
  };
  weather: {
    temperature: string;
    description: string;
    windSpeed: string;
    windDirection: string;
  };
  betting: {
    spread: string;
    overUnder: string;
    homeMoneyline: number;
    awayMoneyline: number;
  };
}

export async function getScoreboard(
  {
    apiUrl,
    apiKey,
    cachePath,
  }: {
    apiUrl: string;
    apiKey: string;
    cachePath: string;
  },
  classification?: 'fbs' | 'fcs' | 'ii' | 'iii',
  conference?: string
): Promise<ScoreboardGame[]> {
  cachePath = join(cachePath, 'scoreboard');
  const url = new URL(`${apiUrl}/scoreboard`);

  if (classification) {
    url.searchParams.set('classification', classification);
  }

  if (conference) {
    url.searchParams.set('conference', conference);
  }

  const headResponse = await fetch(url, { method: 'head', headers: { authorization: `Bearer ${apiKey}` } });
  const cachedData = await cache.load(cachePath, `${url}-${headResponse.headers.get('etag')}`);

  if (cachedData != null) {
    return cachedData as ScoreboardGame[];
  }

  const response = await fetch(url, { method: 'get', headers: { authorization: `Bearer ${apiKey}` } });
  const result = (await response.json()) as ScoreboardGame[];
  await cache.save(cachePath, `${url}-${response.headers.get('etag')}`, result);
  return result;
}

export interface Team {
  id: number;
  school: string;
  mascot: string;
  abbreviation: string;
  alt_name1: string | null;
  alt_name2: string | null;
  alt_name3: string | null;
  conference: string;
  classification: 'fbs' | 'fcs' | 'ii' | 'iii';
  color: string;
  alt_color: string;
  logos: string[];
  twitter: string;
  location: {
    venue_id: number;
    name: string;
    city: string;
    state: string;
    zip: string;
    country_code: string;
    timezone: string;
    latitude: number;
    longitude: number;
    elevation: string;
    capacity: number;
    year_constructed: number;
    grass: boolean;
    dome: boolean;
  };
}

export async function getTeams(
  {
    apiUrl,
    apiKey,
    cachePath,
  }: {
    apiUrl: string;
    apiKey: string;
    cachePath: string;
  },
  conference?: string
): Promise<Team[]> {
  cachePath = join(cachePath, 'teams');
  const url = new URL(`${apiUrl}/teams`);

  if (conference) {
    url.searchParams.set('conference', conference);
  }

  const headResponse = await fetch(url, { method: 'head', headers: { authorization: `Bearer ${apiKey}` } });
  const cachedData = await cache.load(cachePath, `${url}-${headResponse.headers.get('etag')}`);

  if (cachedData != null) {
    return cachedData as Team[];
  }

  const response = await fetch(url, { method: 'get', headers: { authorization: `Bearer ${apiKey}` } });
  const result = (await response.json()) as Team[];
  await cache.save(cachePath, `${url}-${response.headers.get('etag')}`, result);
  return result;
}

export interface TeamMatchups {
  team1: string;
  team2: string;
  startYear: string;
  team1Wins: number;
  team2Wins: number;
  ties: number;
  games: {
    season: number;
    week: number;
    seasonType: 'regular';
    date: string;
    neutralSite: boolean;
    venue: null;
    homeTeam: string;
    homeScore: number;
    awayTeam: string;
    awayScore: number;
    winner: string;
  }[];
}

export async function getTeamMatchups(
  {
    apiUrl,
    apiKey,
    cachePath,
  }: {
    apiUrl: string;
    apiKey: string;
    cachePath: string;
  },
  { team1, team2, minYear, maxYear }: { team1: string; team2: string; minYear?: number; maxYear?: number }
): Promise<TeamMatchups> {
  cachePath = join(cachePath, 'teams/matchup');

  const url = new URL(`${apiUrl}/teams/matchup`);
  url.searchParams.set('team1', team1);
  url.searchParams.set('team2', team2);

  if (minYear) {
    url.searchParams.set('minYear', '' + minYear);
  }

  if (maxYear) {
    url.searchParams.set('maxYear', '' + maxYear);
  }

  const headResponse = await fetch(url, { method: 'head', headers: { authorization: `Bearer ${apiKey}` } });
  const cachedData = await cache.load(cachePath, `${url}-${headResponse.headers.get('etag')}`);

  if (cachedData != null) {
    return cachedData as TeamMatchups;
  }

  const response = await fetch(url, { method: 'get', headers: { authorization: `Bearer ${apiKey}` } });
  const result = (await response.json()) as TeamMatchups;
  await cache.save(cachePath, `${url}-${response.headers.get('etag')}`, result);
  return result;
}
