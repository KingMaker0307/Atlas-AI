/**
 * Apple Sign In — Redirect Callback Handler
 *
 * Apple sends a POST to this route when sign-in completes (redirect flow).
 * This is the fallback for when the popup is blocked by the browser.
 *
 * The route:
 *  1. Reads the POSTed form data (Apple sends application/x-www-form-urlencoded)
 *  2. Decodes the identity_token JWT to extract email + sub
 *  3. Redirects to the home page with the email as a query param, which the
 *     WelcomeScreen picks up and uses to continue the onboarding flow.
 *
 * In the popup flow (usePopup: true), Apple resolves the promise directly in
 * the browser — this route is NOT called. It's only used as a fallback.
 */

import { NextRequest, NextResponse } from "next/server";

/** Decode a JWT payload without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
    );
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let idToken: string | null = null;
    let userJson: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = await request.text();
      const params = new URLSearchParams(body);
      idToken = params.get("id_token");
      userJson = params.get("user"); // Only present on first sign-in
    } else {
      const json = await request.json().catch(() => ({}));
      idToken = json.id_token ?? null;
      userJson = json.user ? JSON.stringify(json.user) : null;
    }

    if (!idToken) {
      return NextResponse.redirect(
        new URL("/?apple_error=missing_token", request.url)
      );
    }

    const payload = decodeJwtPayload(idToken);
    if (!payload?.sub) {
      return NextResponse.redirect(
        new URL("/?apple_error=invalid_token", request.url)
      );
    }

    const email: string = payload.email ?? "";
    let name = "";

    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const first = user?.name?.firstName ?? "";
        const last = user?.name?.lastName ?? "";
        name = [first, last].filter(Boolean).join(" ");
      } catch {
        // Ignore parse errors
      }
    }

    // Redirect to home with the apple_email + apple_name query params.
    // The WelcomeScreen reads these via useSearchParams and auto-continues sign-in.
    const redirectUrl = new URL("/", request.url);
    if (email) redirectUrl.searchParams.set("apple_email", email);
    if (name) redirectUrl.searchParams.set("apple_name", name);
    redirectUrl.searchParams.set("apple_sub", payload.sub);

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error("Apple callback error:", err);
    return NextResponse.redirect(
      new URL("/?apple_error=callback_failed", request.url)
    );
  }
}

/** Apple pings this route with a GET to verify it exists before allowing sign-in. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
