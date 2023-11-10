import { Chalk } from 'chalk';
import { Command, Option, OptionValues } from 'commander';
import { addDays } from 'date-fns';
import { sortBy } from 'lodash-es';
import { readFile } from 'node:fs/promises';
import { table } from 'table';
import { CFB_API, MF_API } from '../config';
import { Market, getMarket } from '../manifold';
import { Game, ScoreboardGame, Team, getGames, getScoreboard, getTeams } from '../stats';

const chalk = new Chalk({ level: 3 });

export class ScoreboardCommand implements AsyncDisposable {
  constructor(program: Command) {
    program
      .command('scoreboard')
      .addOption(new Option('--classification <classification>').choices(['fbs', 'fcs', 'ii', 'iii']).default('fbs'))
      .addOption(
        new Option('--conference <conference>').choices([
          'acc',
          'b12',
          'b1g',
          'sec',
          'pac',
          'cusa',
          'mac',
          'wac',
          'mwc',
          'ind',
          'atl10',
          'maac',
          'big sky',
          'mvfc',
          'ivy',
          'meac',
          'nec',
          'ovc',
          'patriot',
          'pioneer',
          'southern',
          'southland',
          'swac',
          'indaa',
          'sbc',
          'big south',
          'gwest',
          'caa',
          'aac',
          'western',
          'mviaa',
          'rmc',
          'swc',
          'pcc',
          'big 6',
          'mvc',
          'msac',
        ])
      )
      .addOption(new Option('--status <status...>').choices(['scheduled', 'in_progress', 'completed']))
      .addOption(new Option('--date <date>').default('any'))
      .option('--unresolved')
      .option('--week <number>')
      .action(options => this.run(options));
  }

  async run(options: OptionValues) {
    const week = +options.week;

    let matchingGames: Record<string, boolean>;
    try {
      matchingGames = JSON.parse(await readFile('./matching-games.json', { encoding: 'utf-8' }));
    } catch {
      matchingGames = {};
    }

    const gameMarkets = Object.fromEntries(
      Object.entries(matchingGames)
        .filter(([, match]) => match)
        .map(([ids]) => ids.split('_', 2))
    ) as Record<string, string>;

    // console.log('scoreboard');
    // console.log('classification', options.classification as string);
    // console.log('conference', options.conference as string);
    // console.log('status', options.status as string[]);
    // console.log('date', options.date as string);

    const weekGames = Object.fromEntries((await getGames(CFB_API, week)).map(game => [game.id, game]));
    const scoreboardGames = await getScoreboard(CFB_API, options.classification, options.conference);
    const teams = Object.fromEntries((await getTeams(CFB_API)).map(team => [team.id, team])) as Record<number, Team>;
    const now = new Date();
    const scoreboardGames2 = await Promise.all(
      scoreboardGames
        .filter(game => {
          if (options.status && !options.status.includes(game.status)) {
            return false;
          }

          if (options.date === 'any') {
            return true;
          }

          if (options.date === 'yesterday' || options.date === 'today' || options.date === 'tomorrow') {
            const gameDate = new Date(game.startDate);
            const compareTo =
              options.date === 'yesterday' ? addDays(now, -1) : options.date === 'tomorrow' ? addDays(now, 1) : now;
            return (
              gameDate.getFullYear() === compareTo.getFullYear() &&
              gameDate.getMonth() === compareTo.getMonth() &&
              gameDate.getDate() === compareTo.getDate()
            );
          }

          return true;
        })
        .map(async game => {
          const marketId = gameMarkets[game.id];
          const market = marketId ? await getMarket(MF_API, marketId) : undefined;
          return [game, market] as [ScoreboardGame, Market];
        })
    );
    const gameRows = sortBy(
      scoreboardGames2.filter(([, market]) => !options.unresolved || !market?.isResolved),
      ([game]) => {
        const periodSeconds = (4 - (game.period || 0)) * 15 * 60;
        const clockSeconds =
          game.clock
            ?.split(':', 3)
            .map(n => +n)
            .reduce((t, c, i) => t + (i === 1 ? c * 60 : i === 2 ? c : 0)) || 0;
        return periodSeconds + clockSeconds;
      }
    ).map(([game, market]) => {
      const weekGame = weekGames[game.id];
      const marketCell = market
        ? market.isResolved
          ? market.resolution === 'YES'
            ? chalk.green('YES')
            : chalk.red('NO')
          : `${Math.round(market.probability * 100)}%`
        : 'None';
      const startDate = new Date(new Date(game.startDate).getTime() + 3 * 60 * 60 * 1000);
      const startTimeMinutes = `${startDate.getMinutes()}`.padStart(2, '0');
      const startDateCell = `${
        startDate.getMonth() + 1
      }/${startDate.getDate()} @ ${startDate.getHours()}:${startTimeMinutes}`;
      const statusCell =
        game.status === 'completed'
          ? 'Final'
          : game.status === 'in_progress'
          ? `${
              game.period === 1
                ? '1st '
                : game.period === 2
                ? '2nd '
                : game.period === 3
                ? '3rd '
                : game.period === 4
                ? '4th '
                : ' '
            }${game.clock}`
          : 'Scheduled';
      const winning =
        game.awayTeam.points > game.homeTeam.points
          ? 'away'
          : game.homeTeam.points > game.awayTeam.points
          ? 'home'
          : undefined;
      const awayName = winning === 'away' ? chalk.bold(weekGame.away_team) : weekGame.away_team;
      const homeName = winning === 'home' ? chalk.bold(weekGame.home_team) : weekGame.home_team;
      const awayCell = (game.status === 'in_progress' && game.possession === 'away' ? '● ' : '') + awayName;
      const homeCell = homeName + (game.status === 'in_progress' && game.possession === 'home' ? ' ●' : '');
      const situationCell = this.getSituationCell(game, weekGame, teams);
      return [
        game.id,
        marketCell,
        startDateCell,
        awayCell,
        game.status !== 'scheduled' ? `${game.awayTeam.points}-${game.homeTeam.points}` : 'N/A',
        homeCell,
        statusCell,
        situationCell,
      ];
    });
    const rows = [['ID', 'Market', 'Start', 'Away', 'Score', 'Home', 'Status', 'Sitch'], ...gameRows];
    console.log(
      table(rows, {
        columns: [{}, { alignment: 'right' }, {}, { alignment: 'right' }, { alignment: 'center' }, {}, {}],
      })
    );
  }

