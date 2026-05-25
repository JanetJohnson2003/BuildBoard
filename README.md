# BuildBoard+

BuildBoard+ is a GitHub-style software development and collaboration platform built with React, Vite, Express, MongoDB, Mongoose, JWT auth, and Socket.io.

It now includes a production-oriented foundation for repositories, file browsing, internal Git-like branches and commits, issues, pull requests, discussions, wiki pages, releases, actions/workflows, organizations, analytics, notifications, security dashboards, admin operations, global search, and AI-assisted repository insights.

## Applications

- Frontend: `buildboard-frontend`
- Backend API: `buildboard-backend`
- Database: MongoDB or MongoDB Atlas
- Storage-ready path: local `uploads`, with Cloudinary-compatible model fields
- Deployment targets: Vercel frontend, Render backend

## Core Features

- Repository system: public, private, internal, templates, imports, forks, stars, watches, archive, pinning, topics, README, insights
- File system: nested folders, breadcrumbs, file search-ready schema, create/update/delete/move/download, previews, line-numbered code viewer
- Version control: branches, protected branches, commits, compare, revert, tags, releases, release assets
- Pull requests: draft PRs, reviews, approvals, changes requested, inline review model, merge strategy support
- Issues: labels, milestones, assignees, priority, due dates, linked PRs/commits, board states
- Actions: workflow YAML model, workflow runs, logs, run history
- Discussions: categories, replies, upvotes, reactions-ready schema
- Wiki: markdown pages, history model, permissions-ready endpoints
- Organizations: orgs, teams, roles, repository permissions, feature flags
- Security: JWT, refresh tokens, password reset, email verification, 2FA-ready account fields, security alerts, audit logs, device/login history
- Analytics: user dashboard, repository insights, admin analytics, contribution graph
- AI: commit summaries, release notes, review suggestions, bug risk, sprint analysis, health score, documentation starter

## Local Development

Backend:

```bash
cd buildboard-backend
npm install
npm run dev
```

Frontend:

```bash
cd buildboard-frontend
npm install
npm run dev
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

## Environment

Backend `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devhubpro
JWT_SECRET=replace-with-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Documentation

- [API documentation](docs/API.md)
- [Architecture and diagrams](docs/ARCHITECTURE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Test cases](docs/TEST_CASES.md)

