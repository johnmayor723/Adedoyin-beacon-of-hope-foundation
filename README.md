# Adedoyin Beacon of Hope Foundation – dynamic website + dashboard

Express + EJS + MongoDB. All site content (logo, navbar/footer links, hero, about, programs, gallery, contact details, colours…) lives in the database and is edited from **/admin**.

## Run locally
1. Install and start MongoDB (default `mongodb://127.0.0.1:27017`).
2. `cp .env.example .env` and set `SESSION_SECRET` (and optionally `ADMIN_EMAIL` / `ADMIN_PASSWORD`, `MAIL_USER` / `MAIL_PASS`).
3. `npm install`
4. `npm start` → http://localhost:3000 — dashboard at http://localhost:3000/admin

On first start the database is **seeded with the original site content** and a first admin is created
(the password is printed once in the console unless `ADMIN_PASSWORD` is set).

- `npm run seed` – fill in any missing content (never overwrites edits)
- `npm run seed:reset` – wipe site content (not users) and restore the original content

## Roles
- **Admin** – everything, incl. site settings (logo, nav, footer, colours), subscribers and users.
- **Editor** – pages, programs, gallery and messages.

## Notes
- Uploaded images are stored in `uploads/` (set `UPLOAD_DIR` to change; back this folder up / mount a volume in production).
- Production: set `NODE_ENV=production`, `SESSION_SECRET`, `SECURE_COOKIES=1`, `TRUST_PROXY=1` behind HTTPS.
- Contact-form messages are always saved in the dashboard; email delivery needs `MAIL_USER`/`MAIL_PASS`.