  private getSituationCell(game: ScoreboardGame, weekGame: Game, teams: Record<number, Team>) {
    if (game.status === 'completed') {
      return 'Game over';
    }

    if (game.status === 'in_progress') {
      const awayTeam = teams[game.awayTeam.id];
      const homeTeam = teams[game.homeTeam.id];

      if (game.situation?.startsWith(awayTeam.abbreviation) || game.situation?.startsWith(homeTeam.abbreviation)) {
        return chalk.green.bold(game.situation);
      }

      let offTeam: Team, defTeam: Team;
      if (game.possession === 'away') {
        offTeam = awayTeam;
        defTeam = homeTeam;
      } else if (game.possession === 'home') {
        offTeam = homeTeam;
        defTeam = awayTeam;
      } else {
        return 'N/A';
      }

      const sitchRegex = new RegExp(
        `^(\\d+)(?:st|nd|rd|th)\\s+&\\s+(\\d+)\\s+at\\s+${defTeam.abbreviation}\\s+(\\d+)$`,
        'i'
      );
      const sitchMatches = game.situation.match(sitchRegex);
      // console.log(sitchRegex);
      // console.log(sitchMatches);

      let redZone = false;
      let yellowZone = false;

      if (sitchMatches?.length) {
        const [, down, distance, line] = sitchMatches;
        if (+line <= 25) {
          redZone = true;
        } else {
          yellowZone = true;
        }

        // console.log({ down, distance, line, redZone, yellowZone });
      }

      if (redZone) {
        return chalk.red.bold(game.situation);
      }

      if (yellowZone) {
        return chalk.yellow.bold(game.situation);
      }

      return game.situation || 'Unknown';
    }

    return 'N/A';
  }

  async [Symbol.asyncDispose]() {}
}
