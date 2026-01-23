export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);

  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
  const limit = Math.min(100, Math.max(1, Number.isNaN(rawLimit) ? 20 : rawLimit));

  return { page, limit };
}

export function getPaginationRange(params: PaginationParams): { from: number; to: number } {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;
  return { from, to };
}

export function buildPaginationResult<T>(
  data: T[],
  count: number | null,
  params: PaginationParams
): PaginationResult<T> {
  const total = count ?? 0;
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore: params.page < totalPages,
    },
  };
}
