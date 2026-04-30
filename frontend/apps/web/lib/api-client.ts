/**
 * API Client - Centralized fetch wrapper for backend API calls
 * Uses NEXT_PUBLIC_API_URL for separate frontend/backend deployment
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetch wrapper that prepends the backend API URL
 * @param endpoint - API endpoint (e.g., "/api/products")
 * @param init - Fetch options
 */
export async function apiFetch(
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

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
 * Admin fetch with authentication.
 * Admin authorization is enforced by Auth.js cookies and backend route guards.
 */
export async function adminApiFetch(
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  return apiFetch(endpoint, init);
}
