/**
 * API Client - Centralized fetch wrapper for backend API calls
 * Uses NEXT_PUBLIC_API_URL for separate frontend/backend deployment
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Fetch wrapper that prepends the backend API URL
 * @param endpoint - API endpoint (e.g., "/api/products")
 * @param init - Fetch options
 */
export async function apiFetch(
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(init.headers ?? {});
  
  // Default content-type for POST/PUT
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    try {
      JSON.parse(init.body);
      headers.set("Content-Type", "application/json");
    } catch {
      // Not JSON, don't set content-type
    }
  }
  
  return fetch(url, {
    ...init,
    headers,
  });
}

/**
 * Admin fetch with authentication
 * Note: In production, admin auth should use secure httpOnly cookies,
 * not client-side secrets. This is for dev/scripting convenience.
 */
export async function adminApiFetch(
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  // In production, auth is handled via NextAuth JWT (cookies)
  // The x-admin-secret header is only for local dev convenience
  const isDev = process.env.NODE_ENV === "development";
  const adminSecret = isDev ? process.env.NEXT_PUBLIC_ADMIN_SECRET : undefined;
  
  const headers = new Headers(init.headers ?? {});
  
  if (adminSecret && !headers.has("x-admin-secret")) {
    headers.set("x-admin-secret", adminSecret);
  }
  
  return apiFetch(endpoint, {
    ...init,
    headers,
  });
}
