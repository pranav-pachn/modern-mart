/**
 * adminFetch targets the local Next.js API routes.
 */
export async function adminFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
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
