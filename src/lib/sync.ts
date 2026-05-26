const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// Normalize base backend URL
function getApiUrl(path: string): string {
  if (!BACKEND_URL) return path;
  const base = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${base}${path}`;
}

// Local Mock Drive helpers using LocalStorage
function getMockDriveData(userId: string): any {
  if (typeof window === "undefined") return { blocked: false };
  const raw = localStorage.getItem(`atlas_mock_drive_${userId}`);
  if (!raw) return { blocked: false };
  try {
    return JSON.parse(raw);
  } catch {
    return { blocked: false };
  }
}

function writeMockDriveData(userId: string, data: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`atlas_mock_drive_${userId}`, JSON.stringify(data));
}

// Detect if real backend parameters are present (either cross-origin backend URL, or running on local dev server)
function hasBackend(): boolean {
  // If we have an explicit backend URL, we definitely have a backend.
  if (!!BACKEND_URL) return true;
  // If running locally or on Vercel, we have server-side endpoint route capability.
  // During static export, process.env is checked at build time.
  return typeof window !== "undefined" && window.location.hostname !== "";
}

/**
 * Checks if a user is blocked by querying the backend API
 * or falling back to Local Mock Drive.
 */
export async function checkBlockedStatus(userId: string): Promise<boolean> {
  if (!userId) return false;

  if (hasBackend()) {
    try {
      const url = getApiUrl(`/api/profile/?userId=${encodeURIComponent(userId)}`);
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        // If server confirms it's mock or drive mode, return the status
        if (data.mode) {
          return data.blocked === true;
        }
      }
    } catch (error) {
      console.error("Backend block check failed, falling back:", error);
    }
  }

  // Local Mock Drive Fallback
  const mockData = getMockDriveData(userId);
  return mockData.blocked === true || mockData.status === "blocked";
}

/**
 * Synchronizes user snapshot data silently to the Google Drive backend API
 * or Local Mock Drive.
 */
export async function syncProfile(
  userId: string,
  snapshot: any
): Promise<{ success: boolean; blocked: boolean; mode: "drive" | "mock" }> {
  if (!userId || !snapshot) {
    return { success: false, blocked: false, mode: "mock" };
  }

  if (hasBackend()) {
    try {
      const url = getApiUrl("/api/profile/");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          snapshot,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: data.success === true,
          blocked: data.blocked === true,
          mode: data.mode || "drive",
        };
      }
    } catch (error) {
      console.error("Backend sync failed, falling back:", error);
    }
  }

  // Local Mock Drive Fallback
  const mockData = getMockDriveData(userId);
  const isBlocked = mockData.blocked === true || mockData.status === "blocked";

  if (isBlocked) {
    return { success: false, blocked: true, mode: "mock" };
  }

  const newPayload = {
    blocked: false,
    lastSyncedAt: new Date().toISOString(),
    ...snapshot,
  };
  writeMockDriveData(userId, newPayload);

  console.log(`[Google Drive Mock] Silently saved profile for user ${userId} to localStorage key "atlas_mock_drive_${userId}"`);
  return { success: true, blocked: false, mode: "mock" };
}
