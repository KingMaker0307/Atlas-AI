import type { AtlasSnapshot } from "@/types/domain";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const APP_FOLDER = "atlas-ai-coach-data";
const SNAPSHOT_FILE = "atlas-ai-coach.json";

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let gapiLoaded = false;
let gisLoaded = false;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

function gapiInit(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gapiLoaded) return resolve();
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      gapi.load("client", () => {
        gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] })
          .then(() => {
            gapiLoaded = true;
            resolve();
          })
          .catch(reject);
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function gisInit(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gisLoaded) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID!,
        scope: SCOPES,
        callback: () => {}, // Callback is handled by the promise resolve
      });
      gisLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function getFolderId(): Promise<string> {
  const response = await gapi.client.drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${APP_FOLDER}' and trashed=false`,
    fields: "files(id, name)",
  });
  if (response.result.files && response.result.files.length > 0) {
    return response.result.files[0].id!;
  } else {
    const folderResponse = await gapi.client.drive.files.create({
      resource: {
        name: APP_FOLDER,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });
    return folderResponse.result.id!;
  }
}

async function getFileId(folderId: string): Promise<string | null> {
  const response = await gapi.client.drive.files.list({
    q: `'${folderId}' in parents and name='${SNAPSHOT_FILE}' and trashed=false`,
    fields: "files(id)",
  });
  return response.result.files && response.result.files.length > 0
    ? response.result.files[0].id!
    : null;
}

export async function initGoogleDrive(): Promise<void> {
  await Promise.all([gapiInit(), gisInit()]);
}

export function linkGoogleDrive(): Promise<google.accounts.oauth2.TokenResponse> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error("Google Identity Services not initialized."));
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(resp);
      } else {
        resolve(resp);
      }
    };
    tokenClient.requestAccessToken();
  });
}

export async function saveToGoogleDrive(snapshot: AtlasSnapshot): Promise<void> {
  const folderId = await getFolderId();
  const fileId = await getFileId(folderId);
  const content = JSON.stringify(snapshot);
  const blob = new Blob([content], { type: "application/json" });

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({ name: SNAPSHOT_FILE })], { type: "application/json" }));
  form.append("file", blob);

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
  const method = fileId ? "PATCH" : "POST";

  if (!fileId) {
    const metadata = { name: SNAPSHOT_FILE, parents: [folderId] };
    form.set("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  }

  await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${gapi.client.getToken().access_token}`,
    },
    body: form,
  });
}

export async function loadFromGoogleDrive(): Promise<AtlasSnapshot | null> {
  const folderId = await getFolderId();
  const fileId = await getFileId(folderId);
  if (!fileId) return null;

  const response = await gapi.client.drive.files.get({
    fileId,
    alt: "media",
  });

  return JSON.parse(response.body) as AtlasSnapshot;
}