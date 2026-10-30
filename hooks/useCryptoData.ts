"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getToastErrorMessage } from "@/lib/toasts";
import type { ApiResponse, CryptoMarket } from "@/types";
import { toast } from "sonner";

interface UseCryptoDataOptions {
  fresh?: boolean;
  initialCryptos?: CryptoMarket[];
  page?: number;
  pageSize?: number;
  refreshIntervalMs?: number;
}

interface UseCryptoDataResult {
  cryptos: CryptoMarket[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadedPages: number;
  lastUpdatedAt: Date | null;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  loadUntil: (targetCount: number) => Promise<void>;
}

const DEFAULT_REFRESH_INTERVAL_MS = 30_000;
const DEFAULT_PAGE_SIZE = 250;
const PAGE_FETCH_BATCH_SIZE = 3;

const dedupeCryptos = (cryptos: CryptoMarket[]): CryptoMarket[] =>
  Array.from(
    cryptos
      .reduce<Map<string, CryptoMarket>>((uniqueCryptos, crypto) => {
        uniqueCryptos.set(crypto.id, crypto);
        return uniqueCryptos;
      }, new Map())
      .values(),
  );

export const useCryptoData = ({
  fresh = false,
  initialCryptos = [],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
}: UseCryptoDataOptions = {}): UseCryptoDataResult => {
  const hasInitialCryptos = initialCryptos.length > 0;
  const [cryptos, setCryptos] = useState<CryptoMarket[]>(initialCryptos);
  const [loading, setLoading] = useState(!hasInitialCryptos);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    !hasInitialCryptos || initialCryptos.length >= pageSize,
  );
  const [loadedPages, setLoadedPages] = useState(hasInitialCryptos ? 1 : 0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef<boolean>(hasInitialCryptos);
  const loadedPagesRef = useRef(hasInitialCryptos ? 1 : 0);

  const fetchCryptoPage = useCallback(
    async (
      pageNumber: number,
      signal: AbortSignal,
    ): Promise<CryptoMarket[]> => {
      const params = new URLSearchParams({
        endpoint: "markets",
        page: String(pageNumber),
        perPage: String(pageSize),
      });

      if (fresh) {
        params.set("fresh", "true");
      }

      const response = await fetch(`/api/crypto?${params.toString()}`, {
        cache: fresh ? "no-store" : "default",
        signal,
      });

      const payload = (await response.json()) as ApiResponse<CryptoMarket[]>;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Unable to fetch crypto markets");
      }

      return payload.data ?? [];
    },
    [fresh, pageSize],
  );

  const fetchCryptoPages = useCallback(
    async (
      pageNumbers: number[],
      signal: AbortSignal,
    ): Promise<CryptoMarket[][]> => {
      const pages: CryptoMarket[][] = [];

      for (
        let batchStartIndex = 0;
        batchStartIndex < pageNumbers.length;
        batchStartIndex += PAGE_FETCH_BATCH_SIZE
      ) {
        const batchPageNumbers = pageNumbers.slice(
          batchStartIndex,
          batchStartIndex + PAGE_FETCH_BATCH_SIZE,
        );
        const batchPages = await Promise.all(
          batchPageNumbers.map((pageNumber) =>
            fetchCryptoPage(pageNumber, signal),
          ),
        );

        pages.push(...batchPages);
      }

      return pages;
    },
    [fetchCryptoPage],
  );

