/**
 * Fetch wrapper for admin API routes that handles 401 responses
 * by redirecting to the login page.
 */
export async function adminFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/admin/login';
    return new Promise(() => {});
  }

  return response;
}

type AdminResult<T> = { data: T; error?: never } | { data?: never; error: string };

/**
 * Fetch JSON data from admin API with 401 handling.
 * Returns either data or error, never both.
 */
export async function adminFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<AdminResult<T>> {
  const response = await adminFetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    return { error: result.error || 'Request failed' };
  }

  return { data: result.data as T };
}
