import type { Page } from '../api';

/**
 * The API has no "get one" route for memories or what-if paths, so a single
 * record is found by walking the list. Stops at the first match.
 */
export async function findInPages<T extends { _id: string }>(
  fetchPage: (page: number, limit: number) => Promise<Page<T>>,
  id: string,
  maxPages = 10,
): Promise<T | undefined> {
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await fetchPage(page, 100);
    const found = result.items.find((item) => item._id === id);
    if (found) return found;
    if (page >= result.pagination.totalPages) return undefined;
  }
  return undefined;
}
