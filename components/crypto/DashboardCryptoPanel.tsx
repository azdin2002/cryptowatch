"use client";

import { ChevronDown, Filter, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { CryptoTable } from "@/components/crypto/CryptoTable";
import type {
  CryptoTableSortDirection,
  CryptoTableSortField,
} from "@/components/crypto/CryptoTable";
import { useCryptoData } from "@/hooks/useCryptoData";
import type { CryptoMarket } from "@/types";

type MarketFilter =
  | "top-gainers"
  | "top-losers"
  | "highest-market-cap"
  | "lowest-market-cap";

interface DashboardCryptoPanelProps {
  initialCryptos: CryptoMarket[];
  totalAssets: number;
}

interface FilterOption {
  label: string;
  value: MarketFilter;
  sortDirection: CryptoTableSortDirection;
  sortField: CryptoTableSortField;
}

const filterOptions: FilterOption[] = [
  {
    label: "Highest market cap",
    value: "highest-market-cap",
    sortField: "market_cap",
    sortDirection: "desc",
  },
  {
    label: "Top gainers",
    value: "top-gainers",
    sortField: "price_change_percentage_24h",
    sortDirection: "desc",
  },
  {
    label: "Top losers",
    value: "top-losers",
    sortField: "price_change_percentage_24h",
    sortDirection: "asc",
  },
  {
    label: "Lowest market cap",
    value: "lowest-market-cap",
    sortField: "market_cap",
    sortDirection: "asc",
  },
];

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const DASHBOARD_PAGE_SIZE = 250;
const DEFAULT_ASSET_LIMIT = 100;
const ASSET_LIMIT_OPTIONS = [100, 200, 500, 1_000, 2_000, 5_000, 10_000];

const getFiniteNumber = (value: number | null): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const getFilteredCryptos = (
  cryptos: CryptoMarket[],
  filter: MarketFilter,
): CryptoMarket[] => {
  switch (filter) {
    case "top-gainers":
      return cryptos.filter((crypto) => {
        const change = getFiniteNumber(crypto.price_change_percentage_24h);
        return change !== null && change > 0;
      });
    case "top-losers":
      return cryptos.filter((crypto) => {
        const change = getFiniteNumber(crypto.price_change_percentage_24h);
        return change !== null && change < 0;
      });
    case "lowest-market-cap":
    case "highest-market-cap":
      return cryptos.filter(
        (crypto) => getFiniteNumber(crypto.market_cap) !== null,
      );
  }
};

export const DashboardCryptoPanel = ({
  initialCryptos,
  totalAssets,
}: DashboardCryptoPanelProps) => {
  const maxSelectableAssets = Math.max(totalAssets, DEFAULT_ASSET_LIMIT);
  const [activeFilter, setActiveFilter] =
    useState<MarketFilter>("highest-market-cap");
  const [selectedAssetLimit, setSelectedAssetLimit] = useState(() =>
    Math.min(DEFAULT_ASSET_LIMIT, maxSelectableAssets),
  );
  const {
    cryptos,
    loading,
    loadingMore,
    hasMore,
    loadedPages,
    lastUpdatedAt,
    error,
    loadUntil,
  } = useCryptoData({
    fresh: true,
    initialCryptos,
    pageSize: DASHBOARD_PAGE_SIZE,
    refreshIntervalMs: 30_000,
  });

  const selectedFilter = useMemo(
    () =>
      filterOptions.find((option) => option.value === activeFilter) ??
      filterOptions[0],
    [activeFilter],
  );

  const assetLimitOptions = useMemo(() => {
    const options = ASSET_LIMIT_OPTIONS.filter(
      (assetLimit) => assetLimit <= maxSelectableAssets,
    );

    if (options.length === 0) {
      return [maxSelectableAssets];
    }

    return options.includes(selectedAssetLimit)
      ? options
      : [...options, selectedAssetLimit].sort((first, second) => first - second);
  }, [maxSelectableAssets, selectedAssetLimit]);

  const selectedCryptos = useMemo(
    () => cryptos.slice(0, selectedAssetLimit),
    [cryptos, selectedAssetLimit],
  );

  const visibleCryptos = useMemo(
    () => getFilteredCryptos(selectedCryptos, activeFilter),
    [activeFilter, selectedCryptos],
  );

  const loadedSelectedAssets = Math.min(cryptos.length, selectedAssetLimit);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Top Cryptocurrencies</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Auto-refreshes every 30 seconds with client-side market filters.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="market-filter"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Market filter
            </label>
            <div className="relative">
              <Filter
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                aria-hidden="true"
              />
              <select
                id="market-filter"
                value={activeFilter}
                onChange={(event) =>
                  setActiveFilter(event.target.value as MarketFilter)
                }
                className="h-11 w-full appearance-none rounded-xl border border-zinc-300 bg-white/95 px-4 py-2.5 pl-10 pr-9 text-sm font-medium text-zinc-950 shadow-sm outline-none transition-all duration-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-50 dark:focus:border-emerald-600 dark:focus:ring-emerald-950"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="asset-limit"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Show top
            </label>
            <div className="relative">
              {loadingMore ? (
                <Loader2
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500"
                  aria-hidden="true"
                />
              ) : (
                <Filter
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  aria-hidden="true"
                />
              )}
              <select
                id="asset-limit"
                value={selectedAssetLimit}
                onChange={(event) => {
                  const nextAssetLimit = Number(event.target.value);
                  setSelectedAssetLimit(nextAssetLimit);
                  void loadUntil(nextAssetLimit);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-zinc-300 bg-white/95 px-4 py-2.5 pl-10 pr-9 text-sm font-medium text-zinc-950 shadow-sm outline-none transition-all duration-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-50 dark:focus:border-emerald-600 dark:focus:ring-emerald-950"
              >
                {assetLimitOptions.map((assetLimit) => (
                  <option key={assetLimit} value={assetLimit}>
                    {assetLimit.toLocaleString("en-US")} assets
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          Showing {visibleCryptos.length.toLocaleString("en-US")} matches from
          top {selectedAssetLimit.toLocaleString("en-US")} assets (
          {loadedSelectedAssets.toLocaleString("en-US")} loaded across{" "}
          {loadedPages.toLocaleString("en-US")}{" "}
          {loadedPages === 1 ? "page" : "pages"}).
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {lastUpdatedAt
              ? `Last refreshed ${timeFormatter.format(lastUpdatedAt)}`
              : "Quasi real-time polling active"}
          </span>
          {!hasMore ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              All available loaded
            </span>
          ) : null}
        </div>
      </div>

      <div className="transition-opacity duration-200">
        <CryptoTable
          key={activeFilter}
          cryptos={visibleCryptos}
          defaultSortDirection={selectedFilter.sortDirection}
          defaultSortField={selectedFilter.sortField}
          error={error}
          loading={loading && cryptos.length === 0}
        />
      </div>
    </section>
  );
};

export default DashboardCryptoPanel;
