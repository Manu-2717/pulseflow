# PulseFlow

PulseFlow is a self-hosted team task board with live capacity, smart dispatch, and focused blocker threads. The interface uses a light dotted canvas, paper navigation, mint highlights, cut-paper type, and gentle motion. The graphics and product UI are original.

## What works

- Email/password accounts, optional Google OAuth, and SMTP-backed verification and password recovery.
- Multiple workspaces, member invitations, role-based task actions, and workspace-scoped data.
- Tasks with priorities, estimates, assignees, live workload cards, optimistic status updates, and smart dispatch.
- Per-task blocker threads, comments with code snippets, accepted solutions, and AI briefs. Briefs use OpenAI when configured and a local deterministic analyzer otherwise.
- Responsive public landing, signup, onboarding, and workspace dashboard.

## Run locally

Requires Node.js 22+ and PostgreSQL 16+.

1. `cp .env.example .env` and set `DATABASE_URL`, `BETTER_AUTH_URL=http://localhost:3000`, and a random `BETTER_AUTH_SECRET` of at least 32 characters.
2. `npm ci`
3. `npx prisma migrate deploy`
4. `npm run dev`
5. Open `http://localhost:3000`, create an account, create a workspace, and invite another member.

For production, use `npm run build` followed by `npm run start`. Run `npx prisma migrate deploy` before each new release. The database starts empty; each team creates its own workspace and tasks.

## Portable Docker deployment

The included `Dockerfile` and `docker-compose.yml` run Next.js and PostgreSQL together. Copy `.env.example` to `.env` and set `POSTGRES_PASSWORD`, `BETTER_AUTH_URL` to your public HTTPS origin, and `BETTER_AUTH_SECRET`. Set the SMTP variables below before inviting real people. Then run `docker compose up --build -d`. The web container applies migrations on startup. Put an HTTPS reverse proxy in front of port 3000 and back up the named PostgreSQL volume. `/api/health` checks database connectivity.

Use a URL-safe `POSTGRES_PASSWORD` if you use the Compose file as written, since it is interpolated into a database URL. Do not commit `.env`.

## Account setup

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` for email verification and password reset. When SMTP is configured, new email/password accounts must verify their address before signing in. Without SMTP, local testing can use email/password accounts, but password recovery and email ownership verification are unavailable. Configure SMTP for public rollout.

To enable Google login, create OAuth credentials in Google Cloud, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and authorize `https://YOUR_DOMAIN/api/auth/callback/google`. The Google button appears only when both variables are present. Set `OPENAI_API_KEY` only if you want model-generated blocker briefs.

## Security and operations

Sessions and password hashes are managed by Better Auth. Server actions check current membership and leader permissions before reading or changing workspace records; invite tokens are stored as hashes and expire after seven days or ten uses. Deploy behind HTTPS, keep all secrets in your hosting secret manager, configure backups, and monitor the health endpoint. The included Docker Compose setup is a portable starting point; choose your host, domain, SMTP provider, and Google credentials before making the service public.
