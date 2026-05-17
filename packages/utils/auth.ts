// ───────────────────────────────────────────────────────────────────────────────
// Auth Token Standardization
// Single source of truth for JWT localStorage keys across the entire frontend.
//
// RULE: Every component MUST use these helpers — never raw localStorage.getItem
// for tokens. This prevents the 'rrpos_token' vs 'rpos_token' vs 'pos_token'
// mismatch that broke cross-page auth.
// ───────────────────────────────────────────────────────────────────────────────

/** The canonical localStorage key for the JWT access token */
export const RPOS_AUTH_TOKEN = 'rpos_auth_token';

/** Legacy keys that existed before standardization (for migration) */
const LEGACY_KEYS = ['rrpos_token', 'rpos_token', 'pos_token', 'access_token'];

/**
 * Get the current auth token from localStorage.
 * Automatically migrates from legacy keys to the canonical key.
 */
export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';

  // 1. Check canonical key first
  const canonical = localStorage.getItem(RPOS_AUTH_TOKEN);
  if (canonical) return canonical;

  // 2. Check legacy keys and migrate if found
  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) {
      // Migrate to canonical key
      localStorage.setItem(RPOS_AUTH_TOKEN, legacy);
      localStorage.removeItem(key);
      return legacy;
    }
  }

  return '';
}

/** Store the auth token under the canonical key */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RPOS_AUTH_TOKEN, token);
  // Clean up any legacy keys
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
}

/** Remove the auth token and all legacy keys */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RPOS_AUTH_TOKEN);
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
}

/** Build Authorization header with Bearer token */
export function authHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
