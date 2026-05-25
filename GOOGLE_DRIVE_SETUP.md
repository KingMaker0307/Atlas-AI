# Google Drive Service Account Sync & Blocker Setup

Atlas AI Coach supports automatic, silent synchronization of user profiles, progress photos, and workouts to the Google Drive folder:
`https://drive.google.com/drive/folders/1aAQzmKx1fMEybj_MGT8_Zy0a0HjCzPBl?usp=share_link` (Folder ID: `1aAQzmKx1fMEybj_MGT8_Zy0a0HjCzPBl`)

This setup uses a **Google Service Account** (a secure programmatic account managed by Google Cloud) to perform backend file uploads and checks.

---

## Part 1: Create a Google Service Account

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select an existing project or click **Create Project** at the top right.
3. In the left navigation menu, go to **IAM & Admin** -> **Service Accounts**.
4. Click **Create Service Account** at the top.
5. Provide a name (e.g., `atlas-drive-sync`) and click **Create and Continue**, then click **Done**.
6. Find your newly created Service Account in the list, click its row, and navigate to the **Keys** tab.
7. Click **Add Key** -> **Create New Key**.
8. Select **JSON** as the key type and click **Create**. A JSON file containing your credentials will automatically download to your computer.
9. Open this JSON file in a text editor to view your credentials.

---

## Part 2: Share the Google Drive Folder

1. Open your target Google Drive folder:
   `https://drive.google.com/drive/folders/1aAQzmKx1fMEybj_MGT8_Zy0a0HjCzPBl?usp=share_link`
2. Click the **Share** button at the top right.
3. In the "Add people and groups" field, paste the `client_email` address found in your downloaded credentials JSON file (e.g., `atlas-drive-sync@your-project-id.iam.gserviceaccount.com`).
4. Set its role to **Editor**.
5. Click **Send** (uncheck "Notify people" to avoid email delivery failures).

---

## Part 3: Configure Environment Variables

Create or modify the `.env` file in the root of your project:

```env
# Google Service Account Credentials
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=atlas-drive-sync@your-project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

> [!IMPORTANT]
> - Ensure the `GOOGLE_DRIVE_PRIVATE_KEY` starts with `-----BEGIN PRIVATE KEY-----` and ends with `-----END PRIVATE KEY-----`.
> - Replace all newlines in the private key with the literal `\n` characters, and enclose the entire private key in double quotes.

### Optional: Cross-Origin Hosting (GitHub Pages + Vercel)
If you deploy the static PWA frontend to **GitHub Pages** (which requires uncommenting `output: "export"` in `next.config.js`) and host the backend API on a separate service (like **Vercel**), configure:

```env
# URL of your Vercel deployment where the API route is running
NEXT_PUBLIC_BACKEND_URL=https://your-backend-api.vercel.app
```

---

## Part 4: Testing & Verification

### Testing Administrator Blocking (Mock Mode)
If no environment variables are defined, the app falls back to **Local Mock Mode**.
1. Open the browser DevTools Console.
2. Find the user ID:
   ```javascript
   const userId = JSON.parse(localStorage.getItem('atlas-ai-coach')).state.profile.id
   ```
3. Set the block status inside LocalStorage:
   ```javascript
   localStorage.setItem('atlas_mock_drive_' + userId, JSON.stringify({ blocked: true }))
   ```
4. Reload the page. The app will immediately block any usage and display the **Access Denied** suspend screen.

### Testing Service Account Mode
1. Configure your `.env` variables and start local dev: `npm run dev`.
2. Complete onboarding. Your profile details will be silently synchronized and created in the folder as `profile_<userId>.json`.
3. Open `profile_<userId>.json` directly in Google Drive, edit it, and set `"blocked": true`.
4. In the app, you will be blocked on the next screen mount or within 60 seconds (periodic poll).
