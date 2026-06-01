# Google Drive Synchronization & Admin Blocking Setup

Atlas AI Coach supports automatic, silent synchronization of user profiles, progress photos, and workouts to the Google Drive folder:
`https://drive.google.com/drive/folders/1aAQzmKx1fMEybj_MGT8_Zy0a0HjCzPBl?usp=share_link` (Folder ID: `1aAQzmKx1fMEybj_MGT8_Zy0a0HjCzPBl`)

---

## 🚨 The Service Account Storage Quota Limitation
By default, Google Service Accounts have a **0-byte storage quota** on personal Google Drives. If you upload a file using a Service Account into a shared folder on a personal account, you will receive a `403 storageQuotaExceeded` error because the Service Account is designated as the file owner, and it has no quota.

To solve this, we support **OAuth 2.0 User Credentials (Refresh Token)**. This allows the app to authenticate as your own personal account, saving files directly under your name and counting against your personal 15GB free storage quota.

---

## Method A: Set up OAuth 2.0 User Credentials (Recommended)

Follow these steps to obtain your client credentials and a persistent refresh token:

### Step 1: Create OAuth Credentials in Google Cloud
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project at the top.
3. In the search bar at the top, search for **"Google Drive API"** and ensure it is **Enabled**.
4. In the left navigation menu, go to **APIs & Services** -> **OAuth consent screen**.
5. Choose **External**, click **Create**, fill in the app name/emails, and click **Save**. 
   
   > [!IMPORTANT]
   > **Resolving Error 403: access_denied**
   > If your app's publishing status is **Testing**, Google restricts login access. You will get a `403: access_denied` error during authentication unless you do one of the following:
   > - **Add a Test User**: On the OAuth consent screen page, scroll down to **Test users**, click **+ Add users**, and add the Gmail address you plan to authenticate with.
   > - **Publish the App**: Click **Publish App** under the "Publishing status" section to put it in production (this also prevents your refresh token from expiring after 7 days).
   
6. Go to **APIs & Services** -> **Credentials**.
7. Click **Create Credentials** -> **OAuth client ID**.
8. Set the application type to **Web application**.
9. In the **Authorized redirect URIs** section, click **Add URI** and enter:
   `https://developers.google.com/oauthplayground`
10. Click **Create** and copy your **Client ID** and **Client Secret**.

### Step 2: Generate a Refresh Token via Google OAuth Playground
1. Go to the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the **Gear icon (Configuration)** in the top right.
3. Check the box **"Use your own OAuth credentials"**.
4. Enter your **OAuth Client ID** and **OAuth Client Secret**, then click **Close**.
5. In **Step 1 (Select & authorize APIs)**, paste the following scope into the input box:
   `https://www.googleapis.com/auth/drive`
6. Click **Authorize APIs** and log in to your personal Gmail account (click "Advanced" and "Go to App" if you see a warning screen).
7. In **Step 2 (Exchange authorization code for tokens)**, click **Exchange authorization code for tokens**.
8. Copy the **Refresh token** from the fields shown on the left.

### Step 3: Configure your `.env` file
Open your `.env` file and replace the Service Account keys with:

```env
GOOGLE_DRIVE_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_DRIVE_REFRESH_TOKEN=your-oauth-refresh-token
```

---

## Method B: Set up a Service Account (Shared Drives Only)
*Note: This option only works if the target folder is inside a Google Workspace Shared Drive, which has its own organization-level quota.*

1. In the Google Cloud Console, go to **IAM & Admin** -> **Service Accounts** and create an account.
2. Under the **Keys** tab, click **Add Key** -> **Create New Key** -> **JSON**.
3. Share your folder ID (`1aAQzmKx1fMEybj_MGT8_Zy0a0HjCzPBl`) with the Service Account email as an **Editor**.
4. Configure your `.env` file:
   ```env
   GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
   GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_BODY\n-----END PRIVATE KEY-----\n"
   ```

---

## 🌐 Production Release: Enabling Google Sign-In for All Users

To deploy the app to production so that **any** user on the web can log in with their personal Google Account without encountering `access_denied`, `GSI_LOGGER`, or verification blocks, complete these simple configuration steps:

### 1. Publish the OAuth Consent Screen to Production
By default, your Google Cloud OAuth app is in **Testing** status. This limits access to specifically declared test accounts.
1. Go to the [Google Cloud Console OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent).
2. Under the **Publishing status** section, click **Publish App**.
3. Confirm the push to production. 
   *(Note: For simple scopes like email/profile, Google does not require a formal verification review, so your app goes live instantly for everyone!)*

### 2. Configure Production Allowed JavaScript Origins
Google Identity Services restricts sign-in buttons to domains registered in your Client ID settings:
1. Go to the [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Click your OAuth 2.0 Web Client ID to edit it.
3. Under **Authorized JavaScript origins**, click **Add URI** and enter your production domain (e.g., `https://your-app-domain.vercel.app` or `https://your-custom-domain.com`).
4. Click **Save** at the bottom. *(Allow up to 5 minutes for Google to update global domain cache).*

### 3. Expose Client ID to Production Frontend
In your production hosting environment (e.g., Vercel, Netlify, AWS):
1. Add an Environment Variable key: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
2. Set its value to your exact Google Client ID: `59606573141-j2el2qru2gg4g9aj8mqgc1tbn6lhtt7t.apps.googleusercontent.com` (or your custom Client ID if you generated a new one).

---

## Part 4: Testing & Verification

1. Start your local server: `npm run dev`.
2. Open the app, go to **Settings**, and click **Sync Now**.
3. Check your Google Drive folder: the profile file `profile_<userId>.json` will appear.
4. To test administrator blocking, open this JSON file inside your Google Drive, edit it to include `"blocked": true`, and save. You will be blocked from accessing the app within 60 seconds.
