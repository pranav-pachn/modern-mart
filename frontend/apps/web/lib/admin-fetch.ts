/**
 * adminFetch — calls backend admin APIs via apiFetch().
 * Admin authorization is enforced server-side via NextAuth JWT.
 */
import { apiFetch } from "./api-client";

export async function adminFetch(
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  return apiFetch(endpoint, init);
}
