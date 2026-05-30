/**
 * google-auth.ts
 *
 * Real Google Sign In using Google Identity Services (GIS) SDK.
 * Loads accounts.google.com/gsi/client, renders the official Google Sign-In
 * button inside any container div, and decodes the returned JWT client-side
 * to extract the user's real email, name and picture.
 *
 * Requirements:
 *   1. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env
 *   2. In Google Cloud Console → APIs & Services → Credentials → your OAuth client:
 *      Add "http://localhost:3000" (dev) and your production domain under
 *      "Authorized JavaScript origins". Save. Takes ~5 minutes to propagate.
 */

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
  sub?: string; // Google's unique user ID
}

// ── Module-level singletons ───────────────────────────────────────────────────

let gisScriptPromise: Promise<void> | null = null;
// Track which container IDs have already had a button rendered to avoid
// re-initialising the GIS client on the same page load (GIS throws if you
// call initialize() more than once per client_id per page).
const renderedContainers = new Set<string>();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Lazily load the GIS script. Returns the same Promise on repeated calls. */
function loadGIS(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const g = (window as any).google;
  if (g?.accounts?.id) return Promise.resolve();

  if (!gisScriptPromise) {
    gisScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existing) {
        // Script tag already in DOM — wait for it
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Google Identity Services script failed to load."))
        );
        return;
      }
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () =>
        reject(new Error("Google Identity Services script failed to load."));
      document.head.appendChild(s);
    });
  }
  return gisScriptPromise;
}

/** Decode a Google-issued JWT without a network round-trip. */
function decodeGoogleJwt(credential: string): GoogleUser | null {
  try {
    const [, payload] = credential.split(".");
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (!json.email) return null;
    return {
      email: json.email as string,
      name: (json.name as string) ?? "",
      picture: (json.picture as string) ?? undefined,
      sub: (json.sub as string) ?? undefined,
    };
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render an official Google Sign-In button inside the element with `containerId`.
 *
 * The GIS SDK replaces the div contents with a styled iframe button.
 * When the user completes sign-in the `onSuccess` callback receives their
 * real Google account details.
 *
 * @param containerId  - id of the host <div>
 * @param onSuccess    - called with the signed-in user's details
 * @param onError      - called with a human-readable error string
 * @param theme        - "outline" (light) | "filled_black" | "filled_blue"
 */
export async function renderGoogleSignInButton(
  containerId: string,
  onSuccess: (user: GoogleUser) => void,
  onError?: (message: string) => void,
  theme: "outline" | "filled_black" | "filled_blue" = "outline"
): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "59606573141-j2el2qru2gg4g9aj8mqgc1tbn6lhtt7t.apps.googleusercontent.com";

  try {
    await loadGIS();
  } catch (err: any) {
    onError?.(
      "Failed to load Google Sign-In. Check your internet connection and try again."
    );
    return;
  }

  const google = (window as any).google;
  if (!google?.accounts?.id) {
    onError?.("Google Identity Services is not available.");
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) return;

  // GIS only allows one initialize() call per page per client_id.
  // We call it once (when first container is rendered) and reuse for subsequent ones.
  if (renderedContainers.size === 0) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential?: string; error?: string }) => {
        if (!response.credential) {
          onError?.(
            response.error === "suppressed_by_user"
              ? "Sign-in was cancelled."
              : "Sign-in failed — no credential returned. Make sure http://localhost:3000 is added to Authorized JavaScript Origins in Google Cloud Console."
          );
          return;
        }
        const user = decodeGoogleJwt(response.credential);
        if (user) {
          onSuccess(user);
        } else {
          onError?.(
            "Could not read your Google account details. Please try again."
          );
        }
      },
      // These improve UX: don't auto-select, allow cancelling, use sign-in context
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      // itp_support enables One Tap on Chrome with ITP (Safari-like tracking prevention)
      itp_support: true,
    });
  }

  renderedContainers.add(containerId);

  // Render the branded Google button into the container
  google.accounts.id.renderButton(container, {
    type: "standard",
    theme,
    size: "large",
    shape: "rectangular",
    logo_alignment: "left",
    text: "signin_with",
    width: Math.min(container.offsetWidth || 360, 400),
  });

  // Also show the One Tap prompt (the floating overlay) in case the user
  // prefers that over clicking the button. It will only show if the browser
  // hasn't suppressed it.
  google.accounts.id.prompt((notification: any) => {
    if (
      notification.isNotDisplayed() &&
      notification.getNotDisplayedReason() === "opt_out_or_no_session"
    ) {
      // User opted out of One Tap — that's fine, the button is still visible.
    }
  });
}

/**
 * Programmatically trigger the Google Sign-In popup.
 * Use this when you want sign-in to happen on a custom button click
 * rather than rendering the Google-branded button.
 */
export async function triggerGoogleSignIn(
  onSuccess: (user: GoogleUser) => void,
  onError?: (message: string) => void
): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "59606573141-j2el2qru2gg4g9aj8mqgc1tbn6lhtt7t.apps.googleusercontent.com";

  try {
    await loadGIS();
  } catch {
    onError?.("Failed to load Google Sign-In SDK.");
    return;
  }

  const google = (window as any).google;
  if (!google?.accounts?.id) {
    onError?.("Google Identity Services is not available.");
    return;
  }

  if (renderedContainers.size === 0) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential?: string }) => {
        if (!response.credential) {
          onError?.("Sign-in cancelled or failed.");
          return;
        }
        const user = decodeGoogleJwt(response.credential);
        if (user) onSuccess(user);
        else onError?.("Could not read account details.");
      },
      auto_select: false,
      context: "signin",
    });
  }

  // Use the prompt to show a chooser dialog
  google.accounts.id.prompt();
}
