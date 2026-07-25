# R2 Bucket Setup Guide

## Step 1 — Create the Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2**
2. Click **Create bucket**
3. Name: `gauge-audio-uploads` (or whatever you prefer)
4. Location: **Automatic** (default)
5. Click **Create bucket**

## Step 2 — Enable Public Access

1. Inside your bucket, go to **Settings**
2. Scroll to **Public access**
3. Click **Connect to a custom domain** (free) or **Allow access via R2.dev** (free, but gives a random URL)
4. If using custom domain, enter e.g. `audio.gauge.so` (must be a domain on Cloudflare)
5. If using R2.dev, it gives a URL like `https://pub-xxxxx.r2.dev`

> **Note:** Custom domain requires the domain to be on Cloudflare DNS.
> For now, R2.dev URL is fine — you can change later.

Save the public URL — you'll need it as `R2_PUBLIC_URL`.

## Step 3 — Set CORS Policy

In your bucket → **Settings** → **CORS Policy** → paste this:

```json
[
  {
    "AllowedOrigins": ["https://usegauge.vercel.app"],
    "AllowedMethods": ["PUT", "GET", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

If you test locally, also add `"http://localhost:3000"` to AllowedOrigins.

## Step 4 — Generate API Tokens

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Permission: **Admin Read & Write** (gives read, write, delete)
4. Scope: **Apply to specific bucket only** → select your bucket
5. _(optional)_ TTL: leave blank for no expiration
6. Click **Create**

Copy these **immediately** and save them somewhere safe (shown only once):

- `R2_ACCESS_KEY_ID` (looks like a long alphanumeric string)
- `R2_SECRET_ACCESS_KEY` (starts with a random string)

## Step 5 — Get Your Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. The **Account ID** appears on the right sidebar under the domain list
3. It looks like a 32-character hex string: `a1b2c3d4e5f6...`
4. Save this as `R2_ACCOUNT_ID`

## Step 6 — Add Env Vars to Vercel

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables** → add:

| Variable | Value |
|----------|-------|
| `R2_ACCOUNT_ID` | `a1b2c3d4...` (your 32-char hex account ID) |
| `R2_ACCESS_KEY_ID` | `abc123...` (from Step 4) |
| `R2_SECRET_ACCESS_KEY` | `xyz789...` (from Step 4) |
| `R2_BUCKET_NAME` | `gauge-audio-uploads` |
| `R2_PUBLIC_URL` | `https://pub-xxxxx.r2.dev` or your custom domain |

Select **Production** + all preview environments so it works everywhere.

## Step 7 (Optional) — Lifecycle Policy

In your bucket → **Settings** → **Lifecycle Rules** → **Add Rule**:

- Rule name: `cleanup-old-files`
- Prefix: leave empty (applies to all)
- **Delete objects** after: `90` days
- Click **Add**

This is a safety net — even if our cleanup code fails, files won't pile up forever.

---

## Verification

Once env vars are set, deploy the app. The `/api/upload-url` endpoint will automatically use R2.

You'll know it works when:
1. You can upload a file >4MB (try a 10MB MP3)
2. The file goes through and produces a transcript
3. Paid users can replay the recording from the call detail page

## Cost

R2 free tier: 10 GB storage, 1M writes, 10M reads/month.

For 500 paying users storing 15 calls at 30MB each = 225 GB = ~$3.38/month.
