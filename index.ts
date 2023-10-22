import { find, sortBy } from 'lodash-es';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import { Market, User, getMarket, getUser, searchMarkets } from './manifold';
import { Game, getApPollRanks, getGames } from './stats';

const CFB_API_URL = 'https://api.collegefootballdata.com';
export const MF_API_URL = 'https://manifold.markets/api/v0';

export const CFB_API = { apiUrl: CFB_API_URL, apiKey: CFB_API_KEY };
export const MF_API = { apiUrl: MF_API_URL, apiKey: MF_API_KEY };

const rl = readline.createInterface({ input, output });

async function confirm(prompt: string): Promise<'Y' | 'N' | 'Q'> {
  let response = (await rl.question(`${prompt} [Y/N/Q] (N) `)).toUpperCase();
  if (response !== 'Y' && response !== 'Q') {
    response = 'N';
  }
  return response as 'Y' | 'N' | 'Q';
}

let matchingGames: Record<string, boolean> = {};

try {
  let mfUser: User;
  try {
    mfUser = await getUser(MF_API);
    console.log(`MF User ID: ${mfUser.id}`);
  } catch (e: unknown) {
    console.error(`Could not get Manifold user details`, e);
    process.exit(1);
  }

  let apRanks: Record<string, number>;
  try {
    apRanks = await getApPollRanks(CFB_API);
  } catch (e: unknown) {
    console.error(`Could not get AP poll ranking`, e);
    process.exit(1);
  }

  let games: Game[];
  try {
    games = await getGames(CFB_API);
    games = sortBy(games, g => g.start_date);
  } catch (e: unknown) {
    console.error(`Could not get game schedule`, e);
    process.exit(1);
  }

  try {
    matchingGames = JSON.parse(await readFile('./matching-games.json', { encoding: 'utf-8' }));
  } catch {
    matchingGames = {};
  }

  for (let game of games) {
    const startDate = new Date(game.start_date);

    let formattedStartDate: string;
    if (game.start_time_tbd || (startDate.getHours() === 23 && startDate.getMinutes() === 59)) {
      formattedStartDate = `${game.start_date.substring(0, game.start_date.indexOf('T'))} at TBD`;
    } else {
      const startTimestamp = new Date(game.start_date).getTime();
      const startDate = new Date(startTimestamp + 10800);
      const startMonth = `${startDate.getMonth() + 1}`.padStart(2, '0');
      const startDay = `${startDate.getDate()}`.padStart(2, '0');
      const startHours = startDate.getHours();
      const startHour = startHours > 12 ? startHours - 12 : startHours;
      const startAmPm = startHours >= 12 ? 'PM' : 'AM';
      const startMinute = startDate.getMinutes();
      const startTime = startMinute ? `${startHour}:${('' + startMinute).padStart(2, '0')}` : startHour;
      formattedStartDate = `${startDate.getFullYear()}-${startMonth}-${startDay} at ${startTime} ${startAmPm} ET`;
    }

    const awayRank = apRanks[game.away_team];
    const homeRank = apRanks[game.home_team];
    const awayTeam = awayRank ? `#${awayRank} ${game.away_team}` : game.away_team;
    const homeTeam = homeRank ? `#${homeRank} ${game.home_team}` : game.home_team;

    console.log(
      `${formattedStartDate}: ${awayTeam} (${game.away_pregame_elo}) @ ${homeTeam} (${game.home_pregame_elo})`
    );

    let matchingMarket: Market | undefined;
    const matchingGameKey = Object.keys(matchingGames).find(k => k.startsWith(`${game.id}_`) && matchingGames[k]);
    if (matchingGameKey) {
      const [, matchingGameMfId] = matchingGameKey.split('_', 2);
      try {
        console.debug(`Getting market ${matchingGameMfId}`);
        matchingMarket = await getMarket(MF_API, matchingGameMfId);
      } catch (e: unknown) {
        console.error(`Could not get matching market ${matchingGameMfId}`, e);
      }
    } else {
      try {
        const searchResults = await searchMarkets(MF_API, `will ${game.away_team} beat ${game.home_team}`);
        matchingMarket = find(searchResults, r => r.creatorId === mfUser.id);
      } catch (e: unknown) {
        console.error(`Could not search for matching market`, e);
      }
    }

    if (matchingMarket) {
      console.log('Found existing market: ' + matchingMarket.question);

      const isMatch = await confirm('Is market a match?');
      if (isMatch === 'Y') {
        console.log('Market matches - will not create');
        matchingGames[`${game.id}_${matchingMarket.id}`] = true;
        continue;
      } else if (isMatch === 'N') {
        matchingGames[`${game.id}_${matchingMarket.id}`] = false;
      } else {
        console.log('Quitting');
        break;
      }
    }

    const isMatch = await confirm('Create market?');
    if (isMatch === 'Y') {
      console.log('Market created');
    } else if (isMatch === 'N') {
      console.log('Skipped creating market');
    } else {
      console.log('Quitting');
      break;
    }
  }
} finally {
  rl.close();
  await writeFile('./matching-games.json', JSON.stringify(matchingGames, null, 2), { encoding: 'utf-8' });
}

export {};
