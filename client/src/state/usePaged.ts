import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, type Page } from '../api';
import { t } from '../strings';

export interface Paged<T> {
  items: T[];
  error: ApiError | undefined;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

const PAGE_SIZE = 20;

/** Page-by-page list loading that follows the API's pagination object. */
export function usePaged<T>(
  fetchPage: (page: number, limit: number, signal: AbortSignal) => Promise<Page<T>>,
  deps: readonly unknown[] = [],
): Paged<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<ApiError | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tick, setTick] = useState(0);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(async (target: number, replace: boolean) => {
    controller.current?.abort();
    const ctl = new AbortController();
    controller.current = ctl;
    try {
      const result = await fetchRef.current(target, PAGE_SIZE, ctl.signal);
      if (ctl.signal.aborted) return;
      setItems((previous) => (replace ? result.items : [...previous, ...result.items]));
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
      setError(undefined);
    } catch (e) {
      if (ctl.signal.aborted) return;
      const err = e instanceof ApiError ? e : new ApiError('http', 0, 'UNKNOWN', t.errors.generic);
      if (err.kind !== 'cancelled') setError(err);
    } finally {
      if (!ctl.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void run(1, true);
    return () => controller.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || page >= totalPages) return;
    setLoadingMore(true);
    void run(page + 1, false);
  }, [loadingMore, loading, page, totalPages, run]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  return { items, error, loading, loadingMore, hasMore: page < totalPages, loadMore, reload };
}
