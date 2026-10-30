const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_REVALIDATE_SECONDS = 60;
const INITIAL_RETRY_DELAY_MS = 1_000;
const DEFAULT_MARKETS_PER_PAGE = 100;
export const MAX_MARKETS_PER_PAGE = 250;

type NextFetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

type QueryValue = string | number | boolean | undefined | null;

export interface CoinGeckoRequestOptions {
  cache?: RequestCache;
  revalidate?: number | false;
  tags?: string[];
  timeoutMs?: number;
  retries?: number;
}

export interface CoinGeckoErrorDetails {
  status?: number;
  endpoint: string;
  message: string;
}

export class CoinGeckoApiError extends Error {
  readonly status?: number;
  readonly endpoint: string;

  constructor({ status, endpoint, message }: CoinGeckoErrorDetails) {
    super(message);
    this.name = "CoinGeckoApiError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_change_percentage: number | null;
  atl_date: string | null;
  roi: CoinMarketRoi | null;
  last_updated: string;
}

export interface CoinMarketRoi {
  times: number;
  currency: string;
  percentage: number;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  web_slug: string;
  asset_platform_id: string | null;
  platforms: Record<string, string>;
  detail_platforms: Record<string, CoinDetailPlatform>;
  block_time_in_minutes: number;
  hashing_algorithm: string | null;
  categories: string[];
  preview_listing: boolean;
  public_notice: string | null;
  additional_notices: string[];
  description: Record<string, string>;
  links: CoinDetailLinks;
  image: CoinDetailImage;
  country_origin: string;
  genesis_date: string | null;
  sentiment_votes_up_percentage: number | null;
  sentiment_votes_down_percentage: number | null;
  watchlist_portfolio_users: number;
  market_cap_rank: number | null;
  market_data: CoinDetailMarketData;
  status_updates: CoinStatusUpdate[];
  last_updated: string;
}

export interface CoinDetailPlatform {
  decimal_place: number | null;
  contract_address: string;
}

export interface CoinDetailLinks {
  homepage: string[];
  whitepaper: string;
  blockchain_site: string[];
  official_forum_url: string[];
  chat_url: string[];
  announcement_url: string[];
  twitter_screen_name: string;
  facebook_username: string;
  bitcointalk_thread_identifier: number | null;
  telegram_channel_identifier: string;
  subreddit_url: string | null;
  repos_url: {
    github: string[];
    bitbucket: string[];
  };
}

export interface CoinDetailImage {
  thumb: string;
  small: string;
  large: string;
}

export interface CoinDetailMarketData {
  current_price: Record<string, number>;
  total_value_locked: number | null;
  mcap_to_tvl_ratio: number | null;
  fdv_to_tvl_ratio: number | null;
  roi: CoinMarketRoi | null;
  ath: Record<string, number>;
  ath_change_percentage: Record<string, number>;
  ath_date: Record<string, string>;
  atl: Record<string, number>;
  atl_change_percentage: Record<string, number>;
  atl_date: Record<string, string>;
  market_cap: Record<string, number>;
  market_cap_rank: number | null;
  fully_diluted_valuation: Record<string, number>;
  market_cap_fdv_ratio: number | null;
  total_volume: Record<string, number>;
  high_24h: Record<string, number>;
  low_24h: Record<string, number>;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d: number | null;
  price_change_percentage_14d: number | null;
  price_change_percentage_30d: number | null;
  price_change_percentage_60d: number | null;
  price_change_percentage_200d: number | null;
  price_change_percentage_1y: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  price_change_24h_in_currency: Record<string, number>;
  price_change_percentage_1h_in_currency: Record<string, number>;
  price_change_percentage_24h_in_currency: Record<string, number>;
  price_change_percentage_7d_in_currency: Record<string, number>;
  price_change_percentage_14d_in_currency: Record<string, number>;
  price_change_percentage_30d_in_currency: Record<string, number>;
  price_change_percentage_60d_in_currency: Record<string, number>;
  price_change_percentage_200d_in_currency: Record<string, number>;
  price_change_percentage_1y_in_currency: Record<string, number>;
  market_cap_change_24h_in_currency: Record<string, number>;
  market_cap_change_percentage_24h_in_currency: Record<string, number>;
  total_supply: number | null;
  max_supply: number | null;
  circulating_supply: number | null;
  last_updated: string;
}

export interface CoinStatusUpdate {
  description: string;
  category: string;
  created_at: string;
  user: string;
  user_title: string;
  pin: boolean;
  project: {
    type: string;
    id: string;
    name: string;
    image: CoinDetailImage;
  };
}

export interface MarketChart {
  prices: MarketChartPoint[];
  market_caps: MarketChartPoint[];
  total_volumes: MarketChartPoint[];
}

export type MarketChartPoint = [timestamp: number, value: number];

export interface SearchCoinsResponse {
  coins: SearchCoin[];
  exchanges: SearchExchange[];
  categories: SearchCategory[];
  nfts: SearchNft[];
}

export interface SearchCoin {
  id: string;
  name: string;
  api_symbol: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
}

export interface SearchExchange {
  id: string;
  name: string;
  market_type: string;
  thumb: string;
  large: string;
}

export interface SearchCategory {
  id: number;
  name: string;
}

export interface SearchNft {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

export interface GlobalStats {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

export type SimplePriceMap = Record<
  string,
  {
    usd?: number;
  }
>;

const buildUrl = (
  endpoint: string,
  params: Record<string, QueryValue> = {},
): string => {
  const url = new URL(`${COINGECKO_BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const getHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (process.env.COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
  }

  return headers;
};

const wait = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const getRetryDelay = (response: Response, attempt: number): number => {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1_000;
  }

  return INITIAL_RETRY_DELAY_MS * 2 ** attempt;
};

const buildFetchOptions = (
  controller: AbortController,
  options: CoinGeckoRequestOptions,
): NextFetchOptions => {
  const cache = options.cache ?? "force-cache";
  const fetchOptions: NextFetchOptions = {
    method: "GET",
    headers: getHeaders(),
    signal: controller.signal,
    cache,
  };

  if (cache !== "no-store") {
    fetchOptions.next = {
      revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS,
      tags: options.tags,
    };
  }

  return fetchOptions;
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const fallback = `CoinGecko request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as unknown;

    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }

    if (
      typeof body === "object" &&
      body !== null &&
      "status" in body &&
      typeof body.status === "object" &&
      body.status !== null &&
      "error_message" in body.status &&
      typeof body.status.error_message === "string"
    ) {
      return body.status.error_message;
    }

    return fallback;
  } catch {
    return fallback;
  }
};

const coinGeckoFetch = async <T>(
  endpoint: string,
  params: Record<string, QueryValue> = {},
  options: CoinGeckoRequestOptions = {},
): Promise<T> => {
  const url = buildUrl(endpoint, params);
  const retries = options.retries ?? DEFAULT_RETRIES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchOptions = buildFetchOptions(controller, options);

    try {
      const response = await fetch(url, fetchOptions);

      if (response.status === 429 && attempt < retries) {
        clearTimeout(timeoutId);
        await wait(getRetryDelay(response, attempt));
        continue;
      }

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new CoinGeckoApiError({
          status: response.status,
          endpoint,
          message,
        });
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof CoinGeckoApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new CoinGeckoApiError({
          endpoint,
          message: `CoinGecko request timed out after ${timeoutMs}ms`,
        });
      }

      if (attempt === retries) {
        throw new CoinGeckoApiError({
          endpoint,
          message:
            error instanceof Error
              ? `CoinGecko request failed: ${error.message}`
              : "CoinGecko request failed",
        });
      }

      await wait(INITIAL_RETRY_DELAY_MS * 2 ** attempt);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new CoinGeckoApiError({
    endpoint,
    message: "CoinGecko request failed after retry attempts",
  });
};

export const getMarkets = async (
  page = 1,
  options?: CoinGeckoRequestOptions,
  perPage = DEFAULT_MARKETS_PER_PAGE,
): Promise<CoinMarket[]> =>
  coinGeckoFetch<CoinMarket[]>(
    "/coins/markets",
    {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: Math.min(Math.max(perPage, 1), MAX_MARKETS_PER_PAGE),
      page,
      sparkline: false,
      price_change_percentage: "24h",
    },
    options,
  );

export const getMarketsByIds = async (
  ids: string[],
  options?: CoinGeckoRequestOptions,
): Promise<CoinMarket[]> =>
  coinGeckoFetch<CoinMarket[]>(
    "/coins/markets",
    {
      vs_currency: "usd",
      ids: ids.join(","),
      order: "market_cap_desc",
      per_page: Math.min(Math.max(ids.length, 1), 250),
      page: 1,
      sparkline: false,
      price_change_percentage: "24h",
    },
    options,
  );

export const getCoinDetail = async (
  id: string,
  options?: CoinGeckoRequestOptions,
): Promise<CoinDetail> =>
  coinGeckoFetch<CoinDetail>(
    `/coins/${encodeURIComponent(id)}`,
    {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: false,
    },
    options,
  );

export const getMarketChart = async (
  id: string,
  days: string,
  options?: CoinGeckoRequestOptions,
): Promise<MarketChart> =>
  coinGeckoFetch<MarketChart>(
    `/coins/${encodeURIComponent(id)}/market_chart`,
    {
      vs_currency: "usd",
      days,
    },
    options,
  );

export const searchCoins = async (
  query: string,
  options?: CoinGeckoRequestOptions,
): Promise<SearchCoinsResponse> =>
  coinGeckoFetch<SearchCoinsResponse>(
    "/search",
    {
      query: query.trim(),
    },
    options,
  );

export const getGlobalStats = async (
  options?: CoinGeckoRequestOptions,
): Promise<GlobalStats> => coinGeckoFetch<GlobalStats>("/global", {}, options);

export const getSimplePrices = async (
  ids: string[],
  options?: CoinGeckoRequestOptions,
): Promise<SimplePriceMap> =>
  coinGeckoFetch<SimplePriceMap>(
    "/simple/price",
    {
      ids: ids.join(","),
      vs_currencies: "usd",
    },
    options,
  );
