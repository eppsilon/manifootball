import chalk from 'chalk';
import { Command, Option, OptionValues } from 'commander';
import { intlFormat } from 'date-fns';
import { Change, diffChars } from 'diff';
import { compact, difference, first, sortBy, uniq, uniqBy } from 'lodash-es';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
import { CFB_API, MF_API } from '../config';
import { Market, NewMarket, User, createMarket, editMarketGroup, getMarket, getUser, searchMarkets } from '../manifold';
import { Game, Venue, getGameSpread, getGames, getPollRanks, getVenues } from '../stats';

const MF_GROUPS = {
  'sports-default': '2hGlgVhIyvVaFyQAREPi',
  football: 'Vcf6CYTTSXAiStbKSqQq',
  'college-football': 'ky1VPTuxrLXMnHyajZFp',
  aac: '569048e1-f4f8-41d8-827b-5a89f4fb6d03',
  acc: 'fd88ff6f-22cd-4b94-ac6b-79e9af2bc16f',
  'big-ten': 'd1a6645b-90f0-4c35-a0cf-4bf709402f72',
  'big-12': '7f158dd0-db47-4861-abc1-1713e032109c',
  'conference-usa': 'aa391c04-a211-4300-b4e7-08d78c2b52aa',
  'midamerican-conference': '1fc39c2a-b6f4-44c8-b58f-97cc0ca0184d',
  'mountain-west-conference': '53ab54e6-558f-4137-9ac7-bb592f23dd3b',
  pac12: '1749cf04-48bc-4333-b900-2e1bad326051',
  sec: 'fced6b02-8033-4522-bfae-c3b9c0f9744d',
  'sun-belt-conference': 'a51e3e61-c09a-4d77-9513-cbd3d5c86625',
};

const CFB_CONFERENCES_TO_MF_GROUPS = {
  'American Athletic': 'aac',
  ACC: 'acc',
  'Big 12': 'big-12',
  'Big Ten': 'big-ten',
  'Conference USA': 'conference-usa',
  'Mid-American': 'midamerican-conference',
  'Mountain West': 'mountain-west-conference',
  'Pac-12': 'pac12',
  SEC: 'sec',
  'Sun Belt': 'sun-belt-conference',
};

const MF_CLOSE_PADDING_MS = 4 * 60 * 60 * 1000;

export class AutocreateCommand implements AsyncDisposable {
  readonly rl = readline.createInterface({ input, output });
  matchingGames: Record<string, boolean> = {};

  constructor(program: Command) {
    program
      .command('autocreate')
      .option('--game <id>')
      .requiredOption('--week <number>')
      .addOption(new Option('--poll <poll>').choices(['ap', 'cfp']).makeOptionMandatory())
      .action(options => this.run(options));
  }

