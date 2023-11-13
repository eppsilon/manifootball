export interface EspnVideo {
  source: 'espn';
  id: number;
  headline: string;
  description: string;
  ad: {
    sport: 'ncf';
    bundle: 'ncf_top_plays';
  };
  tracking: {
    sportName: 'ncf';
    leagueName: string;
    coverageType: 'OnePlay';
    trackingName: string;
    trackingId: string;
  };
  cerebroId: string;
  lastModified: string;
  originalPublishDate: string;
  timeRestrictions: {
    embargoDate: string;
    expirationDate: string;
  };
  deviceRestrictions: {
    type: 'whitelist';
    devices: ('desktop' | 'settop' | 'handset' | 'tablet')[];
  };
  duration: number;
  thumbnail: string;
  links: {
    api: {
      self: {
        href: string;
      };
      artwork: {
        href: string;
      };
    };
    web: {
      href: string;
      short: {
        href: string;
      };
      self: {
        href: string;
      };
    };
    source: {
      mezzanine: {
        href: string;
      };
      flash: {
        href: string;
      };
      hds: {
        href: string;
      };
      HLS: {
        href: string;
        HD: {
          href: string;
        };
      };
      HD: {
        href: string;
      };
      full: {
        href: string;
      };
      href: string;
    };
    mobile: {
      alert: {
        href: string;
      };
      source: {
        href: string;
      };
      href: string;
      streaming: {
        href: string;
      };
      progressiveDownload: {
        href: string;
      };
    };
  };
  playId: string;
}
