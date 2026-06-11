export const PAGE_SIZE = 10;

export function parsePageParam(
  value: string | string[] | undefined,
  defaultPage = 1
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = parseInt(raw ?? "", 10);
  return Number.isFinite(page) && page > 0 ? page : defaultPage;
}

export function getPaginationRange(page: number, pageSize = PAGE_SIZE) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to, page, pageSize };
}

export function getTotalPages(total: number, pageSize = PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.ceil(total / pageSize);
}

export interface PaginationMeta {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export function buildPaginationMeta(
  page: number,
  totalItems: number,
  pageSize = PAGE_SIZE
): PaginationMeta {
  return {
    page,
    totalPages: getTotalPages(totalItems, pageSize),
    totalItems,
    pageSize,
  };
}
