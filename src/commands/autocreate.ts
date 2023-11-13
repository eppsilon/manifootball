import { generateText } from '@tiptap/core';
import { generateJSON } from '@tiptap/html';
import chalk from 'chalk';
import { Command, Option, OptionValues } from 'commander';
import { intlFormat, setHours, setMinutes } from 'date-fns';
import { Change, diffChars } from 'diff';
import { compact, difference, first, isEqual, reverse, sortBy, uniq, uniqBy } from 'lodash-es';
import { marked } from 'marked';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CFB_API, MF_API } from '../config';
import { Log } from '../log';
import {
  Market,
  NewMarket,
  TIPTAP_EXTENSIONS,
  User,
  createMarket,
  editMarketGroup,
  getMarket,
  getUser,
  searchMarkets,
} from '../manifold';
import { ReadlinePrompter } from '../readline';
import { Game, Venue, getGameSpread, getGames, getPollRanks, getTeamMatchups, getVenues } from '../stats';
import { CommandBase, formatDate, formatTime, mdBoldIf } from './util';

const MF_GROUPS: Record<string, string> = {
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

const CFB_CONFERENCES_TO_MF_GROUPS: Record<string, string> = {
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

export class AutocreateCommand implements CommandBase {
  static register(program: Command): Command {
    Log.debug('AutocreateCommand register');
    return program
      .command('autocreate')
      .option('--game <id>')
      .requiredOption('--week <number>')
      .addOption(new Option('--poll <poll>').choices(['ap', 'cfp']).makeOptionMandatory());
  }

  readonly rl = new ReadlinePrompter();
  matchingGames: Record<string, boolean> = {};

  async run(options: OptionValues): Promise<void> {
    const gameId = options.game;
    const week = +options.week;
    const poll = options.poll as 'ap' | 'cfp';
    Log.debug({ gameId, week, poll });

    this.rl.initialize();

    try {
      let mfUser: User;
      try {
        mfUser = await getUser(MF_API);
        Log.debug(`MF User ID: ${mfUser.id}`);
      } catch (e: unknown) {
        Log.error(`Could not get Manifold user details`, e);
        return;
      }

      let ranks: Record<string, number>;
      try {
        ranks = await getPollRanks(CFB_API, { week, poll });
      } catch (e: unknown) {
        Log.error(`Could not get poll ranking`, e);
        return;
      }

      let venues: Record<string, Venue>;
      try {
        venues = await getVenues(CFB_API);
      } catch (e: unknown) {
        Log.error(`Could not get venues`, e);
        return;
      }

      let games: Game[];
      try {
        games = await getGames(CFB_API, week);
        games = sortBy(games, g => g.start_date);
      } catch (e: unknown) {
        Log.error(`Could not get game schedule`, e);
        return;
      }

      try {
        this.matchingGames = JSON.parse(
          await readFile(join(process.cwd(), 'matching-games.json'), { encoding: 'utf-8', flag: 'r' })
        );
      } catch (e) {
        Log.error('Failed to load or parse matching games', e);
        return;
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

        const awayRank = ranks[game.away_team];
        const homeRank = ranks[game.home_team];
        const awayTeam = awayRank ? `#${awayRank} ${game.away_team}` : game.away_team;
        const homeTeam = homeRank ? `#${homeRank} ${game.home_team}` : game.home_team;

        let startDate = new Date(game.start_date);

        if (game.start_time_tbd || (startDate.getHours() === 23 && startDate.getMinutes() === 59)) {
          console.log(`${awayTeam} (${game.away_pregame_elo}) @ ${homeTeam} (${game.home_pregame_elo})`);
          const gameTime = await this.rl.answer('What time is this game?');
          const [gameTimeHours, gameTimeMinutes] = gameTime.split(':', 2).map(n => (n != null ? +n : 0));
          startDate = setHours(startDate, gameTimeHours);
          startDate = setMinutes(startDate, gameTimeMinutes);
        }

        const startTimestamp = new Date(startDate).getTime() + etOffset;
        const formattedStartDate = `${formatDate(startTimestamp)} at ${formatTime(startTimestamp)}`;

        console.log(
          `${formattedStartDate}: ${awayTeam} (${game.away_pregame_elo}) @ ${homeTeam} (${game.home_pregame_elo})`
        );

        let descriptionLines = [
          formattedStartDate +
            (venues[game.venue_id] ? ` in ${venues[game.venue_id].city}, ${venues[game.venue_id].state}.` : ''),
        ];

        const spread = await getGameSpread(CFB_API, game.id);
        if (spread != null) {
          descriptionLines.push(`Line: ${game.home_team} ${Number.isNaN(spread) || +spread < 0 ? '' : '+'}${+spread}.`);
        }

        const teamMatchups = await getTeamMatchups(CFB_API, {
          team1: game.away_team,
          team2: game.home_team,
        });

        if (teamMatchups.games.length > 0) {
          descriptionLines.push(`Head-to-head:`);

          const overall = [
            mdBoldIf(
              teamMatchups.team1Wins > teamMatchups.team2Wins,
              `${teamMatchups.team1} ${teamMatchups.team1Wins}`
            ),
            mdBoldIf(
              teamMatchups.team2Wins > teamMatchups.team1Wins,
              `${teamMatchups.team2} ${teamMatchups.team2Wins}`
            ),
            `Tie ${teamMatchups.ties}`,
          ];
          descriptionLines.push(`Overall: ${overall.join(', ')}`);

          const last5Rows = reverse(sortBy(teamMatchups.games, g => new Date(g.date))).slice(0, 5);
          const last5Team1Wins = last5Rows.filter(g =>
            g.awayTeam === teamMatchups.team1 ? g.awayScore > g.homeScore : g.homeScore > g.awayScore
          ).length;
          const last5Team2Wins = last5Rows.filter(g =>
            g.awayTeam === teamMatchups.team2 ? g.awayScore > g.homeScore : g.homeScore > g.awayScore
          ).length;
          const last5Ties = last5Rows.filter(g => g.homeScore === g.awayScore).length;

          if (
            last5Team1Wins !== teamMatchups.team1Wins ||
            last5Team2Wins !== teamMatchups.team2Wins ||
            last5Ties !== teamMatchups.ties
          ) {
            const last5 = [
              mdBoldIf(last5Team1Wins > last5Team2Wins, `${teamMatchups.team1} ${last5Team1Wins}`),
              mdBoldIf(last5Team2Wins > last5Team1Wins, `${teamMatchups.team2} ${last5Team2Wins}`),
              `Tie ${last5Ties}`,
            ];

            descriptionLines.push(`Last ${Math.min(teamMatchups.games.length, 5)}: ${last5.join(', ')}`);
          }
        }

        const descriptionMarkdown = descriptionLines.join('\n\n');
        const descriptionHtml = marked.parse(descriptionMarkdown);
        const descriptionContent = generateJSON(descriptionHtml, TIPTAP_EXTENSIONS);
        const descriptionText = generateText(descriptionContent, TIPTAP_EXTENSIONS);

        let matchingMarkets: (Market | undefined)[] = [];
        let alreadyMatched = false;
        const matchingGameKeys = Object.keys(this.matchingGames).filter(
          k => k.startsWith(`${game.id}_`) && this.matchingGames[k] != null
        );
        const matchingGameKey = matchingGameKeys.find(k => this.matchingGames[k]);
        if (matchingGameKey) {
          const [, matchingGameMfId] = matchingGameKey.split('_', 2);
          try {
            Log.debug(`Game ${game.id} was already marked as existing, getting market ${matchingGameMfId}`);
            const matchingMarket = await getMarket(MF_API, matchingGameMfId);
            matchingMarkets = matchingMarket ? [matchingMarket] : [];
            alreadyMatched = true;
          } catch (e: unknown) {
            Log.error(`Could not get matching market ${matchingGameMfId}`, e);
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
            Log.error(`Could not search for matching market`, e);
          }
        }

        let matchingMarket: Market | undefined;
        let canCreate = true;
        if (matchingMarkets.length > 0) {
          console.log('Found existing market(s):');

          for (const [market, i] of compact(matchingMarkets).map((m, i) => [m, i] as const)) {
            console.log(`${i + 1}. `, market.question);
          }

          if (alreadyMatched) {
            console.log('Already marked as existing - will not create');
            matchingMarket = first(matchingMarkets);
            canCreate = false;
          } else {
            const selectedMatch = await this.rl.select('Which market matches?', 1);
            if (selectedMatch === 'Q') {
              console.log('Quitting');
              break;
            }

            for (let [market, i] of matchingMarkets.map((m, i) => [m, i] as const)) {
              if (market && !Number.isNaN(selectedMatch) && selectedMatch === i + 1) {
                console.log('Market matches - will not create');
                this.matchingGames[`${game.id}_${market.id}`] = true;

                if (!market.groupSlugs) {
                  market = await getMarket(MF_API, market.id);
                }

                matchingMarket = market;
                canCreate = false;
              } else if (market) {
                this.matchingGames[`${game.id}_${market.id}`] = false;
              }
            }
          }
        }

        let createdMarket: Market | undefined = undefined;
        if (canCreate) {
          const createResponse = await this.rl.confirm('Create market?');
          if (createResponse === 'Y') {
            const newMarket: NewMarket = {
              question: `🏈 2023 NCAAF: Will ${awayTeam} beat ${homeTeam}?`,
              outcomeType: 'BINARY',
              descriptionMarkdown: descriptionMarkdown,
              closeTime: startDate.getTime() + MF_CLOSE_PADDING_MS,
              initialProb: 50,
              groupId: MF_GROUPS['college-football'],
            };

            const confirmCreate = await this.rl.confirm(`Create market ${JSON.stringify(newMarket, null, 2)}?`);
            if (confirmCreate === 'Y') {
              try {
                const response = await createMarket(MF_API, newMarket);
                if (response.ok) {
                  createdMarket = (await response.json()) as Market;
                  createdMarket.textDescription = descriptionText; // desc comes back as object
                  this.matchingGames[`${game.id}_${createdMarket.id}`] = true;
                  console.log('Market created', createdMarket);
                } else {
                  let error: { message: string } | undefined;
                  try {
                    error = await response.json();
                  } catch {}
                  Log.error('Failed to create market:', error?.message);
                }
              } catch (e) {
                Log.error('Failed to create market:', e);
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
                Log.error(`Failed to add ${groupId} to market ${market.id}`, e);
              }
            }
          } else {
            console.log('All groups already added');
          }

          if (groupsToRemove.length > 0) {
            const confirmRemoveGroups = await this.rl.confirm(
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
                  Log.error(`Failed to remove ${groupId} from market ${market.id}`, e);
                }
              }
            } else if (confirmRemoveGroups === 'Q') {
              break;
            }
          } else {
            console.log('No groups need removing');
          }

          const closeTimeMs = startDate.getTime() + MF_CLOSE_PADDING_MS;
          if (market.closeTime !== closeTimeMs) {
            Log.debug('market close time', market.closeTime, 'correct close time', closeTimeMs);
            const closeTime = new Date(closeTimeMs);
            if ((await this.rl.confirm(`Update close time to ${formatTime(closeTime, 'MT')}`)) === 'Q') {
              break;
            }
          }

          if (!isEqual(market.textDescription, descriptionText)) {
            const descriptionChanges = diffChars(market.textDescription, descriptionText);

            let markedUpDescription = '';
            let change: Change | undefined;
            while ((change = descriptionChanges.shift())) {
              if (change.added) {
                markedUpDescription += chalk.green.underline(change.value);
              } else if (change.removed) {
                markedUpDescription += chalk.red.strikethrough(change.value);
              } else {
                markedUpDescription += change.value;
              }
            }

            console.log('New:', descriptionText);
            console.log('Changes:', markedUpDescription);

            if ((await this.rl.confirm(`Update description`)) === 'Q') {
              break;
            }
          }
        }
      }
    } catch (e) {
      Log.error(e);
    }
  }

  async [Symbol.asyncDispose]() {
    this.rl[Symbol.asyncDispose]();

    // Store matching game mapping.
    const matchingGamesPath = join(process.cwd(), 'matching-games.json');
    await writeFile(matchingGamesPath, JSON.stringify(this.matchingGames, null, 2), {
      encoding: 'utf-8',
    });
  }
}

export {};
