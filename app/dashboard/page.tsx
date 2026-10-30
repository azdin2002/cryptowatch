import { Activity, BarChart3, Bitcoin, Globe2 } from "lucide-react";

import { DashboardCryptoPanel } from "@/components/crypto/DashboardCryptoPanel";
import {
  CoinGeckoApiError,
  getGlobalStats,
  getMarkets,
  MAX_MARKETS_PER_PAGE,
} from "@/lib/coingecko";
import type { CryptoMarket, GlobalMarketData } from "@/types";

interface DashboardData {
  cryptos: CryptoMarket[];
  stats: GlobalMarketData;
}

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const formatCompactCurrency = (value: number | undefined): string =>
  typeof value === "number" ? compactCurrencyFormatter.format(value) : "N/A";

const formatPercentage = (value: number | undefined): string =>
  typeof value === "number" ? `${percentFormatter.format(value)}%` : "N/A";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof CoinGeckoApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load market data";
};

const DashboardError = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
    {message}
  </div>
);

const getDashboardData = async (): Promise<DashboardData> => {
  const [cryptos, globalStats] = await Promise.all([
    getMarkets(1, { revalidate: 60 }, MAX_MARKETS_PER_PAGE),
    getGlobalStats({ revalidate: 60 }),
  ]);

  return {
    cryptos,
    stats: globalStats.data,
  };
};

export default async function DashboardPage() {
  let dashboardData: DashboardData;

  try {
    dashboardData = await getDashboardData();
  } catch (error) {
    return <DashboardError message={getErrorMessage(error)} />;
  }

  const { cryptos, stats } = dashboardData;
  const btcDominance = stats.market_cap_percentage.btc;
  const statCards = [
    {
      label: "Total Market Cap",
      value: formatCompactCurrency(stats.total_market_cap.usd),
      icon: Globe2,
      tone: "from-emerald-500 to-teal-500",
    },
    {
      label: "24h Volume",
      value: formatCompactCurrency(stats.total_volume.usd),
      icon: BarChart3,
      tone: "from-cyan-500 to-sky-500",
    },
    {
      label: "BTC Dominance",
      value: formatPercentage(btcDominance),
      icon: Bitcoin,
      tone: "from-amber-500 to-orange-500",
    },
    {
      label: "Active Cryptos",
      value: stats.active_cryptocurrencies.toLocaleString("en-US"),
      icon: Activity,
      tone: "from-violet-500 to-fuchsia-500",
    },
  ];

  return (
    <>
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Overview
        </p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Market Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
            Live cryptocurrency market overview powered by CoinGecko.
          </p>
        </div>
      </header>

      <section
        aria-label="Market overview"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="group rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-lg shadow-zinc-200/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/20"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {card.label}
                </p>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone} text-white shadow-lg shadow-zinc-950/10 transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                {card.value}
              </p>
            </div>
          );
        })}
      </section>

      <DashboardCryptoPanel
        initialCryptos={cryptos}
        totalAssets={stats.active_cryptocurrencies}
      />
    </>
  );
}
