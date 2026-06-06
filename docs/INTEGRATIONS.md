# Integrations Setup Guide

Step-by-step instructions for registering CallNote Pro as an OAuth
application on HubSpot, Salesforce, and Microsoft Teams (Azure AD).
Each section covers account creation, redirect URI registration,
scope selection, and copying credentials into Vercel + GitHub secrets.

For a complete list of every environment variable CallNote Pro reads
(including non-OAuth ones), see [`.env.example`](../.env.example). To
verify which are set in your environment, run:

```bash
npx tsx scripts/check-env.ts
```

When `NODE_ENV=development` and no real credentials are present, the
integrations API short-circuits to a dev sandbox so the Connect button
stays clickable. See [Dev Sandbox Mode](#dev-sandbox-mode) at the bottom
of this document.

## Production redirect URI

All three providers share the same redirect target:

```
https://sales-call-notes.vercel.app/integrations
```

The `/integrations` page handles the `?code=...&state=provider` callback
that each platform sends back, then POSTs the code to
`/api/integrations` for token exchange. Local dev uses
`http://localhost:3000/integrations` (or whatever `NEXT_PUBLIC_APP_URL`
is set to).

---

## HubSpot

**OAuth 2.0 Authorization Code flow. Required for the `Live` HubSpot
card on `/integrations`.**

1. Go to <https://developers.hubspot.com/> and sign in with the HubSpot
   account that owns the CRM data you want to sync. A free developer
   account is fine; the resulting public app can be installed into any
   HubSpot portal.

2. From the top nav, click **Apps** then **Create app**. Choose the
   **Public app** template (legacy "Private app" is not supported by the
   OAuth flow CallNote Pro uses).

3. On the **Info** tab, set:
   - **App name**: `CallNote Pro`
   - **Description**: `Sync call notes, transcripts, and action items
     from CallNote Pro into HubSpot deals and contacts.`
   - **Logo**: optional, but required before public listing.

4. Switch to the **Auth** tab and configure:
   - **Redirect URL**: `https://sales-call-notes.vercel.app/integrations`
     (add a second entry with `http://localhost:3000/integrations` for
     local dev).
   - **Token URL**: leave the default
     `https://api.hubapi.com/oauth/v1/token`.
   - **Authorization URL**: leave the default
     `https://app.hubspot.com/oauth/authorize`.

5. On the **Scopes** tab, enable exactly these four scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`

   (CallNote Pro only writes to the `note` association on deals, so
   `crm.objects.notes.write` is requested at runtime by the API
   handler but does not need to be pre-checked here.)

6. Click **Create app** in the top right. HubSpot displays the
   **Client ID** and **Client Secret** exactly once - copy both.

7. Add the credentials to Vercel and GitHub:

   ```bash
   vercel env add HUBSPOT_CLIENT_ID      production
   vercel env add HUBSPOT_CLIENT_SECRET  production
   vercel gh add-secret HUBSPOT_CLIENT_ID
   vercel gh add-secret HUBSPOT_CLIENT_SECRET
   ```

   For local dev, add the same two keys to `.env.local`.

8. **Test locally**: `npm run dev`, visit
   `http://localhost:3000/integrations`, click **Connect** on the
   HubSpot card. You should be redirected to HubSpot's consent screen
   and returned to the integrations page as **Connected**.

9. **Troubleshooting**:
   - 400 `redirect_uri_mismatch` - the URL registered on the Auth tab
     does not exactly match the one CallNote Pro sends. Watch for
     trailing slashes.
   - 403 `MISSING_SCOPES` - one of the four scopes above is unchecked.

---

## Salesforce

**OAuth 2.0 Authorization Code with PKCE. Required for the `Live`
Salesforce card on `/integrations`.**

1. Go to <https://developer.salesforce.com/> and click **Sign up** to
   create a free Developer Edition org. This is a fully functional
   Salesforce instance; no production data lives here, so it's safe
   to use for testing.

2. Once your dev org is provisioned, sign in and go to **Setup** (gear
   icon, top right) -> **App Manager** -> **New Connected App**.

3. Fill in the basics:
   - **Connected App Name**: `CallNote Pro`
   - **API Name**: `CallNote_Pro` (auto-derived)
   - **Contact Email**: the support address you want Salesforce users
     to reach.
   - **Description**: `Sync call notes and action items from CallNote
     Pro into Salesforce opportunities and accounts.`
   - **Logo URL**: leave blank for the dev org.

4. Check **Enable OAuth Settings** and configure:
   - **Callback URL**:
     `https://sales-call-notes.vercel.app/integrations`
     (add a second entry with `http://localhost:3000/integrations` for
     local dev; one URL per line).
   - **Selected OAuth Scopes** (move from "Available" to "Selected"):
     - `api` (mandatory)
     - `refresh_token` (mandatory - allows offline access)
     - `offline_access` (mandatory - the long-lived refresh token)
   - **Enable PKCE Extension for Web Server Flow** - check this.
   - **Require Secret for Web Server Flow** - leave unchecked (PKCE
     replaces it).
   - **Enable OAuth Implicit Flow** - leave unchecked.

5. Click **Save**, then click **Continue** on the warning. On the
   detail page that opens, click **Manage Consumer Details** then
   **Verify** if prompted. Copy the **Consumer Key** (this is the
   `SALESFORCE_CLIENT_ID`) and **Consumer Secret** (this is the
   `SALESFORCE_CLIENT_SECRET`).

6. Add the credentials to Vercel and GitHub:

   ```bash
   vercel env add SALESFORCE_CLIENT_ID     production
   vercel env add SALESFORCE_CLIENT_SECRET production
   vercel gh add-secret SALESFORCE_CLIENT_ID
   vercel gh add-secret SALESFORCE_CLIENT_SECRET
   ```

   For sandbox orgs, also set:

   ```
   SALESFORCE_LOGIN_URL=https://test.salesforce.com
   ```

   Production orgs default to `https://login.salesforce.com`, which is
   the value hardcoded in the integrations route.

7. **Test locally**: `npm run dev`, visit
   `http://localhost:3000/integrations`, click **Connect** on the
   Salesforce card. After the OAuth dance you should land back on
   `/integrations` with the card showing **Connected** and a synced
   timestamp.

8. **Troubleshooting**:
   - `invalid_grant` on the token exchange - the `code` has already
     been used or expired (Salesforce codes are single-use and live
     for ~10 minutes). Restart the flow.
   - `redirect_uri_mismatch` - the URL registered on the Connected App
     must match exactly, including protocol and trailing slash.

---

## Microsoft Teams (Azure AD)

**OAuth 2.0 Authorization Code against Microsoft Graph. Required for
the `Live` Teams card on `/integrations` (the actual API surfaces
Planner tasks + calendar meetings).**

1. Go to <https://portal.azure.com/> and sign in with the Microsoft
   account that owns the tenant you want to integrate with. Personal
   accounts are fine for the dev tenant.

2. Search for **App registrations** in the top bar, click the result,
   then click **+ New registration**.

3. Fill in:
   - **Name**: `CallNote Pro`
   - **Supported account types**: pick **Accounts in any
     organizational directory (Any Microsoft Entra ID tenant - Multitenant)
     and personal Microsoft accounts (e.g. Skype, Xbox)**. This is the
     most permissive option and is required if individual users will
     sign in with personal Microsoft accounts.
   - **Redirect URI**: select **Web** from the dropdown, then enter
     `https://sales-call-notes.vercel.app/integrations`. Add a second
     entry with `http://localhost:3000/integrations` for local dev.

4. Click **Register**. On the app **Overview** page, copy the
   **Application (client) ID** - this is `TEAMS_CLIENT_ID`.

5. In the left nav, click **Certificates & secrets** ->
   **+ New client secret**. Add a description (`CallNote Pro prod`)
   and choose an expiry (24 months is the max; set a calendar reminder
   to rotate). Click **Add**. Copy the **Value** column (not the
   Secret ID) - this is `TEAMS_CLIENT_SECRET`. The value is only
   visible immediately after creation.

6. In the left nav, click **API permissions** -> **+ Add a permission**
   -> **Microsoft Graph** -> **Delegated permissions**, and add:
   - `User.Read` (required for /me resolution)
   - `Calendars.ReadWrite` (read + create meeting events)
   - `OnlineMeetings.ReadWrite` (create Teams meetings)
   - `offline_access` (long-lived refresh tokens)

   Click **Add permissions**. On the API permissions page, click
   **Grant admin consent for &lt;tenant&gt;** if you are a tenant
   admin; otherwise users will be prompted to consent on first sign-in.

7. Add the credentials to Vercel and GitHub:

   ```bash
   vercel env add TEAMS_CLIENT_ID     production
   vercel env add TEAMS_CLIENT_SECRET production
   vercel gh add-secret TEAMS_CLIENT_ID
   vercel gh add-secret TEAMS_CLIENT_SECRET
   ```

   For multi-tenant apps leave `MICROSOFT_TENANT_ID` unset (defaults
   to `common`). For single-tenant apps set it to your tenant GUID.

8. **Test locally**: `npm run dev`, visit
   `http://localhost:3000/integrations`, click **Connect** on the
   Microsoft Teams card. After consenting in the Microsoft popup you
   should land back on `/integrations` with the card showing
   **Connected**.

9. **Troubleshooting**:
   - `AADSTS50011: The reply URL specified... does not match` - the
     Redirect URI in Azure does not exactly match the one CallNote Pro
     sends (check scheme, host, path, and trailing slash).
   - `AADSTS65001: The user or administrator has not consented` - the
     tenant requires admin consent, or an end user is signing in
     before an admin has granted the permissions.
   - 401 from `/me` on first call - the access token has expired;
     the integrations route refreshes it automatically, but the
     initial consent must succeed first.

---

## Dev Sandbox Mode

When `NODE_ENV=development` and real OAuth credentials are missing,
CallNote Pro falls back to a dev sandbox so the `/integrations` page
remains usable end-to-end:

- The **Setup Required** badge is hidden and Connect is enabled.
- `isProviderConfigured` returns `true` for HubSpot, Salesforce, and
  Teams.
- The auth URL builders use fake client IDs and scopes; the browser
  will fail to load the upstream consent screen if you click through
  in dev, which is expected.
- The token exchange endpoint returns a stub token of the form
  `dev-<provider>-access-token:<code>` so the local Prisma write
  succeeds and the card flips to **Connected**.

The sandbox is gated on `process.env.NODE_ENV === "development"` and
returns `null` from `getDevSandboxCredentials` in any other
environment. Production behavior is unchanged - real env vars are
required, real OAuth happens, real tokens are stored.

To opt out of the sandbox (e.g. to test the "Setup Required" UI
locally), explicitly set:

```
NEXT_PUBLIC_APP_URL=https://example.com
NODE_ENV=production
```

or unset `NODE_ENV` in your shell before `npm run dev`.

---

## Verifying setup

After adding the three sets of credentials, run:

```bash
npx tsx scripts/check-env.ts
```

The output should show all `required` HubSpot / Salesforce / Teams
rows as `[OK]`. If any show `[--]`, the corresponding `.env.local`
key is missing or empty. Re-run the script after editing the file.

In production, the same check is enforced by the integrations API
itself: `isProviderConfigured` returns `false` and the UI shows the
amber **Setup Required** badge until the corresponding `*_CLIENT_ID`
and `*_CLIENT_SECRET` env vars are populated in Vercel.
