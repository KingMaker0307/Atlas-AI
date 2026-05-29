import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const FOLDER_ID = "1aAQzmKx1fMEybj_MGT8_Zy0a0HjCzPBl";
const MOCK_DIR = path.join(process.cwd(), "src/data/drive_mocks");

// Helpers for CORS headers to allow cross-origin requests (e.g. from GitHub Pages)
function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(request),
  });
}

// Exchange OAuth 2.0 Refresh Token for a temporary Access Token
async function getOAuthAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedErr: any = null;
    try {
      parsedErr = JSON.parse(errText);
    } catch (_) {}

    if (parsedErr && parsedErr.error === "unauthorized_client") {
      throw new Error(
        `Google OAuth Refresh failed: unauthorized_client. This means the Client ID or Client Secret in your .env file does not match the credentials used to generate the Refresh Token. Ensure you checked "Use your own OAuth credentials" in the Google OAuth Playground (gear icon) and pasted the exact Client ID and Secret before generating the token.`
      );
    }
    if (parsedErr && parsedErr.error === "invalid_grant") {
      throw new Error(
        `Google OAuth Refresh failed: invalid_grant. This means the Refresh Token is invalid, expired, or revoked. Please regenerate the Refresh Token in the Google OAuth Playground.`
      );
    }
    throw new Error(`Google OAuth Refresh failed: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Sign JWT for Google Service Account authentication
async function getServiceAccountAccessToken(email: string, privateKey: string): Promise<string> {
  const cleanKey = privateKey.replace(/\\n/g, "\n");
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    sub: email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signInput = `${base64Header}.${base64Payload}`;
  
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signInput);
  const signature = signer.sign(cleanKey, "base64url");
  const jwt = `${signInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Service Account OAuth failed: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Retrieve Access Token depending on configured environment variables
async function getAccessToken(): Promise<string> {
  // Option 1: User OAuth Refresh Token
  if (
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  ) {
    return getOAuthAccessToken(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    );
  }

  // Option 2: Service Account JWT
  if (
    process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_DRIVE_PRIVATE_KEY
  ) {
    return getServiceAccountAccessToken(
      process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL,
      process.env.GOOGLE_DRIVE_PRIVATE_KEY
    );
  }

  throw new Error("Missing credentials. Please configure Google OAuth or Service Account in environment.");
}

// Sanitize user name to form a safe filename chunk
function getSanitizedFileName(userId: string, userName?: string): string {
  if (!userName) return `profile_${userId}.json`;
  const cleanName = userName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleanName ? `profile_${cleanName}_${userId}.json` : `profile_${userId}.json`;
}

// Find profile file in Google Drive folder by listing files and scanning for the email or userId
async function findDriveFile(accessToken: string, userId: string, email?: string): Promise<{ id: string; name: string } | null> {
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    const query = `'${FOLDER_ID}' in parents and name = 'profile_email_${cleanEmail}.json' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.ok) {
      const data = await res.json();
      const files = data.files || [];
      if (files.length > 0) return { id: files[0].id, name: files[0].name };
    }
  }

  if (userId) {
    const query = `'${FOLDER_ID}' in parents and name contains '${userId}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.ok) {
      const data = await res.json();
      const files = data.files || [];
      const match = files.find((file: any) => file.name && file.name.includes(userId));
      if (match) return { id: match.id, name: match.name };
    }
  }

  return null;
}

// Get file content from Google Drive
async function getDriveFileContent(accessToken: string, fileId: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download Drive file: ${errText}`);
  }

  return res.json();
}

// Retry a Drive fetch with exponential backoff for transient errors (503, 429, 500)
async function withDriveRetry<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  const TRANSIENT = new Set([429, 500, 503]);
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Only retry on transient status codes
      const isTransient =
        TRANSIENT.has(err?.status) ||
        /transient|temporarily|rate.?limit|service.?unavailable/i.test(err?.message ?? "");
      if (!isTransient || attempt === maxAttempts - 1) throw err;
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// Create a new file in Google Drive folder
async function createDriveFile(accessToken: string, userId: string, fileName: string, content: any): Promise<void> {
  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true";
  const boundary = "atlas_sync_boundary_" + Date.now();

  const metadata = JSON.stringify({
    name: fileName,
    parents: [FOLDER_ID],
  });

  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadata,
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(content, null, 2),
    `--${boundary}--`,
  ].join("\r\n");

  await withDriveRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Failed to create Drive file: ${errText}`) as any;
      err.status = res.status;
      throw err;
    }
  });
}