  const fetchCryptos = useCallback(async (): Promise<void> => {
    if (loadingMore) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!hasFetchedRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const pagesToFetch = Math.max(loadedPagesRef.current, 1);
      const pageRequests = Array.from(
        { length: pagesToFetch },
        (_, index) => page + index,
      );
      const pages = await fetchCryptoPages(pageRequests, controller.signal);
      const lastPage = pages.at(-1) ?? [];

      setCryptos(dedupeCryptos(pages.flat()));
      setHasMore(lastPage.length >= pageSize);
      setLastUpdatedAt(new Date());
      hasFetchedRef.current = true;
      loadedPagesRef.current = pagesToFetch;
      setLoadedPages(pagesToFetch);
    } catch (fetchError) {
      if (
        fetchError instanceof DOMException &&
        fetchError.name === "AbortError"
      ) {
        return;
      }

      const message = getToastErrorMessage(
        fetchError,
        "Unable to fetch crypto markets",
      );

      setError(message);
      toast.error(message, { id: "crypto-markets-api-error" });
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [fetchCryptoPages, loadingMore, page, pageSize]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (loadingMore || !hasMore) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingMore(true);
    setError(null);

    try {
      const nextPageNumber = page + loadedPagesRef.current;
      const nextPage = await fetchCryptoPage(nextPageNumber, controller.signal);

      setCryptos((currentCryptos) =>
        dedupeCryptos([...currentCryptos, ...nextPage]),
      );
      setHasMore(nextPage.length >= pageSize);
      setLastUpdatedAt(new Date());

      if (nextPage.length > 0) {
        const nextLoadedPages = loadedPagesRef.current + 1;
        loadedPagesRef.current = nextLoadedPages;
        setLoadedPages(nextLoadedPages);
        hasFetchedRef.current = true;
      }
    } catch (fetchError) {
      if (
        fetchError instanceof DOMException &&
        fetchError.name === "AbortError"
      ) {
        return;
      }

      const message = getToastErrorMessage(
        fetchError,
        "Unable to fetch more crypto markets",
      );

      setError(message);
      toast.error(message, { id: "crypto-markets-api-error" });
    } finally {
      if (abortControllerRef.current === controller) {
        setLoadingMore(false);
      }
    }
  }, [fetchCryptoPage, hasMore, loadingMore, page, pageSize]);

  const loadUntil = useCallback(
    async (targetCount: number): Promise<void> => {
      const targetPages = Math.max(1, Math.ceil(targetCount / pageSize));

      if (loadingMore || targetPages <= loadedPagesRef.current || !hasMore) {
        return;
      }

      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoadingMore(true);
      setError(null);

      try {
        const firstPageToFetch = loadedPagesRef.current;
        const pagesToFetch = targetPages - loadedPagesRef.current;
        const pageRequests = Array.from(
          { length: pagesToFetch },
          (_, index) => page + firstPageToFetch + index,
        );
        const pages = await fetchCryptoPages(pageRequests, controller.signal);
        const lastPage = pages.at(-1) ?? [];
        const nextLoadedPages = loadedPagesRef.current + pages.length;

        setCryptos((currentCryptos) =>
          dedupeCryptos([...currentCryptos, ...pages.flat()]),
        );
        setHasMore(lastPage.length >= pageSize);
        setLastUpdatedAt(new Date());
        loadedPagesRef.current = nextLoadedPages;
        setLoadedPages(nextLoadedPages);
        hasFetchedRef.current = true;
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        const message = getToastErrorMessage(
          fetchError,
          "Unable to fetch selected crypto markets",
        );

        setError(message);
        toast.error(message, { id: "crypto-markets-api-error" });
      } finally {
        if (abortControllerRef.current === controller) {
          setLoadingMore(false);
        }
      }
    },
    [fetchCryptoPages, hasMore, loadingMore, page, pageSize],
  );

  useEffect(() => {
    const initialFetchId = hasFetchedRef.current
      ? null
      : window.setTimeout(() => {
          void fetchCryptos();
        }, 0);

    const intervalId = window.setInterval(() => {
      void fetchCryptos();
    }, refreshIntervalMs);

    return () => {
      if (initialFetchId !== null) {
        window.clearTimeout(initialFetchId);
      }
      window.clearInterval(intervalId);
      abortControllerRef.current?.abort();
    };
  }, [fetchCryptos, refreshIntervalMs]);

  return {
    cryptos,
    loading,
    loadingMore,
    hasMore,
    loadedPages,
    lastUpdatedAt,
    error,
    refetch: fetchCryptos,
    loadMore,
    loadUntil,
  };
};
