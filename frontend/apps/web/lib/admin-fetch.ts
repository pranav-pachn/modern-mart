/**
 * adminFetch — thin wrapper around fetch() used by admin pages.
 *
 * Admin authorization is enforced server-side via NextAuth JWT role checks.
 *
 * Usage:
 *   const res = await adminFetch("/api/orders?stats=1");
 *   const res = await adminFetch("/api/products/123", { method: "DELETE" });
 */
export async function adminFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(url, init);
}
