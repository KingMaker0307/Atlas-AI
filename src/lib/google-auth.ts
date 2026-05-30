/**
 * useGoogleOneTap — integrates Google Identity Services (GIS) One Tap sign-in.
 *
 * Loads the GIS SDK from accounts.google.com, initialises the One Tap prompt,
 * and returns a helper to imperatively open the full-screen Sign-in popup as a
 * fallback (used when One Tap is suppressed by the browser).
 *
 * The resolved credential JWT is decoded client-side (no server round-trip) to
 * extract the user's email, name, and picture — the fields Atlas needs.
 */

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

type OneTapCallback = (user: GoogleUser) => void;

let scriptLoaded = false;

function loadGISScript(): Promise<void> {
  if (scriptLoaded || (typeof window !== "undefined" && (window as any).google?.accounts)) {
    scriptLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error("Failed to load Google Identity Services SDK."));
    document.head.appendChild(script);
  });
}

/** Decode a Google JWT credential without a server round-trip. */
function decodeGoogleJwt(credential: string): GoogleUser | null {
  try {
    const parts = credential.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return {
      email: payload.email ?? "",
      name: payload.name ?? "",
      picture: payload.picture ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Initialise Google One Tap and invoke `onSuccess` when the user picks an account.
 * Returns a `signInWithPopup` function that can be called from a button click.
 */
export async function initGoogleOneTap(
  onSuccess: OneTapCallback,
  onError?: (msg: string) => void
): Promise<() => void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    onError?.("Google Client ID is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file.");
    return () => {};
  }

  await loadGISScript();

  const google = (window as any).google;
  if (!google?.accounts?.id) {
    onError?.("Google Identity Services failed to load. Please check your internet connection.");
    return () => {};
  }

  const handleCredential = (response: { credential: string }) => {
    const user = decodeGoogleJwt(response.credential);
    if (user?.email) {
      onSuccess(user);
    } else {
      onError?.("Could not retrieve your Google account email. Please try again.");
    }
  };

  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
    context: "signin",
  });

  // Show One Tap prompt immediately (suppressed if user already dismissed)
  google.accounts.id.prompt();

  // Return a function that opens the full-screen Google OAuth popup as a fallback
  const signInWithPopup = () => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      // Request only the 'openid email profile' scope — we don't need Drive access here
      scope: "openid email profile",
      callback: () => {}, // Not used — we use the id_token callback below
    });

    // Use the newer popup sign-in flow via accounts.id
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap not available — open chooser via renderButton
        const container = document.getElementById("google-signin-container");
        if (container) {
          google.accounts.id.renderButton(container, {
            theme: "filled_blue",
            size: "large",
            type: "standard",
            width: container.offsetWidth || 320,
          });
          // Auto-click the rendered button
          const btn = container.querySelector("div[role='button']") as HTMLElement | null;
          btn?.click();
        }
      }
    });
  };

  return signInWithPopup;
}

/**
 * Render a real Google Sign-In button into a container div.
 * This is used when One Tap is not available (suppressed by browser).
 */
export async function renderGoogleSignInButton(
  containerId: string,
  onSuccess: OneTapCallback,
  onError?: (msg: string) => void
): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return;

  await loadGISScript();

  const google = (window as any).google;
  if (!google?.accounts?.id) return;

  google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential: string }) => {
      const user = decodeGoogleJwt(response.credential);
      if (user?.email) {
        onSuccess(user);
      } else {
        onError?.("Could not retrieve your Google account email. Please try again.");
      }
    },
    auto_select: false,
    context: "signin",
  });

  const container = document.getElementById(containerId);
  if (!container) return;

  google.accounts.id.renderButton(container, {
    theme: "outline",
    size: "large",
    type: "standard",
    shape: "rectangular",
    width: Math.min(container.offsetWidth || 320, 400),
    text: "signin_with",
    logo_alignment: "left",
  });
}
