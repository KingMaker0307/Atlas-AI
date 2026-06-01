/**
 * apple-auth.ts
 *
 * Real Apple Sign In for Web using Apple's official JS SDK.
 *
 * ─── SETUP REQUIREMENTS (one-time) ──────────────────────────────────────────
 *
 *  1. Apple Developer account ($99/yr) at developer.apple.com
 *
 *  2. Create a Service ID:
 *     developer.apple.com → Certificates, IDs & Profiles → Identifiers → +
 *     → Service IDs → Continue
 *     - Description:  Atlas AI
 *     - Identifier:   com.atlasai.web   ← this is your NEXT_PUBLIC_APPLE_CLIENT_ID
 *     - ✅ Sign In with Apple → Configure
 *       - Primary App ID: your iOS app (or create a new App ID)
 *       - Domains: yourdomain.com  (no https://, no trailing slash)
 *       - Return URLs: https://yourdomain.com/api/auth/apple/callback
 *     - Save → Continue → Register
 *
 *  3. Domain verification file:
 *     Apple will show a "Download" button for apple-developer-domain-association.txt
 *     Download it → place it at:
 *       public/.well-known/apple-developer-domain-association.txt
 *     Deploy your app so Apple can fetch:
 *       https://yourdomain.com/.well-known/apple-developer-domain-association.txt
 *
 *  4. Create a Key for Sign In with Apple:
 *     developer.apple.com → Keys → + → Name: "Atlas AI Sign In"
 *     ✅ Sign In with Apple → Configure → select your Primary App ID → Save
 *     → Continue → Register → Download the .p8 file (one-time only!)
 *     Note your Key ID (shown on the Keys page).
 *
 *  5. Find your Team ID:
 *     developer.apple.com → top-right corner, click your name → Membership
 *
 *  6. Add to .env (and Vercel project settings):
 *     NEXT_PUBLIC_APPLE_CLIENT_ID=com.atlasai.web
 *     NEXT_PUBLIC_APPLE_REDIRECT_URI=https://yourdomain.com/api/auth/apple/callback
 *     APPLE_TEAM_ID=XXXXXXXXXX
 *     APPLE_KEY_ID=XXXXXXXXXX
 *     APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
 *
 * ─── LOCALHOST LIMITATION ────────────────────────────────────────────────────
 *  Apple Sign In CANNOT work on http://localhost. Apple's servers must be able
 *  to reach your domain to verify it. Use one of:
 *    a) Deploy to Vercel (free tier works): https://vercel.com
 *    b) Use ngrok: npx ngrok http 3000 → use the https:// URL as your domain
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface AppleUser {
  email: string;
  name: string; // Apple only sends name on the FIRST sign-in ever
  sub: string;  // Apple's unique user ID (stable across sign-ins)
}

// ── Module-level singleton ────────────────────────────────────────────────────
let appleScriptPromise: Promise<void> | null = null;

function loadAppleJS(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).AppleID) return Promise.resolve();

  if (!appleScriptPromise) {
    appleScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        'script[src*="appleid.cdn-apple.com"]'
      );
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Apple Sign In script failed to load."))
        );
        return;
      }
      const s = document.createElement("script");
      s.src =
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () =>
        reject(new Error("Apple Sign In script failed to load."));
      document.head.appendChild(s);
    });
  }
  return appleScriptPromise;
}

/** Decode the Apple identity_token JWT payload (client-side, no verification). */
function decodeAppleJwt(identityToken: string): { email?: string; sub?: string } | null {
  try {
    const [, payload] = identityToken.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

// ── Availability Check ────────────────────────────────────────────────────────

/** Returns true if Apple Sign In can run in the current environment. */
export function isAppleSignInAvailable(): { available: boolean; reason?: string } {
  if (typeof window === "undefined") {
    return { available: false, reason: "Server-side rendering" };
  }
  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return {
      available: false,
      reason:
        "Apple Sign In is not configured. NEXT_PUBLIC_APPLE_CLIENT_ID and NEXT_PUBLIC_APPLE_REDIRECT_URI are required.",
    };
  }
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return {
      available: false,
      reason:
        "Apple Sign In is not available on localhost. Deploy your app to a live HTTPS domain first (e.g. Vercel).",
    };
  }
  return { available: true };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Trigger the Apple Sign In popup.
 *
 * On success, `onSuccess` is called with the user's email, name and Apple sub.
 * Note: Apple only provides the user's name on the very first sign-in. On
 * subsequent sign-ins, `name` will be an empty string — store it after first sign-in.
 *
 * @param onSuccess  - callback with real Apple user details
 * @param onError    - callback with a human-readable error string
 */
export async function signInWithApple(
  onSuccess: (user: AppleUser) => void,
  onError?: (message: string) => void
): Promise<void> {
  const { available, reason } = isAppleSignInAvailable();
  if (!available) {
    onError?.(reason ?? "Apple Sign In is not available.");
    return;
  }

  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI!;

  try {
    await loadAppleJS();
  } catch (err: any) {
    onError?.("Failed to load Apple Sign In. Check your internet connection.");
    return;
  }

  const AppleID = (window as any).AppleID;
  if (!AppleID?.auth) {
    onError?.("Apple Sign In SDK failed to initialize.");
    return;
  }

  AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI: redirectUri,
    // usePopup: true opens a popup rather than redirecting the page.
    // Popup is better UX for web apps.
    usePopup: true,
  });

  try {
    const response = await AppleID.auth.signIn();
    /*
     * response shape:
     * {
     *   authorization: {
     *     code: string,
     *     id_token: string,     ← JWT containing email + sub
     *     state?: string
     *   },
     *   user?: {               ← Only present on FIRST sign-in ever
     *     name: { firstName: string, lastName: string },
     *     email: string
     *   }
     * }
     */
    const idToken = response?.authorization?.id_token;
    if (!idToken) {
      onError?.("Apple Sign In did not return an identity token.");
      return;
    }

    const decoded = decodeAppleJwt(idToken);
    if (!decoded?.sub) {
      onError?.("Apple Sign In returned an invalid identity token.");
      return;
    }

    // Apple only gives us the email from the JWT on first sign-in (or if user
    // shares it). If the user chose "Hide My Email", Apple gives a relay address.
    const email =
      response?.user?.email ?? decoded.email ?? "";

    const firstName = response?.user?.name?.firstName ?? "";
    const lastName = response?.user?.name?.lastName ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0];

    if (!email) {
      onError?.(
        "Apple did not share your email. Please sign out of Apple ID on this site and try again, then choose to share your email."
      );
      return;
    }

    onSuccess({ email, name, sub: decoded.sub });
  } catch (err: any) {
    if (err?.error === "popup_closed_by_user" || err?.error === "user_cancelled_authorize") {
      // User closed the popup — not an error, just ignore
      return;
    }
    console.error("Apple Sign In error:", err);
    onError?.(
      err?.error === "invalid_client"
        ? "Apple Sign In configuration error. Check your Service ID and Return URL in the Apple Developer portal."
        : "Apple Sign In failed. Please try again."
    );
  }
}

/**
 * Render the official Apple Sign In button HTML element.
 * This uses Apple's data-* attributes to render a native Apple button via
 * their script — visually identical to the native button on iOS/macOS.
 *
 * @param container  - DOM element to render the button into
 * @param mode       - "black" or "white"
 * @param onSuccess  - callback when signed in
 * @param onError    - callback on error
 */
export function renderAppleSignInButton(
  container: HTMLElement,
  mode: "black" | "white",
  onSuccess: (user: AppleUser) => void,
  onError?: (message: string) => void
): void {
  // Clean up any previous button
  container.innerHTML = "";

  const div = document.createElement("div");
  div.id = "appleid-signin";
  div.setAttribute("data-color", mode);
  div.setAttribute("data-border", "false");
  div.setAttribute("data-type", "sign in");
  div.style.width = "100%";
  div.style.height = "44px";
  div.style.cursor = "pointer";

  container.appendChild(div);

  div.addEventListener("click", () => {
    signInWithApple(onSuccess, onError);
  });
}
