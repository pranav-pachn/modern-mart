/**
 * adminFetch — a thin wrapper around fetch() that automatically injects
 * the x-admin-secret header for all admin API calls.
 *
 * Usage:
 *   const res = await adminFetch("/api/orders?stats=1");
 *   const res = await adminFetch("/api/products/123", { method: "DELETE" });
 */
export async function adminFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);

  // The secret is exposed to the client only because this is a private admin
  // panel. In a production multi-tenant app, use a session-bound server action
  // or next-auth session token instead.
  const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
  if (secret) {
    headers.set("x-admin-secret", secret);
  }

  return fetch(url, { ...init, headers });
}
