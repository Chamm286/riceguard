'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/api';

interface UseApiDataOptions {
  params?: Record<string, unknown>;
  enabled?: boolean;
  pollMs?: number;
}

interface UseApiDataResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  updatedAt: Date | null;
  refetch: () => void;
}

export function useApiData<T = unknown>(
  url: string | null,
  options: UseApiDataOptions = {}
): UseApiDataResult<T> {
  const { enabled = true, pollMs } = options;
  const paramsKey = useMemo(() => JSON.stringify(options.params || {}), [options.params]);

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url && enabled));
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const dataRef = useRef<T | null>(null);

  const refetch = useCallback(() => setRefreshIndex((value) => value + 1), []);

  useEffect(() => {
    if (!url || !enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const params = JSON.parse(paramsKey) as Record<string, unknown>;
    const controller = new AbortController();

    const load = async (background: boolean) => {
      if (background) setRefreshing(true);
      else if (!dataRef.current) setLoading(true);

      try {
        const res = await api.get(url, {
          params,
          signal: controller.signal,
        });
        if (cancelled) return;
        const next = (res.data?.data !== undefined ? res.data.data : res.data) as T;
        dataRef.current = next;
        setData(next);
        setError(null);
        setUpdatedAt(new Date());
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (cancelled || code === 'ERR_CANCELED') return;
        setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    load(Boolean(dataRef.current));

    if (pollMs && pollMs > 0) {
      const tick = async () => {
        await load(true);
        if (!cancelled) timer = setTimeout(tick, pollMs);
      };
      timer = setTimeout(tick, pollMs);
    }

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [url, paramsKey, pollMs, enabled, refreshIndex]);

  return {
    data,
    error,
    loading: Boolean(url && enabled) && loading,
    refreshing,
    updatedAt,
    refetch,
  };
}
