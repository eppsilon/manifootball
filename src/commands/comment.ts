import { Command, OptionValues } from 'commander';
import { reverse, sortBy } from 'lodash-es';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CFB_API, MF_API } from '../config';
import { Log } from '../log';
import { User, createComment, getMarket, getUser } from '../manifold';
import { ReadlinePrompter } from '../readline';
import { Game, getGameSpread, getGames, getTeamMatchups } from '../stats';
import { CommandBase, formatDate, formatSpread, mdBoldIf } from './util';

export class CommentCommand implements CommandBase {
  static register(program: Command): Command {
    Log.debug('CommentCommand register');
    return program.command('comment').option('--game <id>').requiredOption('--week <number>');
  }

  readonly rl = new ReadlinePrompter();

  matchingGames: Record<string, boolean> = {};

  async run(options: OptionValues): Promise<void> {
    const gameId = options.game;
    const week = +options.week;

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

      for (let game of games) {
        if (gameId && `${game.id}` !== gameId) {
          continue;
        }

        const startDate = new Date(game.start_date);
        if (startDate < new Date()) {
          continue;
        }

        console.log('-'.repeat(80));
        console.log(
          `${startDate.toLocaleString()}: ` +
            `${game.away_team} (${game.away_pregame_elo}) @ ` +
            `${game.home_team} (${game.home_pregame_elo})`
        );

        const matchingGameKeys = Object.keys(this.matchingGames).filter(
          k => k.startsWith(`${game.id}_`) && this.matchingGames[k] != null
        );
        const matchingGameKey = matchingGameKeys.find(k => this.matchingGames[k]) || '';
        const [, marketId] = matchingGameKey.split('_', 2);
        if (!marketId) {
          Log.debug(`No matching market for game ${game.id} - skipping`);
          continue;
        }

        const market = await getMarket(MF_API, marketId);
        const [, marketSpreadTeam, marketSpreadPoints] =
          market?.textDescription.match(/ line: (.+?) (-?\d+(?:\.\d+)?)/i) || [];

        let content: string[] = [];

        const spread = await getGameSpread(CFB_API, game.id);
        if (spread != null && (marketSpreadTeam !== game.home_team || +marketSpreadPoints !== +spread)) {
          const marketSpread = formatSpread(marketSpreadTeam, marketSpreadPoints);
          const currentSpread = formatSpread(game.home_team, spread);

          let changeIndicator = '✨';
          if (marketSpreadTeam && marketSpreadPoints != null) {
            const flipIndicator =
              (+marketSpreadPoints > 0 && +spread < 0) || (+marketSpreadPoints < 0 && +spread > 0) ? '🔀' : '';
            const sizeIndicator = Math.abs(+marketSpreadPoints) < Math.abs(+spread) ? `🔼` : `🔽`;
            changeIndicator = `${marketSpread} ${sizeIndicator}${flipIndicator}`;
          }

          content.push(`**Line update:** ${changeIndicator} ${currentSpread}.`);
        }

        const teamMatchups = await getTeamMatchups(CFB_API, {
          team1: game.away_team,
          team2: game.home_team,
        });

        if (teamMatchups.games.length > 0) {
          content.push(`**Head-to-head:**`);

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
          content.push(`Overall: ${overall.join(', ')}`);

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

            content.push(`Last ${Math.min(teamMatchups.games.length, 5)}: ${last5.join(', ')}`);

            // TODO: Enable if comments support tables or fix formatting...
            if (false) {
              content.push(
                `| Date | Away |   | Home | Score |\n` +
                  `| ---- | ---- | - | ---- | ----- |\n` +
                  last5Rows
                    .map(g => {
                      const matchupDate = new Date(g.date);
                      const matchupCols = [
                        `${formatDate(matchupDate)}`,
                        mdBoldIf(g.awayScore > g.homeScore, g.awayTeam),
                        '@',
                        mdBoldIf(g.homeScore > g.awayScore, g.homeTeam),
                        `${g.awayScore}-${g.homeScore}`,
                      ];
                      return `| ${matchupCols.join(' | ')} |`;
                    })
                    .join('\n')
              );
            }
          }
        }

        if (content.length === 0) {
          console.log('No content for comment - skipping');
          continue;
        }

        const contentText = content.join('\n\n');

        console.log(`Comment:\n${contentText}`);

        const confirmCreate = await this.rl.confirm('Create comment?');
        if (confirmCreate === 'Y') {
          try {
            const response = await createComment(MF_API, { marketId, content: contentText });
            if (response.ok) {
              const createdComment = await response.json();
              console.log('Comment created', createdComment);
            } else {
              let error: { message: string } | undefined;
              try {
                error = await response.json();
              } catch {}
              Log.error('Failed to create comment:', error?.message);
            }
          } catch (e) {
            Log.error('Failed to create comment:', e);
          }
        } else if (confirmCreate === 'N') {
          console.log('Skipped creating comment');
        } else {
          console.log('Quitting');
          break;
        }
      }
    } catch (e) {
      Log.error(e);
    }
  }

  async [Symbol.asyncDispose]() {
    await this.rl[Symbol.asyncDispose]();
  }
}
