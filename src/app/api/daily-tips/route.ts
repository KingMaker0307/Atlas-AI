import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Try to fetch from the remote repository server-side (avoids browser CORS)
    const url = "https://raw.githubusercontent.com/KingMaker0307/Atlas-AI/main/public/daily-tips.json";
    const res = await fetch(url, { 
      cache: "no-cache",
      headers: { "User-Agent": "AtlasAICoach-App" }
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn("[daily-tips] Remote fetch failed, falling back to local file:", err);
  }

  // 2. Fall back to reading the local public/daily-tips.json file
  try {
    const filePath = path.join(process.cwd(), "public", "daily-tips.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(fileContent);
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error("[daily-tips] Local file read failed:", err);
  }

  return NextResponse.json({ error: "Failed to load daily tips" }, { status: 500 });
}
