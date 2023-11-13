export interface EspnLink {
  rel: (
    | 'bets'
    | 'espn-bet'
    | 'home'
    | 'away'
    | 'homeSpread'
    | 'awaySpread'
    | 'over'
    | 'under'
    | 'game'
    | 'playercard'
    | 'athlete'
    | 'league'
    | 'index'
    | 'boxscore'
    | 'pbp'
    | 'teamstats'
    | 'live'
    | 'videos'
    | 'desktop'
    | 'event'
    | 'index'
    | 'schedule'
    | 'standings'
    | 'rankings'
    | 'teams'
    | 'stats'
    | 'scores'
    | 'sportscenter'
    | 'app'
  )[];
  href: string;
  text: string;
  shortText?: string;
  isExternal?: boolean;
  isPremium?: boolean;
  language?: 'en-US';
}

export interface EspnLeague {
  id: string;
  uid: string;
  name: string;
  abbreviation: string;
  midsizeName: string;
  slug: string;
  isTournament: boolean;
  links: EspnLink[];
}

export interface EspnPeriod {
  type: 'quarter';
  number: 1 | 2 | 3 | 4;
}

export interface EspnClock {
  displayValue: number;
  value?: number;
}

export interface EspnLogo {
  href: string;
  width?: number;
  height?: number;
  alt?: string;
  rel: ('full' | 'light' | 'dark' | 'default')[];
  lastUpdated?: string;
}

export interface EspnAthlete {
  id: string;
  uid: string;
  guid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  links: EspnLink[];
}

export type EspnDown = 1 | 2 | 3 | 4;

export interface EspnFormat {
  regulation: {
    periods: number;
    displayName: string;
    slug: 'quarter';
    clock: number;
  };
  overtime: {
    periods: number;
    displayName: string;
    slug: 'untimed';
  };
}

export interface EspnTeam {
  id: string;
  uid: string;
  slug: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  logo: string;
  logos?: EspnLogo[];
  links?: {
    href: string;
    text: string;
  }[];
}

export interface EspnVenue {
  id: string;
  fullName: string;
  address: {
    city: string;
    state: string;
    zipCode: string;
  };
  capacity: number;
  grass: boolean;
  images: [
    {
      href: string;
      width: number;
      height: number;
      alt: string;
      rel: ('full' | 'day' | 'interior')[];
    }
  ];
}

export interface EspnWeather {
  temperature: number;
  highTemperature: number;
  lowTemperature: number;
  conditionId: string;
  gust: number;
  precipitation: number;
  link: EspnLink;
}
