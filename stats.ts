import { find, first, keyBy, mapValues } from 'lodash-es';

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

export async function getGames({ apiUrl, apiKey }: { apiUrl: string; apiKey: string }, week: number): Promise<Game[]> {
  const url = new URL(`${apiUrl}/games`);
  url.searchParams.set('year', '2023');
  url.searchParams.set('week', '' + week);
  url.searchParams.set('seasonType', 'regular');
  url.searchParams.set('division', 'fbs');

  const response = await fetch(url, { method: 'get', headers: { authorization: `Bearer ${apiKey}` } });
  const result = response.json();
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

export async function getApPollRanks(
  {
    apiUrl,
    apiKey,
  }: {
    apiUrl: string;
    apiKey: string;
  },
  week: number
): Promise<Record<string, number>> {
  const url = new URL(`${apiUrl}/rankings`);
  url.searchParams.set('year', '2023');
  url.searchParams.set('week', '' + week);
  url.searchParams.set('seasonType', 'regular');

  const response = await fetch(url, { method: 'get', headers: { authorization: `Bearer ${apiKey}` } });
  const result = (await response.json()) as Polls[];
  const apPoll = find(first(result)?.polls, p => p.poll === 'AP Top 25');
  return mapValues(
    keyBy(apPoll?.ranks, p => p.school),
    r => r.rank
  );
}
