import { EspnAthlete } from './common';

type RelatedArray<T> = { [K in keyof T]: string };

export interface EspnStatistic {
  name:
    | 'firstDowns'
    | 'thirdDownEff'
    | 'fourthDownEff'
    | 'totalYards'
    | 'netPassingYards'
    | 'completionAttempts'
    | 'yardsPerPass'
    | 'rushingYards'
    | 'rushingAttempts'
    | 'yardsPerRushAttempt'
    | 'totalPenaltiesYards'
    | 'turnovers'
    | 'fumblesLost'
    | 'interceptions'
    | 'possessionTime';
  displayValue: string;
  label: string;
}

export interface EspnStatisticsGroup<TKeys extends string[]> {
  name:
    | 'passing'
    | 'rushing'
    | 'receiving'
    | 'fumbles'
    | 'interceptions'
    | 'kickReturns'
    | 'puntReturns'
    | 'kicking'
    | 'punting';
  keys: TKeys;
  text: string;
  labels: RelatedArray<TKeys>;
  descriptions: RelatedArray<TKeys>;
  athletes: {
    athlete: EspnAthlete;
    stats: RelatedArray<TKeys>;
  }[];
  totals: RelatedArray<TKeys>;
}

export interface EspnPassingStatisticsGroup
  extends EspnStatisticsGroup<
    ['completions/passingAttempts', 'passingYards', 'yardsPerPassAttempt', 'passingTouchdowns', 'interceptions']
  > {
  name: 'passing';
  labels: ['C/ATT', 'YDS', 'AVG', 'TD', 'INT'];
  descriptions: ['Completions/Attempts', 'Yards', 'Yards Per Pass Attempt', 'Touchdowns', 'Interceptions'];
}

export interface EspnRushingStatisticsGroup
  extends EspnStatisticsGroup<
    ['rushingAttempts', 'rushingYards', 'yardsPerRushAttempt', 'rushingTouchdowns', 'longRushing']
  > {
  name: 'rushing';
  labels: ['CAR', 'YDS', 'AVG', 'TD', 'LONG'];
  descriptions: ['Rushing Attempts', 'Yards', 'Yards Per Rushing Attempt', 'Touchdowns', 'Longest Run'];
}

export interface EspnReceivingStatisticsGroup
  extends EspnStatisticsGroup<
    ['receptions', 'receivingYards', 'yardsPerReception', 'receivingTouchdowns', 'longReception']
  > {
  name: 'receiving';
  labels: ['REC', 'YDS', 'AVG', 'TD', 'LONG'];
  descriptions: ['Receptions', 'Yards', 'Yards Per Reception', 'Touchdowns', 'Longest Reception'];
}

export interface EspnFumblesStatisticsGroup
  extends EspnStatisticsGroup<['fumbles', 'fumblesLost', 'fumblesRecovered']> {
  name: 'fumbles';
  labels: ['FUM', 'LOST', 'REC'];
  descriptions: ['Fumbles', 'Fumbles Lost', 'Fumbles Recovered'];
}

export interface EspnInterceptionsStatisticsGroup
  extends EspnStatisticsGroup<['interceptions', 'interceptionYards', 'interceptionTouchdowns']> {
  name: 'interceptions';
  labels: ['INT', 'YDS', 'TD'];
  descriptions: ['Interceptions', 'Yards', 'Touchdowns'];
}

export interface EspnKickReturnsStatisticsGroup
  extends EspnStatisticsGroup<
    ['kickReturns', 'kickReturnYards', 'yardsPerKickReturn', 'longKickReturn', 'kickReturnTouchdowns']
  > {
  name: 'kickReturns';
  labels: ['NO', 'YDS', 'AVG', 'LONG', 'TD'];
  descriptions: ['Kick Returns', 'Yards', 'Yards Per Kick Return', 'Longest Kick Return', 'Touchdowns'];
}

export interface EspnPuntReturnsStatisticsGroup
  extends EspnStatisticsGroup<
    ['puntReturns', 'puntReturnYards', 'yardsPerPuntReturn', 'longPuntReturn', 'puntReturnTouchdowns']
  > {
  name: 'puntReturns';
  labels: ['NO', 'YDS', 'AVG', 'LONG', 'TD'];
  descriptions: ['Punt Returns', 'Yards', 'Yards Per Punt Return', 'Longest Punt Return', 'Touchdowns'];
}

export interface EspnKickingStatisticsGroup
  extends EspnStatisticsGroup<
    [
      'fieldGoalsMade/fieldGoalAttempts',
      'fieldGoalPct',
      'longFieldGoalMade',
      'extraPointsMade/extraPointAttempts',
      'totalKickingPoints'
    ]
  > {
  name: 'kicking';
  labels: ['FG', 'PCT', 'LONG', 'XP', 'PTS'];
  descriptions: [
    'Field Goals Made/Attempts',
    'Field Goal Percentage',
    'Longest Field Goal Made',
    'Extra Points Made/Attempts',
    'Kicking Points'
  ];
}

export interface EspnPuntingStatisticsGroup
  extends EspnStatisticsGroup<['punts', 'puntYards', 'grossAvgPuntYards', 'touchbacks', 'puntsInside20', 'longPunt']> {
  name: 'punting';
  labels: ['NO', 'YDS', 'AVG', 'TB', 'In 20', 'LONG'];
  descriptions: ['Punts', 'Yards', 'Average Punt Yards', 'Touchbacks', 'Punts Inside 20', 'Longest Punt'];
}
