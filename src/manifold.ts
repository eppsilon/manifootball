import { join } from 'node:path';
import * as cache from './cache';
import { Log } from './log';

export interface Config {
  apiUrl: string;
  apiKey: string;
  cachePath: string;
}

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

export async function getUser({ apiUrl, apiKey }: Config): Promise<User> {
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
  { apiUrl, apiKey, cachePath }: Config,
  {
    terms,
    filter,
    creatorId,
  }: {
    terms?: string;
    filter?: 'all' | 'open' | 'closed' | 'resolved' | 'closing-this-month' | 'closing-next-month';
    creatorId?: string;
  }
): Promise<Market[]> {
  cachePath = join(cachePath, 'search-markets');
  const url = new URL(`${apiUrl}/search-markets`);

  if (terms) {
    url.searchParams.set('term', terms);
  }

  if (filter) {
    url.searchParams.set('filter', filter);
  }

  if (creatorId) {
    url.searchParams.set('creatorId', creatorId);
  }

  const headResponse = await fetch(url, { method: 'head', headers: { authorization: `Key ${apiKey}` } });
  const cachedData = await cache.load(cachePath, `${url}-${headResponse.headers.get('etag')}`);

  if (cachedData != null) {
    return cachedData as Market[];
  }

  const response = await fetch(url, {
    method: 'get',
    headers: { authorization: `Key ${apiKey}` },
  });
  const results = (await response.json()) as Market[];
  await cache.save(cachePath, `${url}-${response.headers.get('etag')}`, results);
  return results;
}

export async function getMarket({ apiUrl, apiKey, cachePath }: Config, marketId: string): Promise<Market | undefined> {
  cachePath = join(cachePath, 'market');
  const url = new URL(`${apiUrl}/market/${marketId}`);
  const headResponse = await fetch(url, { method: 'head', headers: { authorization: `Key ${apiKey}` } });
  const cachedData = await cache.load(cachePath, `${url}-${headResponse.headers.get('etag')}`);

  if (cachedData != null) {
    return cachedData as Market;
  }

  const response = await fetch(url, {
    method: 'get',
    headers: { authorization: `Key ${apiKey}` },
  });

  if (response.status === 404) {
    return undefined;
  }

  const market = (await response.json()) as Market;
  await cache.save(cachePath, `${url}-${response.headers.get('etag')}`, market);
  return market;
}

export function createMarket({ apiUrl, apiKey }: Config, market: NewMarket): Promise<Response> {
  const response = fetch(`${apiUrl}/market`, {
    method: 'post',
    headers: { authorization: `Key ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(market),
  });
  return response;
}

export function editMarketGroup(
  { apiUrl, apiKey }: Config,
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
  { apiUrl, apiKey }: Config,
  marketId: string,
  outcome: 'YES' | 'NO' | 'MKT' | 'CANCEL'
): Promise<Response> {
  const response = await fetch(`${apiUrl}/market/${marketId}/resolve`, {
    method: 'post',
    headers: { authorization: `Key ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ outcome }),
  });
  Log.debug('resolveMarket()', response);
  return response;
}

export async function createComment(
  { apiUrl, apiKey }: Config,
  { marketId, content }: { marketId: string; content: string }
): Promise<Response> {
  const response = await fetch(`${apiUrl}/comment`, {
    method: 'post',
    headers: { authorization: `Key ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ contractId: marketId, markdown: content }),
  });
  Log.debug('createComment()', response);
  return response;
}
