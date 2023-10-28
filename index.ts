import { compact, difference, first, sortBy, uniq, uniqBy } from 'lodash-es';
import { readFile, writeFile } from 'node:fs/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
import { CACHE_PATH, CFB_API_KEY, CFB_WEEK, MF_API_KEY } from './config';
import { Market, NewMarket, User, createMarket, editMarketGroup, getMarket, getUser, searchMarkets } from './manifold';
import { Game, Venue, getApPollRanks, getGames, getVenues } from './stats';
import { resolve } from 'node:path';

const CFB_API_URL = 'https://api.collegefootballdata.com';
const MF_API_URL = 'https://manifold.markets/api/v0';

const CFB_API = { apiUrl: CFB_API_URL, apiKey: CFB_API_KEY, cachePath: resolve(CACHE_PATH) };
const MF_API = { apiUrl: MF_API_URL, apiKey: MF_API_KEY };

const MF_GROUPS = {
  'sports-default': '2hGlgVhIyvVaFyQAREPi',
  football: 'Vcf6CYTTSXAiStbKSqQq',
  'college-football': 'ky1VPTuxrLXMnHyajZFp',
  aac: '569048e1-f4f8-41d8-827b-5a89f4fb6d03',
  acc: 'fd88ff6f-22cd-4b94-ac6b-79e9af2bc16f',
  'big-ten': 'd1a6645b-90f0-4c35-a0cf-4bf709402f72',
  'big-12': '7f158dd0-db47-4861-abc1-1713e032109c',
  'mountain-west-conference': '53ab54e6-558f-4137-9ac7-bb592f23dd3b',
  'pac-12': '1749cf04-48bc-4333-b900-2e1bad326051',
  sec: 'fced6b02-8033-4522-bfae-c3b9c0f9744d',
};

const CFB_CONFERENCES_TO_MF_GROUPS = {
  'American Athletic': 'aac',
  ACC: 'acc',
  'Big 12': 'big-12',
  'Big Ten': 'big-ten',
  'Mountain West': 'mountain-west-conference',
  'Pac-12': 'pac-12',
  SEC: 'sec',
};

const MF_CLOSE_PADDING_MS = 4 * 60 * 60 * 1000;

const rl = readline.createInterface({ input, output });

async function confirm(prompt: string): Promise<'Y' | 'N' | 'Q'> {
  let response = (await rl.question(`${prompt} [Y/N/Q] (N) `)).toUpperCase();
  if (response !== 'Y' && response !== 'Q') {
    response = 'N';
  }
  return response as 'Y' | 'N' | 'Q';
}

