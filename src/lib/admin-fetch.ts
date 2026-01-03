/**
 * Fetch wrapper for admin API routes that handles 401 responses
 * by redirecting to the login page.
 */
export async function adminFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);

  // If unauthorized, redirect to login page
  if (response.status === 401) {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
      // Return a never-resolving promise to prevent further processing
      return new Promise(() => {});
    }
  }

  return response;
}

/**
 * Fetch JSON data from admin API with 401 handling
 */
export async function adminFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await adminFetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Request failed');
    }

    return { data: result.data as T };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
