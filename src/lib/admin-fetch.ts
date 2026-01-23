export async function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/admin/login';
    return new Promise(() => {});
  }

  return response;
}

type AdminResult<T> = { data: T; error?: never } | { data?: never; error: string };

export async function adminFetchJson<T>(url: string, options?: RequestInit): Promise<AdminResult<T>> {
  const response = await adminFetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    return { error: result.error || 'Request failed' };
  }

  return { data: result.data as T };
}
