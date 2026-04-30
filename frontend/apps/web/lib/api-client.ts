/**
 * API client that always targets the same Next.js app.
 */
export async function apiFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? {});

  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    try {
      JSON.parse(init.body);
      headers.set("Content-Type", "application/json");
    } catch {
      // Leave non-JSON bodies untouched.
    }
  }

  return fetch(endpoint, {
    ...init,
    headers,
  });
}

export async function adminApiFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  return apiFetch(endpoint, init);
}
