# Content Creator OS

## Run locally

Install dependencies once, then use three terminals:

```bash
npm install
npm --prefix server install
npm run auth
npm run server
npm run dev
```

The web app runs on `http://localhost:5173`, the content API on port `3001`,
and the authentication API on port `3002`. The app needs both APIs running to
sign in and manage content.

## Included workflows

- Register, sign in, sign out, session restoration, and local password reset.
- Create, edit, move, search, and delete content items.
- Research notes, image uploads (when Cloudinary is configured), recording checklists,
  due-date status, and optional Google Calendar syncing.

## Optional integrations

Copy `.env.example` to `.env` and add the credentials before starting the server. Do not commit `.env`.

### Cloudinary

The research-image picker uploads the image to Cloudinary through the content server. The item then stores the returned `url` and `publicId`, rather than the image's base64 contents. Create a Cloudinary account and add its cloud name, API key, and API secret to `.env`.

### Google Calendar

Create a Google OAuth web client, enable Google Calendar API, and add `http://localhost:3002/auth/google/calendar/callback` as an authorized redirect URI. In Profile, select **Connect Calendar**, finish Google consent, then use **Sync to Calendar** on any item with a due or publish date.

Each sync creates an event the first time, then updates that same event on later syncs.
