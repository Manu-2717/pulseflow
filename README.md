<div align="center">

<img src="docs/images/pulseflow-banner.svg" alt="PulseFlow Banner" width="100%" />

<br/><br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

<p align="center">
  <b>Less stuck. More flow.</b><br/>
  The self-hosted team task board that monitors live workload, dispatches work with context, and gives every blocker its own space to get solved.
</p>

[Quickstart](#-quickstart) • [Visual Tour](#-visual-tour) • [Architecture](#-architecture--workflow) • [Planning Suite](#-planning-suite) • [Docker Deployment](#-portable-docker-deployment) • [Operations](#-security--operations)

</div>

---

## 🌟 Overview

**PulseFlow** is a modern, self-hosted team workspace engineered to eliminate coordination friction. Traditional project management tools often turn into passive issue graveyards where blockers get lost in endless comment threads and task allocation ignores individual bandwidth. 

PulseFlow solves this by treating work as a dynamic flow:
- **Live Team Capacity Radar**: Instantly displays teammate availability (*Free*, *Active*, *Overloaded*, *Blocked*) before work is dispatched.
- **Context-Aware Smart Dispatch**: Matches queued tasks with team member specialties and real-time workload.
- **Dedicated Blocker Spaces**: Isolates problems into actionable sub-threads with AI-assisted root cause analysis, code snippets, and pinned solutions.
- **Full Planning Suite**: Built-in Gantt timelines, sprints, custom fields, task templates, measurable team goals, and timesheets.
- **Tactile Original Interface**: Designed with a light dotted canvas, paper-inspired navigation, mint highlights, and snappy optimistic state updates.

---

## 🔄 Architecture & Workflow

PulseFlow integrates every phase of task execution—from dispatch and active development to blocker resolution and long-term planning—into a cohesive pipeline:

<div align="center">
  <img src="docs/images/pulseflow-workflow.svg" alt="PulseFlow Workflow Lifecycle" width="100%" />
</div>

1. **Live Capacity**: Tracks bandwidth and points across teammates in real time.
2. **Smart Dispatch**: Routes queued backlog items to available members matching task requirements.
3. **Fast Execution**: Optimistic Kanban transitions, task drawer checklists, and explicit review gates.
4. **Blocker Spaces**: Isolates impediments into dedicated threads with automated AI root-cause summaries and pinned code fixes.
5. **Planning Suite**: Connects daily tasks into high-level Gantt schedules, sprint cycles, and measurable goals.

---

## 📸 Visual Tour

### 1. Tactile Public Landing & Team Desk
Original paper typography, dotted canvas layout, and live interactive capacity previews.

![PulseFlow Landing Page](docs/images/01-landing-hero.png)

---

### 2. Workspace Command Center & Capacity Radar
A live birds-eye view of team progress. Filter by assignee, status, or search via keyboard shortcuts (`⌘K` or `/`).

![PulseFlow Workspace Dashboard](docs/images/02-workspace-dashboard.png)

#### Live Capacity Radar
Know who has room before delegating tasks. Avoid overloading teammates and quickly spot who is blocked.

![PulseFlow Capacity Radar](docs/images/02b-capacity-radar.png)

---

### 3. Dedicated Blocker Spaces & AI Root Cause Briefs
Blockers get their own isolated conversation rather than polluting the main task description. Generate structured AI briefs (TL;DR, Root Cause, Unblock Action Plan) and pin accepted code solutions.

![PulseFlow Blocker Brief Drawer](docs/images/03-blocker-brief.png)

> [!TIP]
> PulseFlow includes an automated local deterministic analyzer fallback. If external AI credentials are not configured or rate limits are reached, structured briefs continue working offline without interruption.

---

### 4. Interactive Gantt Schedule & Project Timelines
Visualize dates and task durations across multiple projects on a clean timeline.

![PulseFlow Planning Gantt Schedule](docs/images/04-planning-gantt.png)

---

### 5. Sprints, Team Goals & Workspace Toolkit
Plan work cycles, track completion rates, and set measurable targets for the team.

<div align="center">
  <img src="docs/images/05-planning-sprints.png" alt="Sprints View" width="49%" />
  <img src="docs/images/06-planning-goals.png" alt="Goals View" width="49%" />
</div>

---

## 🚀 Quickstart

### Prerequisites
- **Node.js** 22.0+
- **PostgreSQL** 16+ (or cloud PostgreSQL such as [Neon](https://neon.tech))
- **npm** 10+

### 1. Clone & Configure
```bash
git clone https://github.com/kaushikharsh99/pulseflow.git
cd pulseflow
cp .env.example .env
```

Edit `.env` with your PostgreSQL database URL and session secret:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pulseflow?schema=public"
BETTER_AUTH_URL="http://localhost:3000"
SITE_URL="http://localhost:3000"
BETTER_AUTH_SECRET="generate-a-secure-secret-of-at-least-32-characters"
```

### 2. Install Dependencies & Migrate
```bash
npm install
npx prisma migrate deploy
```

### 3. (Optional) Seed Demo Workspace
To immediately explore PulseFlow with sample teammates, tasks, blocker threads, Gantt data, and sprints:
```bash
node scripts/seed-demo.mjs
```
*Creates user `alex@pulseflow.dev` (Password: `Password12345!`) with a ready-to-use workspace `pulseflow-eng`.*

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗂 Planning Suite (`/w/[slug]/plan`)

The Planning Suite provides project leaders and workspace members with deep tooling:

| View | Purpose |
| :--- | :--- |
| **List & Board** | Filter tasks by project, sprint, priority, and completion status. |
| **Gantt Schedule** | Draggable bars showing start-to-due dates with duration calculations. |
| **Timeline** | Sequential milestone overview sorted chronologically. |
| **Calendar** | Upcoming deadlines with one-click **Add to Google Calendar** (RFC 5545). |
| **Weekly Timesheets** | Aggregated time entries per teammate and task. |
| **Sprints** | Iteration management with automatic progress meters and burndown visibility. |
| **Custom Fields** | Define `TEXT`, `NUMBER`, `DATE`, or `SELECT` dropdown fields per workspace. |
| **Task Templates** | Pre-configure reusable tasks with default estimates and priority. |
| **Workspace Docs** | Shared documentation, RFCs, and decision records close to the work. |
| **Team Goals** | Track high-level measurable milestones with live progress indicators. |
| **Auto-Pull Automation** | Automatically assigns the highest-priority queued task when a member finishes work. |

---

## 🐳 Portable Docker Deployment

PulseFlow includes a production-ready `Dockerfile` and `docker-compose.yml` configured with an isolated PostgreSQL database and automated migration container:

```bash
# 1. Prepare environment
cp .env.example .env

# 2. Build and start containers
docker compose up --build -d
```

- **Health Check**: Endpoint `/api/health` validates live database connectivity.
- **Security**: The web application runs in an unprivileged container behind loopback for reverse proxying via Caddy, Traefik, or Nginx.
- **Database Volumes**: Data is persisted in a named Docker volume (`postgres_data`).

---

## ⚙️ Configuration Reference

| Environment Variable | Description | Default / Required |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | **Required** |
| `BETTER_AUTH_SECRET` | Cryptographic secret for signing sessions (min 32 chars) | **Required** |
| `BETTER_AUTH_URL` | Public origin URL for Better Auth | `http://localhost:3000` |
| `SITE_URL` | Canonical origin used for metadata and sitemaps | `http://localhost:3000` |
| `OPENAI_API_KEY` | Optional API key for LLM-powered blocker briefs | Optional (fallback included) |
| `SMTP_HOST` / `SMTP_PORT` | SMTP host and port for email verification and password reset | Optional in dev / Required in prod |
| `SMTP_USER` / `SMTP_PASSWORD` | SMTP authentication credentials | Optional |
| `SMTP_FROM` | Outgoing email sender string | `PulseFlow <hello@example.com>` |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Google OAuth credentials (`/api/auth/callback/google`) | Optional |
| `GITHUB_CLIENT_ID` / `_SECRET` | GitHub OAuth credentials (`/api/auth/callback/github`) | Optional |
| `APPLE_CLIENT_ID` / `_TEAM_ID` | Apple Sign-In credentials and `.p8` private key | Optional |
| `OIDC_ENABLED` / `OIDC_ISSUER` | Generic OpenID Connect provider (e.g. USAR FOSS Club) | Optional |

---

## 🔒 Security & Operations

- **Session Management**: Handled securely via [Better Auth](https://www.better-auth.com/) with HTTP-only cookies and cryptographic hashing.
- **Role-Based Permissions**: Strict authorization checks enforce workspace (`LEADER`, `MEMBER`) and project permissions (`ADMIN`, `MEMBER`, `MENTOR`).
- **Encrypted Backups**: Built-in script `scripts/backup-database.mjs` supports `age` asymmetric encryption for zero-knowledge disaster recovery.
- **AI Quotas & Boundaries**: Blocker brief generation is protected by sliding-window rate limits (10 req/member/hr, 1 gen/thread/min, 12s timeout) to prevent API exhaustion.

For operational procedures and runbooks:
- 📖 [Operations & Disaster Recovery Runbook](docs/operations.md)
- 🛡 [Project Access & Authorization Model](docs/project-access-plan.md)
- 🔑 [OIDC & Single Sign-On Guide](docs/oidc-login.md)
- ✅ [Task Review & Approval Workflow](docs/task-review.md)

---

## 🤝 Contributing

Contributions, feedback, and ideas are warmly welcomed!

1. Fork this repository: [kaushikharsh99/pulseflow](https://github.com/kaushikharsh99/pulseflow)
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -m "feat: add capability"`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Open a Pull Request on GitHub.

---

<div align="center">

**PulseFlow** • Built for the work between the work.

✳ *Small steps, clearer days.*

</div>