  async run(options: OptionValues): Promise<void> {
    const gameId = options.game;
    const week = +options.week;
    const poll = options.poll as 'ap' | 'cfp';
    console.debug({ gameId, week, poll });

    try {
      let mfUser: User;
      try {
        mfUser = await getUser(MF_API);
        console.log(`MF User ID: ${mfUser.id}`);
      } catch (e: unknown) {
        console.error(`Could not get Manifold user details`, e);
        return;
      }

      let apRanks: Record<string, number>;
      try {
        apRanks = await getPollRanks(CFB_API, { week, poll });
      } catch (e: unknown) {
        console.error(`Could not get poll ranking`, e);
        return;
      }

      let venues: Record<string, Venue>;
      try {
        venues = await getVenues(CFB_API);
      } catch (e: unknown) {
        console.error(`Could not get venues`, e);
        return;
      }

      let games: Game[];
      try {
        games = await getGames(CFB_API, week);
        games = sortBy(games, g => g.start_date);
      } catch (e: unknown) {
        console.error(`Could not get game schedule`, e);
        return;
      }

      try {
        this.matchingGames = JSON.parse(
          await readFile(join(import.meta.url, '..', 'matching-games.json'), { encoding: 'utf-8' })
        );
      } catch (e) {
        console.error('Failed to load or parse matching games', e);
        this.matchingGames = {};
      }

      const commonTime = new Date('2023-01-15T23:00:00Z');
      const etFormat = new Date(
        intlFormat(
          commonTime,
          {
            hour12: false,
            timeZone: 'America/New_York',
            timeZoneName: 'short',
          },
          { locale: 'en-US' }
        )
      ).getTime();
      const localFormat = new Date(
        intlFormat(
          commonTime,
          {
            hour12: false,
            timeZone: 'America/Phoenix',
            timeZoneName: 'short',
          },
          { locale: 'en-US' }
        )
      ).getTime();
      const etOffset = localFormat - etFormat;

      for (let game of games) {
        if (gameId && `${game.id}` !== gameId) {
          continue;
        }

        console.log('-'.repeat(80));
        const startDate = new Date(game.start_date);

        let formattedStartDate: string;
        if (game.start_time_tbd || (startDate.getHours() === 23 && startDate.getMinutes() === 59)) {
          formattedStartDate = `${game.start_date.substring(0, game.start_date.indexOf('T'))} at TBD`;
        } else {
          const startTimestamp = new Date(game.start_date).getTime();

          const startDate = new Date(startTimestamp + etOffset);
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

        let description = `${formattedStartDate}`;

        const venue = venues[game.venue_id];
        if (venue) {
          description += ` in ${venue.city}, ${venue.state}`;
        }

        const spread = await getGameSpread(CFB_API, game.id);
        if (spread != null) {
          description += `. Line: ${game.home_team} ${Number.isNaN(spread) || +spread < 0 ? '' : '+'}${+spread}.`;
        }

        console.log(
          `${formattedStartDate}: ${awayTeam} (${game.away_pregame_elo}) @ ${homeTeam} (${game.home_pregame_elo})`
        );

        let matchingMarkets: Market[] = [];
        let alreadyMatched = false;
        const matchingGameKeys = Object.keys(this.matchingGames).filter(
          k => k.startsWith(`${game.id}_`) && this.matchingGames[k] != null
        );
        const matchingGameKey = matchingGameKeys.find(k => this.matchingGames[k]);
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
            const searchResults = await searchMarkets(MF_API, {
              terms: `${game.away_team} ${game.home_team}`,
              filter: 'all',
              creatorId: mfUser.id,
            });
            matchingMarkets = uniqBy(searchResults, r => r.id);
          } catch (e: unknown) {
            console.error(`Could not search for matching market`, e);
          }
        }

        let matchingMarket: Market | undefined;
        let canCreate = true;
        if (matchingMarkets.length > 0) {
          console.log('Found existing market(s):');

          for (const [market, i] of matchingMarkets.map((m, i) => [m, i] as const)) {
            console.log(`${i + 1}. `, market.question);
          }

          if (alreadyMatched) {
            console.log('Already marked as existing - will not create');
            matchingMarket = first(matchingMarkets);
            canCreate = false;
          } else {
            const selectedMatch = await this.select('Which market matches?', 1);
            if (selectedMatch === 'Q') {
              console.log('Quitting');
              break;
            }

            for (let [market, i] of matchingMarkets.map((m, i) => [m, i] as const)) {
              if (!Number.isNaN(selectedMatch) && selectedMatch === i + 1) {
                console.log('Market matches - will not create');
                this.matchingGames[`${game.id}_${market.id}`] = true;

                if (!market.groupSlugs) {
                  market = await getMarket(MF_API, market.id);
                }

                matchingMarket = market;
                canCreate = false;
              } else {
                this.matchingGames[`${game.id}_${market.id}`] = false;
              }
            }
          }
        }

        let createdMarket: Market | undefined = undefined;
        if (canCreate) {
          const createResponse = await this.confirm('Create market?');
          if (createResponse === 'Y') {
            const newMarket: NewMarket = {
              question: `🏈 2023 NCAAF: Will ${awayTeam} beat ${homeTeam}?`,
              outcomeType: 'BINARY',
              description,
              closeTime: startDate.getTime() + MF_CLOSE_PADDING_MS,
              initialProb: 50,
              groupId: MF_GROUPS['college-football'],
            };

            const confirmCreate = await this.confirm(`Create market ${JSON.stringify(newMarket, null, 2)}?`);
            if (confirmCreate === 'Y') {
              try {
                const response = await createMarket(MF_API, newMarket);
                if (response.ok) {
                  createdMarket = await response.json();
                  createdMarket.textDescription = description; // desc comes back as object
                  this.matchingGames[`${game.id}_${createdMarket.id}`] = true;
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
          } else {
            console.log('All groups already added');
          }

          if (groupsToRemove.length > 0) {
            const confirmRemoveGroups = await this.confirm(
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
            if ((await this.confirm(`Update close time to ${closeTime.getHours()}:${closeTimeMinutes}`)) === 'Q') {
              break;
            }
          }

          if (market.textDescription !== description) {
            const descriptionChanges = diffChars(market.textDescription, description);

            let markedUpDescription = '';
            let change: Change;
            while ((change = descriptionChanges.shift())) {
              if (change.added) {
                markedUpDescription += chalk.green.underline(change.value);
              } else if (change.removed) {
                markedUpDescription += chalk.red.strikethrough(change.value);
              } else {
                markedUpDescription += change.value;
              }
            }

            console.log('New: ' + description);
            console.log('Changes: ' + markedUpDescription);

            if ((await this.confirm(`Update description`)) === 'Q') {
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async confirm(prompt: string): Promise<'Y' | 'N' | 'Q'> {
    let response = (await this.rl.question(`${prompt} [Y/N/Q] (N) `)).toUpperCase();
    if (response !== 'Y' && response !== 'Q') {
      response = 'N';
    }
    return response as 'Y' | 'N' | 'Q';
  }

  async select(prompt: string, defaultResponse: number | 'N' = 'N'): Promise<number | 'N' | 'Q'> {
    let response: string | number | 'N' | 'Q' = (
      await this.rl.question(`${prompt} [#/N/Q] (${defaultResponse}) `)
    ).toUpperCase();

    if (response !== '' && !Number.isNaN(+response)) {
      return +response;
    }

    if (response !== 'Q' && response !== 'N') {
      response = defaultResponse;
    }

    return response as number | 'N' | 'Q';
  }

  async [Symbol.asyncDispose]() {
    // Must fully clean up readline or other programs in the same shell will not work correctly.
    this.rl.close();
    this.rl.removeAllListeners();
    input.end();
    input.destroy();

    // Store matching game mapping.
    const matchingGamesPath = join(import.meta.url, '..', 'matching-games.json');
    await writeFile(matchingGamesPath, JSON.stringify(this.matchingGames, null, 2), {
      encoding: 'utf-8',
    });
  }
}

export {};
