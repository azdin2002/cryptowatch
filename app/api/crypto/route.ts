import { NextRequest, NextResponse } from "next/server";

import {
  CoinGeckoApiError,
  MAX_MARKETS_PER_PAGE,
  getCoinDetail,
  getGlobalStats,
  getMarketChart,
  getMarkets,
  getMarketsByIds,
  searchCoins,
} from "@/lib/coingecko";
import type {
  ApiResponse,
  CryptoDetail,
  CryptoMarket,
  GlobalMarketData,
  PriceHistory,
  SearchCoin,
} from "@/types";

type CryptoEndpoint = "markets" | "detail" | "chart" | "search" | "global";

const VALID_ENDPOINTS = new Set<CryptoEndpoint>([
  "markets",
  "detail",
  "chart",
  "search",
  "global",
]);

const jsonResponse = <T>(
  data: T | null,
  status: number,
  error: string | null = null,
): NextResponse<ApiResponse<T>> =>
  NextResponse.json(
    {
      data,
      error,
    },
    { status },
  );

const getRequiredParam = (
  request: NextRequest,
  name: string,
): string | null => {
  const value = request.nextUrl.searchParams.get(name)?.trim();
  return value ? value : null;
};

const getEndpoint = (request: NextRequest): CryptoEndpoint | null => {
  const endpoint = request.nextUrl.searchParams.get("endpoint");

  if (!endpoint || !VALID_ENDPOINTS.has(endpoint as CryptoEndpoint)) {
    return null;
  }

  return endpoint as CryptoEndpoint;
};

const getPage = (request: NextRequest): number => {
  const rawPage = request.nextUrl.searchParams.get("page");
  const page = rawPage ? Number(rawPage) : 1;

  return Number.isInteger(page) && page > 0 ? page : 1;
};

const getPerPage = (request: NextRequest): number => {
  const rawPerPage = request.nextUrl.searchParams.get("perPage");
  const perPage = rawPerPage ? Number(rawPerPage) : MAX_MARKETS_PER_PAGE;

  if (!Number.isInteger(perPage) || perPage <= 0) {
    return MAX_MARKETS_PER_PAGE;
  }

  return Math.min(perPage, MAX_MARKETS_PER_PAGE);
};

const getCryptoIds = (request: NextRequest): string[] => {
  const ids = request.nextUrl.searchParams.get("ids")?.trim();

  if (!ids) {
    return [];
  }

  return Array.from(
    new Set(
      ids
        .split(",")
        .map((id) => id.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
};

const getFreshRequestOptions = (request: NextRequest) =>
  request.nextUrl.searchParams.get("fresh") === "true"
    ? ({ cache: "no-store" } as const)
    : undefined;

const handleRouteError = (error: unknown): NextResponse<ApiResponse<null>> => {
  if (error instanceof CoinGeckoApiError) {
    const status =
      error.status && error.status >= 400 && error.status < 500
        ? error.status
        : 502;

    return jsonResponse(null, status, error.message);
  }

  return jsonResponse(null, 500, "Unexpected crypto API error");
};

const handleMarkets = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<CryptoMarket[]>>> => {
  const ids = getCryptoIds(request);
  const options = getFreshRequestOptions(request);
  const markets =
    ids.length > 0
      ? await getMarketsByIds(ids, options)
      : await getMarkets(getPage(request), options, getPerPage(request));

  return jsonResponse<CryptoMarket[]>(markets, 200);
};

const handleDetail = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<CryptoDetail>>> => {
  const id = getRequiredParam(request, "id");

  if (!id) {
    return jsonResponse<CryptoDetail>(null, 400, "Missing required id param");
  }

  const detail = await getCoinDetail(id);
  return jsonResponse<CryptoDetail>(detail, 200);
};

const handleChart = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<PriceHistory>>> => {
  const id = getRequiredParam(request, "id");
  const days = getRequiredParam(request, "days") ?? "7";

  if (!id) {
    return jsonResponse<PriceHistory>(null, 400, "Missing required id param");
  }

  const chart = await getMarketChart(id, days);
  return jsonResponse<PriceHistory>(chart, 200);
};

const handleSearch = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<SearchCoin[]>>> => {
  const query = getRequiredParam(request, "q");

  if (!query) {
    return jsonResponse<SearchCoin[]>(null, 400, "Missing required q param");
  }

  const results = await searchCoins(query);
  return jsonResponse<SearchCoin[]>(results.coins, 200);
};

const handleGlobal = async (): Promise<
  NextResponse<ApiResponse<GlobalMarketData>>
> => {
  const stats = await getGlobalStats();
  return jsonResponse<GlobalMarketData>(stats.data, 200);
};

export const GET = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<unknown>>> => {
  const endpoint = getEndpoint(request);

  if (!endpoint) {
    return jsonResponse(
      null,
      400,
      "Invalid endpoint. Use markets, detail, chart, search, or global.",
    );
  }

  try {
    switch (endpoint) {
      case "markets":
        return await handleMarkets(request);
      case "detail":
        return await handleDetail(request);
      case "chart":
        return await handleChart(request);
      case "search":
        return await handleSearch(request);
      case "global":
        return await handleGlobal();
    }
  } catch (error) {
    return handleRouteError(error);
  }
};
