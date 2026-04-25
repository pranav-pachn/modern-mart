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
  const headers = new Headers(init.headers ?? {});
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;

  if (adminSecret && !headers.has("x-admin-secret")) {
    headers.set("x-admin-secret", adminSecret);
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
