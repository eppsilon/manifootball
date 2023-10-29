export interface User {
  isBannedFromPosting: boolean;
  createdTime: number;
  id: string;
  followerCountCached: number;
  shouldShowWelcome: boolean;
  freeQuestionsCreated: number;
  username: string;
  name: string;
  avatarUrl: string;
  streakForgiveness: number;
  currentBettingStreak: number;
  metricsLastUpdated: number;
  profitCached: {
    daily: number;
    monthly: number;
    weekly: number;
    allTime: number;
  };
  creatorTraders: {
    daily: number;
    monthly: number;
    weekly: number;
    allTime: number;
  };
  nextLoanCached: number;
  totalDeposits: number;
  balance: number;
  lastBetTime: number;
}

export async function getUser({ apiUrl, apiKey }: { apiUrl: string; apiKey: string }): Promise<User> {
  const url = new URL(`${apiUrl}/me`);
  const response = await fetch(url, { method: 'get', headers: { authorization: `Key ${apiKey}` } });
  const result = response.json();
  return result;
}

export interface NewMarket {
  outcomeType: 'BINARY' | 'MULTIPLE_CHOICE' | 'PSEUDO_NUMERIC' | 'POLL' | 'BOUNTIED_QUESTION';
  question: string;
  description?: string;
  descriptionMarkdown?: string;
  descriptionHtml?: string;
  closeTime?: number; // Unix timestamp (ms)
  visibility?: 'public' | 'unlisted';
  groupId?: string;
  initialProb?: number; // 1 to 99
}

export interface Market {
  id: string;
  creatorId: string;
  creatorUsername: string;
  creatorName: string;
  createdTime: number;
  creatorAvatarUrl: string;
  closeTime: number;
  question: string;
  url: string;
  pool: {
    NO: number;
    YES: number;
  };
  probability: number;
  p: number;
  totalLiquidity: number;
  outcomeType: 'BINARY';
  mechanism: 'cpmm-1';
  volume: number;
  volume24Hours: number;
  isResolved: true;
  resolution: 'NO' | 'YES';
  resolutionTime: number;
  resolutionProbability: number;
  lastUpdatedTime: number;
  coverImageUrl: string;
  textDescription: string;
  groupSlugs?: string[];
  description?: { type: 'doc'; content: { type: 'paragraph'; content: { type: 'text'; text: string } } };
}

export async function searchMarkets(
  { apiUrl, apiKey }: { apiUrl: string; apiKey: string },
  terms: string
): Promise<Market[]> {
  const url = new URL(`${apiUrl}/search-markets`);
  url.searchParams.set('terms', terms);
  const response = await fetch(url, {
    method: 'get',
    headers: { authorization: `Key ${apiKey}` },
  });
  const results = (await response.json()) as Market[];
  return results;
}

export async function getMarket(
  { apiUrl, apiKey }: { apiUrl: string; apiKey: string },
  marketId: string
): Promise<Market> {
  const url = new URL(`${apiUrl}/market/${marketId}`);
  const response = await fetch(url, {
    method: 'get',
    headers: { authorization: `Key ${apiKey}` },
  });
  const market = (await response.json()) as Market;
  return market;
}

export function createMarket(
  { apiUrl, apiKey }: { apiUrl: string; apiKey: string },
  market: NewMarket
): Promise<Response> {
  const response = fetch(`${apiUrl}/market`, {
    method: 'post',
    headers: { authorization: `Key ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(market),
  });
  return response;
}

export function editMarketGroup(
  { apiUrl, apiKey }: { apiUrl: string; apiKey: string },
  marketId: string,
  groupId: string,
  remove = false
): Promise<Response> {
  const response = fetch(`${apiUrl}/market/${marketId}/group`, {
    method: 'post',
    headers: { authorization: `Key ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(remove ? { groupId, remove } : { groupId }),
  });
  return response;
}

export async function resolveMarket(
  { apiUrl, apiKey }: { apiUrl: string; apiKey: string },
  marketId: string,
  outcome: 'YES' | 'NO' | 'MKT' | 'CANCEL'
): Promise<Response> {
  const response = await fetch(`${apiUrl}/market/${marketId}/resolve`, {
    method: 'post',
    headers: { authorization: `Key ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ outcome }),
  });
  console.debug('resolveMarket()', response);
  return response;
}
