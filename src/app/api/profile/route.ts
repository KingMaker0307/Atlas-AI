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

// Sign JWT for Google Service Account authentication
async function getGoogleAccessToken(email: string, privateKey: string): Promise<string> {
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
    throw new Error(`Google OAuth failed: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Find profile file in Google Drive folder
async function findDriveFile(accessToken: string, userId: string): Promise<string | null> {
  const query = `name = 'profile_${userId}.json' and '${FOLDER_ID}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive search failed: ${errText}`);
  }

  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
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

// Create a new file in Google Drive folder
async function createDriveFile(accessToken: string, userId: string, content: any): Promise<void> {
  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
  const boundary = "atlas_sync_boundary_" + Date.now();
  
  const metadata = JSON.stringify({
    name: `profile_${userId}.json`,
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
    throw new Error(`Failed to create Drive file: ${errText}`);
  }
}

// Update file in Google Drive folder
async function updateDriveFile(accessToken: string, fileId: string, content: any): Promise<void> {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
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
    throw new Error(`Failed to update Drive file: ${errText}`);
  }
}

// Ensure the local mock directory exists
function ensureMockDir() {
  if (!fs.existsSync(MOCK_DIR)) {
    fs.mkdirSync(MOCK_DIR, { recursive: true });
  }
}

// Local mock file helpers
function getMockFilePath(userId: string): string {
  ensureMockDir();
  return path.join(MOCK_DIR, `profile_${userId}.json`);
}

// Check if credentials exist
function hasCredentials(): boolean {
  return (
    !!process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL &&
    !!process.env.GOOGLE_DRIVE_PRIVATE_KEY
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400, headers: corsHeaders(request) });
    }

    // Fallback Mock Mode
    if (!hasCredentials()) {
      const filePath = getMockFilePath(userId);
      if (fs.existsSync(filePath)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const isBlocked = fileData.blocked === true || fileData.status === "blocked";
          return NextResponse.json({ blocked: isBlocked, mode: "mock" }, { headers: corsHeaders(request) });
        } catch {
          return NextResponse.json({ blocked: false, mode: "mock" }, { headers: corsHeaders(request) });
        }
      }
      return NextResponse.json({ blocked: false, mode: "mock" }, { headers: corsHeaders(request) });
    }

    // Real Google Drive Mode
    const email = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL!;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY!;
    
    const accessToken = await getGoogleAccessToken(email, privateKey);
    const fileId = await findDriveFile(accessToken, userId);

    if (fileId) {
      const fileData = await getDriveFileContent(accessToken, fileId);
      const isBlocked = fileData.blocked === true || fileData.status === "blocked" || fileData.profile?.blocked === true;
      return NextResponse.json({ blocked: isBlocked, mode: "drive" }, { headers: corsHeaders(request) });
    }

    return NextResponse.json({ blocked: false, mode: "drive" }, { headers: corsHeaders(request) });
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
    const { userId, snapshot } = body;

    if (!userId || !snapshot) {
      return NextResponse.json({ error: "Missing userId or snapshot" }, { status: 400, headers: corsHeaders(request) });
    }

    // Fallback Mock Mode
    if (!hasCredentials()) {
      const filePath = getMockFilePath(userId);
      let isBlocked = false;

      if (fs.existsSync(filePath)) {
        try {
          const existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          isBlocked = existingData.blocked === true || existingData.status === "blocked";
        } catch (e) {
          // Ignore parse errors
        }
      }

      if (isBlocked) {
        return NextResponse.json({ blocked: true, mode: "mock" }, { headers: corsHeaders(request) });
      }

      // Write mock file
      const newContent = {
        blocked: false,
        lastSyncedAt: new Date().toISOString(),
        ...snapshot,
      };
      fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2), "utf-8");
      
      console.log(`[Google Drive Mock] Silently saved profile for user ${userId} to src/data/drive_mocks/profile_${userId}.json`);
      return NextResponse.json({ success: true, blocked: false, mode: "mock" }, { headers: corsHeaders(request) });
    }

    // Real Google Drive Mode
    const email = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL!;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY!;
    
    const accessToken = await getGoogleAccessToken(email, privateKey);
    const fileId = await findDriveFile(accessToken, userId);

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

    if (fileId) {
      await updateDriveFile(accessToken, fileId, payload);
      console.log(`[Google Drive API] Silently updated profile_${userId}.json in Google Drive`);
    } else {
      await createDriveFile(accessToken, userId, payload);
      console.log(`[Google Drive API] Silently created profile_${userId}.json in Google Drive`);
    }

    return NextResponse.json({ success: true, blocked: false, mode: "drive" }, { headers: corsHeaders(request) });
  } catch (error: any) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synchronize profile" },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}