async function select(prompt: string): Promise<number | 'N' | 'Q'> {
  let response = (await rl.question(`${prompt} [#/N/Q] (N) `)).toUpperCase();

  if (!Number.isNaN(+response)) {
    return +response;
  }

  if (response !== 'Q') {
    response = 'N';
  }

  return response as number | 'N' | 'Q';
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
    apRanks = await getApPollRanks(CFB_API, CFB_WEEK);
  } catch (e: unknown) {
    console.error(`Could not get AP poll ranking`, e);
    process.exit(1);
  }

  let venues: Record<string, Venue>;
  try {
    venues = await getVenues(CFB_API);
  } catch (e: unknown) {
    console.error(`Could not get venues`, e);
    process.exit(1);
  }

  let games: Game[];
  try {
    games = await getGames(CFB_API, CFB_WEEK);
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

  console.log('argv', process.argv);

  for (let game of games) {
    if (process.argv.length > 2 && `${game.id}` !== process.argv[2]) {
      continue;
    }

    console.log('-'.repeat(80));
    const startDate = new Date(game.start_date);

    let formattedStartDate: string;
    if (game.start_time_tbd || (startDate.getHours() === 23 && startDate.getMinutes() === 59)) {
      formattedStartDate = `${game.start_date.substring(0, game.start_date.indexOf('T'))} at TBD`;
    } else {
      console.debug('game.start_date', game.start_date);
      const startTimestamp = new Date(game.start_date).getTime();
      console.debug('startTimestamp', startTimestamp);
      const startDate = new Date(startTimestamp + 3 * 60 * 60 * 1000);
      console.debug('startDate', startDate);
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

    const venue = venues[game.venue_id];
    const description = `${formattedStartDate} in ${venue.city}, ${venue.state}`;

    console.log(
      `${formattedStartDate}: ${awayTeam} (${game.away_pregame_elo}) @ ${homeTeam} (${game.home_pregame_elo})`
    );

    let matchingMarkets: Market[] = [];
    let alreadyMatched = false;
    const matchingGameKeys = Object.keys(matchingGames).filter(
      k => k.startsWith(`${game.id}_`) && matchingGames[k] != null
    );
    const matchingGameKey = matchingGameKeys.find(k => matchingGames[k]);
    if (matchingGameKey) {
      const [, matchingGameMfId] = matchingGameKey.split('_', 2);
      try {
        console.debug(`Game ${game.id} was already marked as existing, getting market ${matchingGameMfId}`);
        matchingMarkets = [await getMarket(MF_API, matchingGameMfId)];
        alreadyMatched = true;
      } catch (e: unknown) {
        console.error(`Could not get matching market ${matchingGameMfId}`, e);
      }
    } else {
      try {
        const searchResults = await searchMarkets(MF_API, `will ${game.away_team} beat ${game.home_team}`);
        matchingMarkets = uniqBy(
          searchResults.filter(r => r.creatorId === mfUser.id && !r.isResolved),
          r => r.id
        );
      } catch (e: unknown) {
        console.error(`Could not search for matching market`, e);
      }
    }

    let matchingMarket: Market | undefined;
    let canCreate = true;
    if (matchingMarkets.length > 0) {
      console.log('Found existing market(s): ');

      for (const [market, i] of matchingMarkets.map((m, i) => [m, i] as const)) {
        console.log(`${i + 1}. `, market.question);
      }

      if (alreadyMatched) {
        console.log('Already marked as existing - will not create');
        matchingMarket = first(matchingMarkets);
        canCreate = false;
      } else {
        const selectedMatch = await select('Which market matches?');
        if (selectedMatch === 'Q') {
          console.log('Quitting');
          break;
        }

        for (const [market, i] of matchingMarkets.map((m, i) => [m, i] as const)) {
          if (!Number.isNaN(selectedMatch) && selectedMatch === i + 1) {
            console.log('Market matches - will not create');
            matchingGames[`${game.id}_${market.id}`] = true;
            matchingMarket = market;
            canCreate = false;
          } else {
            matchingGames[`${game.id}_${market.id}`] = false;
          }
        }
      }
    }

    let createdMarket: Market | undefined = undefined;
    if (canCreate) {
      const createResponse = await confirm('Create market?');
      if (createResponse === 'Y') {
        const newMarket: NewMarket = {
          question: `🏈 2023 NCAAF: Will ${awayTeam} beat ${homeTeam}?`,
          outcomeType: 'BINARY',
          description,
          closeTime: startDate.getTime() + MF_CLOSE_PADDING_MS,
          initialProb: 50,
          groupId: MF_GROUPS['college-football'],
        };

        const confirmCreate = await confirm(`Create market ${JSON.stringify(newMarket, null, 2)}?`);
        if (confirmCreate === 'Y') {
          try {
            const response = await createMarket(MF_API, newMarket);
            if (response.ok) {
              createdMarket = await response.json();
              console.log('Market created', createdMarket);
            } else {
              let error: { message: string } | undefined;
              try {
                error = await response.json();
              } catch {}
              console.error('Failed to create market:', error?.message);
            }
          } catch (e) {
            console.error('Failed to create market:', e);
          }
        } else if (confirmCreate === 'Q') {
          console.log('Quitting');
          break;
        }
      } else if (createResponse === 'N') {
        console.log('Skipped creating market');
      } else {
        console.log('Quitting');
        break;
      }
    }

    const market = createdMarket || matchingMarket;
    if (market) {
      const groups = [
        'sports-default',
        'football',
        'college-football',
        ...uniq(compact([game.home_conference, game.away_conference].map(c => CFB_CONFERENCES_TO_MF_GROUPS[c]))),
      ];
      const existingGroups = market?.groupSlugs || [];
      const groupsToAdd = difference(groups, existingGroups);
      const groupsToRemove = difference(existingGroups, groups);

      if (groupsToAdd.length > 0) {
        const confirmAddGroups = await confirm(`Add groups ${groupsToAdd.join(', ')} to market ${market.question}?`);
        if (confirmAddGroups === 'Y') {
          for (const group of groupsToAdd) {
            const groupId = MF_GROUPS[group];
            try {
              const response = await editMarketGroup(MF_API, market.id, groupId);
              const responseJson = await response.json();
              console.log(`Group ${groupId} added to market ${market.id}`, responseJson);
            } catch (e) {
              console.error(`Failed to add ${groupId} to market ${market.id}`, e);
            }
          }
        } else if (confirmAddGroups === 'Q') {
          break;
        }
      } else {
        console.log('All groups already added');
      }

      if (groupsToRemove.length > 0) {
        const confirmRemoveGroups = await confirm(
          `Remove groups ${groupsToRemove.join(', ')} from market ${market.question}?`
        );
        if (confirmRemoveGroups === 'Y') {
          for (const group of groupsToRemove) {
            const groupId = MF_GROUPS[group];
            try {
              const response = await editMarketGroup(MF_API, market.id, MF_GROUPS[group], true);
              const responseJson = await response.json();
              console.log(`Group ${groupId} remove from market ${market.id}`, responseJson);
            } catch (e) {
              console.error(`Failed to remove ${groupId} from market ${market.id}`, e);
            }
          }
        } else if (confirmRemoveGroups === 'Q') {
          break;
        }
      } else {
        console.log('No groups need removing');
      }

      if (market.closeTime !== startDate.getTime() + MF_CLOSE_PADDING_MS) {
        const closeTime = new Date(startDate.getTime() + MF_CLOSE_PADDING_MS);
        const closeTimeMinutes = `${closeTime.getMinutes()}`.padStart(2, '0');
        if (
          (await confirm(`Update "${market.question}" close time to ${closeTime.getHours()}:${closeTimeMinutes}`)) ===
          'Q'
        ) {
          break;
        }
      }

      if (market.textDescription !== description) {
        if ((await confirm(`Update "${market.question}" description to "${description}"`)) === 'Q') {
          break;
        }
      }
    }
  }
} catch (e) {
  console.error(e);
} finally {
  rl.close();
  await writeFile('./matching-games.json', JSON.stringify(matchingGames, null, 2), { encoding: 'utf-8' });
}

export {};
