import { EspnLink, EspnLogo } from './common';

export interface EspnPickcenter {
  provider: {
    id: string;
    name: string;
    priority: number;
    logos: EspnLogo[];
  };
  details: string;
  overUnder: number;
  spread: number;
  overOdds: number;
  underOdds: number;
  awayTeamOdds: {
    favorite: boolean;
    underdog: boolean;
    moneyLine: number;
    spreadOdds: number;
    open: {
      pointSpread: {
        alternateDisplayValue: string;
      };
      spread: {
        value: number;
        displayValue: string;
        alternateDisplayValue: string;
      };
      moneyLine: {
        value: number;
        displayValue: string;
        alternateDisplayValue: string;
      };
    };
    current: {
      pointSpread: {
        alternateDisplayValue: string;
      };
      spread: {
        value: number;
        displayValue: string;
        alternateDisplayValue: string;
      };
      moneyLine: {
        value: number;
        displayValue: string;
        alternateDisplayValue: string;
      };
    };
    teamId: string;
  };
  homeTeamOdds: {
    favorite: boolean;
    underdog: boolean;
    moneyLine: number;
    spreadOdds: number;
    open: {
      pointSpread: {
        alternateDisplayValue: string;
      };
      spread: {
        value: number;
        displayValue: string;
        alternateDisplayValue: string;
      };
      moneyLine: {
        value: number;
        displayValue: string;
        alternateDisplayValue: string;
      };
    };
    current: {
      pointSpread: {
        alternateDisplayValue: string;
      };
      spread: {
        value: number;
        displayValue: string;
        alternateDisplayValue: string;
      };
      moneyLine: {
        value: number;
        displayValue: string;
        alternateDisplayValue: string;
      };
    };
    teamId: string;
  };
  links: EspnLink[];
  open: {
    over: {
      value: number;
      displayValue: string;
      alternateDisplayValue: string;
    };
    under: {
      value: number;
      displayValue: string;
      alternateDisplayValue: string;
    };
    total: {
      alternateDisplayValue: string;
    };
  };
  current: {
    over: {
      value: number;
      displayValue: string;
      alternateDisplayValue: string;
    };
    under: {
      value: number;
      displayValue: string;
      alternateDisplayValue: string;
    };
    total: {
      alternateDisplayValue: string;
    };
  };
  moneyline: {
    displayName: string;
    shortDisplayName: string;
    home: {
      close: {
        odds: string;
        link: EspnLink;
      };
      open: {
        odds: string;
      };
    };
    away: {
      close: {
        odds: string;
        link: EspnLink;
      };
      open: {
        odds: string;
      };
    };
  };
  pointSpread: {
    displayName: string;
    shortDisplayName: string;
    home: {
      close: {
        line: string;
        odds: string;
        link: EspnLink;
      };
      open: {
        line: string;
        odds: string;
      };
    };
    away: {
      close: {
        line: string;
        odds: string;
        link: EspnLink;
      };
      open: {
        line: string;
        odds: string;
      };
    };
  };
  total: {
    displayName: string;
    shortDisplayName: string;
    over: {
      close: {
        line: string;
        odds: string;
        link: EspnLink;
      };
      open: {
        line: string;
        odds: string;
      };
    };
    under: {
      close: {
        line: string;
        odds: string;
        link: EspnLink;
      };
      open: {
        line: string;
        odds: string;
      };
    };
  };
  link: EspnLink;
}