// Update file in Google Drive folder
async function updateDriveFile(accessToken: string, fileId: string, content: any): Promise<void> {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`;
  await withDriveRetry(async () => {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content, null, 2),
    });
    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Failed to update Drive file: ${errText}`) as any;
      err.status = res.status;
      throw err;
    }
  });
}

// Rename file in Google Drive
async function renameDriveFile(accessToken: string, fileId: string, newName: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to rename Drive file: ${errText}`);
  }
}

// Ensure the local mock directory exists
function ensureMockDir() {
  if (!fs.existsSync(MOCK_DIR)) {
    fs.mkdirSync(MOCK_DIR, { recursive: true });
  }
}

// Find existing mock file by searching the mock directory for the email or userId
function findMockFilePath(userId: string, email?: string): string | null {
  ensureMockDir();
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    const targetName = `profile_email_${cleanEmail}.json`;
    const filePath = path.join(MOCK_DIR, targetName);
    if (fs.existsSync(filePath)) return filePath;
  }
  try {
    const files = fs.readdirSync(MOCK_DIR);
    const match = files.find((file) => file.includes(userId));
    return match ? path.join(MOCK_DIR, match) : null;
  } catch (error) {
    console.error("Failed to read mock directory:", error);
    return null;
  }
}

// Check if any credentials exist
function hasCredentials(): boolean {
  return (
    (!!process.env.GOOGLE_DRIVE_CLIENT_ID &&
      !!process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
      !!process.env.GOOGLE_DRIVE_REFRESH_TOKEN) ||
    (!!process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL &&
      !!process.env.GOOGLE_DRIVE_PRIVATE_KEY)
  );
}

// Check if error is a connection network exception or timeout
function isNetworkOrTimeoutError(error: any): boolean {
  if (!error) return false;
  const errMsg = String(error.message || error).toLowerCase();
  
  if (
    errMsg.includes("fetch failed") || 
    errMsg.includes("timeout") || 
    errMsg.includes("timedout") || 
    errMsg.includes("etimedout") || 
    errMsg.includes("enotfound") || 
    errMsg.includes("econnrefused") ||
    errMsg.includes("network") ||
    errMsg.includes("connect")
  ) {
    return true;
  }
  
  const code = error.code || (error.cause && (error.cause as any).code);
  if (code) {
    const networkCodes = ["ETIMEDOUT", "ENOTFOUND", "ECONNREFUSED", "EHOSTUNREACH", "EPIPE", "ECONNRESET", "EAI_AGAIN"];
    if (networkCodes.includes(String(code).toUpperCase())) {
      return true;
    }
  }

  if (error.cause && Array.isArray((error.cause as any).errors)) {
    for (const subErr of (error.cause as any).errors) {
      if (isNetworkOrTimeoutError(subErr)) return true;
    }
  }
  
  return false;
}

// Fallback Mock operations
function handleMockGet(userId: string, email: string | null, fetchContent: boolean, request: NextRequest) {
  const filePath = findMockFilePath(userId, email || undefined);
  if (filePath && fs.existsSync(filePath)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const isBlocked = fileData.blocked === true || fileData.status === "blocked";
      return NextResponse.json({ 
        blocked: isBlocked, 
        mode: "mock", 
        snapshot: fetchContent ? fileData : undefined 
      }, { headers: corsHeaders(request) });
    } catch {
      return NextResponse.json({ blocked: false, mode: "mock" }, { headers: corsHeaders(request) });
    }
  }
  return NextResponse.json({ blocked: false, mode: "mock" }, { headers: corsHeaders(request) });
}

function handleMockPost(userId: string, emailToUse: string | null | undefined, snapshot: any, request: NextRequest) {
  const existingPath = findMockFilePath(userId, emailToUse || undefined);
  let isBlocked = false;

  if (existingPath && fs.existsSync(existingPath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
      isBlocked = existingData.blocked === true || existingData.status === "blocked";
    } catch (e) {
      // Ignore parse errors
    }
  }

  if (isBlocked) {
    return NextResponse.json({ blocked: true, mode: "mock" }, { headers: corsHeaders(request) });
  }

  const targetName = emailToUse
    ? `profile_email_${emailToUse.toLowerCase().trim()}.json`
    : getSanitizedFileName(userId, snapshot?.profile?.name);
  const newPath = path.join(MOCK_DIR, targetName);

  // Delete the old file if it has a different name (e.g. user renamed or set email)
  if (existingPath && existingPath !== newPath && fs.existsSync(existingPath)) {
    try {
      fs.unlinkSync(existingPath);
    } catch (e) {
      console.error("Failed to delete old mock file:", e);
    }
  }

  // Write mock file
  const newContent = {
    blocked: false,
    lastSyncedAt: new Date().toISOString(),
    ...snapshot,
  };
  fs.writeFileSync(newPath, JSON.stringify(newContent, null, 2), "utf-8");
  
  console.log(`[Cloud Sync Mock] Silently saved profile for user ${userId} to ${newPath}`);
  return NextResponse.json({ success: true, blocked: false, mode: "mock" }, { headers: corsHeaders(request) });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const fetchContent = searchParams.get("content") === "true";

    if (!userId && !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400, headers: corsHeaders(request) });
    }

    // Fallback Mock Mode if credentials are not configured
    if (!hasCredentials()) {
      return handleMockGet(userId || "", email, fetchContent, request);
    }

    // Real Google Drive Mode
    try {
      const accessToken = await getAccessToken();
      const fileInfo = await findDriveFile(accessToken, userId || "", email || undefined);
      const fileId = fileInfo ? fileInfo.id : null;

      if (fileId) {
        const fileData = await getDriveFileContent(accessToken, fileId);
        const isBlocked = fileData.blocked === true || fileData.status === "blocked" || fileData.profile?.blocked === true;
        return NextResponse.json({ 
          blocked: isBlocked, 
          mode: "drive", 
          snapshot: fetchContent ? fileData : undefined 
        }, { headers: corsHeaders(request) });
      }

      return NextResponse.json({ blocked: false, mode: "drive" }, { headers: corsHeaders(request) });
    } catch (driveError: any) {
      // Fallback silently if there is any network timeout/connection error
      if (isNetworkOrTimeoutError(driveError)) {
        console.warn("[Cloud Sync] Google Drive connection timeout or offline. Gracefully falling back to local Mock Sync:", driveError.message || driveError);
        return handleMockGet(userId || "", email, fetchContent, request);
      }
      throw driveError;
    }
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve profile status" },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, snapshot } = body;

    if (!userId || !snapshot) {
      return NextResponse.json({ error: "Missing userId or snapshot" }, { status: 400, headers: corsHeaders(request) });
    }

    const emailToUse = email || snapshot?.profile?.email;

    // Fallback Mock Mode if credentials are not configured
    if (!hasCredentials()) {
      return handleMockPost(userId, emailToUse, snapshot, request);
    }

    // Real Google Drive Mode
    try {
      const accessToken = await getAccessToken();
      const fileInfo = await findDriveFile(accessToken, userId, emailToUse);
      const fileId = fileInfo ? fileInfo.id : null;

      let isBlocked = false;
      let existingContent: any = null;

      if (fileId) {
        existingContent = await getDriveFileContent(accessToken, fileId);
        isBlocked =
          existingContent.blocked === true ||
          existingContent.status === "blocked" ||
          existingContent.profile?.blocked === true;
      }

      if (isBlocked) {
        return NextResponse.json({ blocked: true, mode: "drive" }, { headers: corsHeaders(request) });
      }

      const payload = {
        blocked: false,
        lastSyncedAt: new Date().toISOString(),
        ...snapshot,
      };

      const targetFileName = emailToUse
        ? `profile_email_${emailToUse.toLowerCase().trim()}.json`
        : getSanitizedFileName(userId, snapshot?.profile?.name);

      if (fileId) {
        // Check if filename has changed
        if (fileInfo && fileInfo.name !== targetFileName) {
          try {
            await renameDriveFile(accessToken, fileId, targetFileName);
            console.log(`[Google Drive API] Renamed file ${fileId} to ${targetFileName}`);
          } catch (e) {
            console.error("Failed to rename Google Drive file:", e);
          }
        }
        await updateDriveFile(accessToken, fileId, payload);
        console.log(`[Google Drive API] Silently updated ${targetFileName} in Google Drive`);
      } else {
        await createDriveFile(accessToken, userId, targetFileName, payload);
        console.log(`[Google Drive API] Silently created ${targetFileName} in Google Drive`);
      }

      return NextResponse.json({ success: true, blocked: false, mode: "drive" }, { headers: corsHeaders(request) });
    } catch (driveError: any) {
      // Fallback silently if there is any network timeout/connection error
      if (isNetworkOrTimeoutError(driveError)) {
        console.warn("[Cloud Sync] Google Drive connection timeout or offline. Gracefully falling back to local Mock Sync:", driveError.message || driveError);
        return handleMockPost(userId, emailToUse, snapshot, request);
      }
      throw driveError;
    }
  } catch (error: any) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synchronize profile" },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}
