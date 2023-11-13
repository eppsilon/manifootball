import {
  EspnClock,
  EspnFormat,
  EspnLeague,
  EspnLink,
  EspnLogo,
  EspnPeriod,
  EspnTeam,
  EspnVenue,
  EspnWeather,
} from './common';
import { EspnPickcenter } from './pickcenter';
import { EspnDrive } from './plays';
import {
  EspnFumblesStatisticsGroup,
  EspnInterceptionsStatisticsGroup,
  EspnKickReturnsStatisticsGroup,
  EspnKickingStatisticsGroup,
  EspnPassingStatisticsGroup,
  EspnPuntReturnsStatisticsGroup,
  EspnPuntingStatisticsGroup,
  EspnReceivingStatisticsGroup,
  EspnRushingStatisticsGroup,
  EspnStatistic,
} from './statistics';
import { EspnVideo } from './video';

export interface EspnWinProbabilityPlay {
  tiePercentage?: number;
  homeWinPercentage?: number;
  secondsLeft: number;
  playId: string;
}

export interface EspnLeader {
  name: 'passingYards' | 'rushingYards' | 'receivingYards';
  displayName: string;
  leaders: [
    {
      displayValue: string;
      athlete: {
        id: string;
        uid: string;
        guid: string;
        lastName: string;
        fullName: string;
        displayName: string;
        shortName: string;
        links: EspnLink[];
        headshot: {
          href: string;
          alt: string;
        };
        jersey: string;
        position: {
          abbreviation: 'QB' | 'RB' | 'WR';
        };
      };
    }
  ];
}

