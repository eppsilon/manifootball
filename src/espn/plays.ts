import { EspnClock, EspnDown, EspnLink, EspnPeriod, EspnTeam } from './common';

export interface EspnDrivePoint {
  period: EspnPeriod;
  clock?: EspnClock;
  yardLine: number;
  text: string;
}

interface EspnPlaySituation {
  down: EspnDown;
  distance: number;
  yardLine: number;
  yardsToEndzone: number;
  downDistanceText: string;
  shortDownDistanceText: string;
  possessionText: string;
  team: Pick<EspnTeam, 'id'>;
}

export interface EspnDrivePlay {
  id: string;
  sequenceNumber: string;
  type?: {
    id: string;
    text: string;
    abbreviation?: 'RUSH' | 'TO' | 'PEN' | 'REC' | 'K' | 'PUNT' | 'FGM' | 'EP' | 'EH' | 'FG';
  };
  text?: string;
  awayScore?: number;
  homeScore?: number;
  period?: Pick<EspnPeriod, 'number'>;
  clock: EspnClock;
  scoringPlay?: boolean;
  priority?: boolean;
  scoreValue?: number;
  modified?: string;
  wallclock?: string;
  start?: EspnPlaySituation;
  end?: EspnPlaySituation;
  statYardage?: number;
  participants?: [
    {
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
          name: string;
          displayName: string;
          abbreviation: 'QB';
        };
        team: Pick<EspnTeam, 'abbreviation'>;
      };
      stats: [
        {
          name: 'C/ATT';
          displayValue: string;
        },
        {
          name: 'YDS';
          displayValue: string;
        },
        {
          name: 'TD';
          displayValue: string;
        },
        {
          name: 'INT';
          displayValue: string;
        }
      ];
      type: 'passer';
    },
    {
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
          name: string;
          displayName: string;
          abbreviation: 'WR';
        };
        team: Pick<EspnTeam, 'abbreviation'>;
      };
      stats: [
        {
          name: 'REC';
          displayValue: string;
        },
        {
          name: 'YDS';
          displayValue: string;
        },
        {
          name: 'TD';
          displayValue: string;
        }
      ];
      type: 'receiver';
    }
  ];
  pointAfterAttempt?: {
    id: number;
    text: string;
    abbreviation: 'NA' | 'Extra Point Good';
    value: number;
  };
  mediaId?: number;
  scoringType?: {
    name: 'touchdown' | 'field-goal';
    displayName: string;
    abbreviation: 'TD' | 'FG';
  };
}

export interface EspnDrive {
  id: string;
  description: string;
  team: EspnTeam;
  start: EspnDrivePoint;
  timeElapsed: {
    displayValue: string;
  };
  yards: number;
  isScore: boolean;
  offensivePlays: number;
  result: 'PUNT' | 'TD' | 'MISSED FG' | 'FG' | 'END OF HALF' | 'FUMBLE';
  shortDisplayResult: string;
  displayResult: string;
  plays: (EspnDrivePlay | null)[];
}
