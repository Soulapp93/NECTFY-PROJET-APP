/**
 * Base URL used in emails (activation/reset).
 *
 * We intentionally avoid using the current origin when it's a custom domain
 * that does NOT serve the Lovable app (e.g. nectforma.com marketing site),
 * because links would land on a non-functional page.
 */
export const APP_PUBLISHED_URL = "https://nectforme.lovable.app";

export function getAppBaseUrl(): string {
  const origin = window.location.origin;

  // If we are on Lovable preview/published or local dev, use current origin.
  if (
    origin.endsWith(".lovable.app") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
  ) {
    return origin;
  }

  // Otherwise, fall back to the known published Lovable URL.
  return APP_PUBLISHED_URL;
}