export interface EspnState {
  boxscore: {
    teams: [
      {
        team: EspnTeam;
        statistics: EspnStatistic[];
      },
      {
        team: EspnTeam;
        statistics: EspnStatistic[];
      }
    ];
    players: [
      {
        team: EspnTeam;
        statistics: [
          EspnPassingStatisticsGroup,
          EspnRushingStatisticsGroup,
          EspnReceivingStatisticsGroup,
          EspnFumblesStatisticsGroup,
          EspnInterceptionsStatisticsGroup,
          EspnKickReturnsStatisticsGroup,
          EspnPuntReturnsStatisticsGroup,
          EspnKickingStatisticsGroup,
          EspnPuntingStatisticsGroup
        ];
      },
      {
        team: EspnTeam;
        statistics: [
          EspnPassingStatisticsGroup,
          EspnRushingStatisticsGroup,
          EspnReceivingStatisticsGroup,
          EspnFumblesStatisticsGroup,
          EspnInterceptionsStatisticsGroup,
          EspnKickReturnsStatisticsGroup,
          EspnPuntReturnsStatisticsGroup,
          EspnKickingStatisticsGroup,
          EspnPuntingStatisticsGroup
        ];
      }
    ];
  };
  format: EspnFormat;
  gameInfo: {
    venue: EspnVenue;
    weather: EspnWeather;
  };
  drives: {
    current: EspnDrive;
    previous: EspnDrive[];
  };
  leaders: [
    {
      team: EspnTeam;
      leaders: EspnLeader[];
    },
    {
      team: EspnTeam;
      leaders: EspnLeader[];
    }
  ];
  broadcasts: [];
  predictor: {
    header: string;
    homeTeam: {
      id: string;
      gameProjection: string;
      teamChanceLoss: string;
    };
    awayTeam: {
      id: string;
      gameProjection: string;
      teamChanceLoss: string;
    };
  };
  pickcenter: EspnPickcenter[];
  againstTheSpread: [
    {
      team: EspnTeam;
      records: [];
    },
    {
      team: EspnTeam;
      records: [];
    }
  ];
  odds: [];
  winprobability: (EspnWinProbabilityPlay | null)[];
  videos: EspnVideo[];
  scoringPlays: [
    {
      id: string;
      type: {
        id: string;
        text: string;
        abbreviation: 'TD';
      };
      text: string;
      awayScore: number;
      homeScore: number;
      period: Pick<EspnPeriod, 'number'>;
      clock: EspnClock;
      team: EspnTeam;
      scoringType: {
        name: 'touchdown';
        displayName: string;
        abbreviation: 'TD';
      };
    },
    {
      id: string;
      type: {
        id: string;
        text: string;
        abbreviation: 'FG';
      };
      text: string;
      awayScore: number;
      homeScore: number;
      period: Pick<EspnPeriod, 'number'>;
      clock: EspnClock;
      team: EspnTeam;
      scoringType: {
        name: 'field-goal';
        displayName: string;
        abbreviation: 'FG';
      };
    },
    {
      id: string;
      type: {
        id: string;
        text: string;
        abbreviation: 'TD';
      };
      text: string;
      awayScore: number;
      homeScore: number;
      period: Pick<EspnPeriod, 'number'>;
      clock: EspnClock;
      team: EspnTeam;
      scoringType: {
        name: 'touchdown';
        displayName: string;
        abbreviation: 'TD';
      };
    },
    {
      id: string;
      type: {
        id: string;
        text: string;
        abbreviation: 'FG';
      };
      text: string;
      awayScore: number;
      homeScore: number;
      period: Pick<EspnPeriod, 'number'>;
      clock: EspnClock;
      team: EspnTeam;
      scoringType: {
        name: 'field-goal';
        displayName: string;
        abbreviation: 'FG';
      };
    },
    {
      id: string;
      type: {
        id: string;
        text: string;
        abbreviation: 'FG';
      };
      text: string;
      awayScore: number;
      homeScore: number;
      period: Pick<EspnPeriod, 'number'>;
      clock: EspnClock;
      team: EspnTeam;
      scoringType: {
        name: 'field-goal';
        displayName: string;
        abbreviation: 'FG';
      };
    },
    {
      id: string;
      type: {
        id: string;
        text: string;
        abbreviation: 'FG';
      };
      text: string;
      awayScore: number;
      homeScore: number;
      period: Pick<EspnPeriod, 'number'>;
      clock: EspnClock;
      team: EspnTeam;
      scoringType: {
        name: 'field-goal';
        displayName: string;
        abbreviation: 'FG';
      };
    },
    {
      id: string;
      type: {
        id: string;
        text: string;
        abbreviation: 'TD';
      };
      text: string;
      awayScore: number;
      homeScore: number;
      period: Pick<EspnPeriod, 'number'>;
      clock: EspnClock;
      team: EspnTeam;
      scoringType: {
        name: 'touchdown';
        displayName: string;
        abbreviation: 'TD';
      };
    },
    {
      id: string;
      type: {
        id: string;
        text: string;
        abbreviation: 'TD';
      };
      text: string;
      awayScore: number;
      homeScore: number;
      period: Pick<EspnPeriod, 'number'>;
      clock: EspnClock;
      team: EspnTeam;
      scoringType: {
        name: 'touchdown';
        displayName: string;
        abbreviation: 'TD';
      };
    },
    {
      id: string;
      type: {
        id: string;
        text: string;
        abbreviation: 'TD';
      };
      text: string;
      awayScore: number;
      homeScore: number;
      period: Pick<EspnPeriod, 'number'>;
      clock: EspnClock;
      team: EspnTeam;
      scoringType: {
        name: 'touchdown';
        displayName: string;
        abbreviation: 'TD';
      };
    }
  ];
  header: {
    id: string;
    uid: string;
    season: {
      year: number;
      type: number;
    };
    timeValid: boolean;
    competitions: [
      {
        id: string;
        uid: string;
        date: string;
        neutralSite: boolean;
        conferenceCompetition: boolean;
        boxscoreAvailable: boolean;
        commentaryAvailable: boolean;
        liveAvailable: boolean;
        onWatchESPN: boolean;
        recent: boolean;
        boxscoreSource: 'full';
        playByPlaySource: 'full';
        competitors: [
          {
            id: string;
            uid: string;
            order: number;
            homeAway: 'home';
            team: EspnTeam;
            score: string;
            linescores: [
              {
                displayValue: string;
              },
              {
                displayValue: string;
              },
              {
                displayValue: string;
              },
              {
                displayValue: string;
              }
            ];
            record: [
              {
                type: 'total';
                summary: string;
                displayValue: string;
              },
              {
                type: 'vsconf';
                summary: string;
                displayValue: string;
              }
            ];
            timeoutsUsed: number;
            possession: boolean;
            rank: number;
          },
          {
            id: string;
            uid: string;
            order: number;
            homeAway: 'away';
            team: EspnTeam;
            score: string;
            linescores: [
              {
                displayValue: string;
              },
              {
                displayValue: string;
              },
              {
                displayValue: string;
              },
              {
                displayValue: string;
              }
            ];
            record: [
              {
                type: 'total';
                summary: string;
                displayValue: string;
              },
              {
                type: 'vsconf';
                summary: string;
                displayValue: string;
              }
            ];
            timeoutsUsed: number;
            possession: boolean;
          }
        ];
        status: {
          displayClock: string;
          period: EspnPeriod['number'];
          type: {
            id: string;
            name: 'STATUS_IN_PROGRESS';
            state: 'in';
            completed: boolean;
            description: string;
            detail: string;
            shortDetail: string;
          };
        };
        broadcasts: [
          {
            type: {
              id: string;
              shortName: string;
            };
            market: {
              id: string;
              type: 'National';
            };
            media: {
              shortName: string;
            };
            lang: 'en';
            region: 'us';
          }
        ];
        groups: {
          id: string;
          name: string;
          abbreviation: string;
          shortName: string;
          midsizeName: string;
        };
      }
    ];
    links: EspnLink[];
    week: number;
    league: EspnLeague;
  };
  standings: {
    fullViewLink: {
      text: string;
      href: string;
    };
    groups: [
      {
        standings: {
          entries: [
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            },
            {
              team: string;
              link: string;
              id: string;
              uid: string;
              stats: [
                {
                  id: string;
                  name: 'overall';
                  abbreviation: 'overall';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'total';
                  summary: string;
                  displayValue: string;
                },
                {
                  id: string;
                  name: string;
                  abbreviation: 'CONF';
                  displayName: string;
                  shortDisplayName: string;
                  description: string;
                  type: 'vsconf';
                  summary: string;
                  displayValue: string;
                }
              ];
              logo: EspnLogo[];
            }
          ];
        };
        header: string;
      }
    ];
  };
}
