# BuildBoard+ API Documentation

Base URL: `/api`

All protected routes require:

```http
Authorization: Bearer <access-token>
```

## Auth

- `POST /auth/register` - create account
- `POST /auth/login` - issue access and refresh tokens
- `POST /auth/refresh` - rotate access and refresh token
- `GET /auth/me` - current user
- `POST /auth/logout` - revoke refresh token
- `PUT /auth/change-password` - change password
- `POST /auth/forgot-password` - request reset token
- `POST /auth/reset-password` - reset password
- `POST /auth/verify-email` - verify email token
- `PUT /auth/2fa` - enable or disable 2FA-ready fields

## Platform

- `GET /platform/dashboard` - GitHub-style home widgets
- `GET /platform/search?q=&type=` - global search for users, repositories, issues, PRs, discussions, organizations, files, commits
- `GET /platform/organizations` - list organizations
- `POST /platform/organizations` - create organization
- `GET /platform/organizations/:org` - organization dashboard
- `POST /platform/organizations/:org/teams` - create team

## Repositories

- `GET /repos/my` - current user's repositories
- `GET /repos/explore` - public repository explorer
- `GET /repos/starred/:username` - starred repositories
- `POST /repos` - create repository
- `GET /repos/:owner/:repo` - repository home payload
- `PUT /repos/:owner/:repo` - repository settings
- `DELETE /repos/:owner/:repo` - delete repository
- `POST /repos/:owner/:repo/star` - star or unstar
- `POST /repos/:owner/:repo/watch` - watch or unwatch
- `POST /repos/:owner/:repo/fork` - fork repository
- `POST /repos/:owner/:repo/pin` - pin or unpin
- `POST /repos/:owner/:repo/archive` - archive or unarchive
- `POST /repos/:owner/:repo/collaborators` - add collaborator

## Files

- `GET /repos/:owner/:repo/files?branch=&path=` - browse tree
- `GET /repos/:owner/:repo/file?branch=&path=` - get file
- `GET /repos/:owner/:repo/file/download?path=` - download file
- `PUT /repos/:owner/:repo/file` - create or update file and commit
- `DELETE /repos/:owner/:repo/file` - delete file and commit
- `POST /repos/:owner/:repo/file/move` - move or rename file and commit

## Version Control

- `GET /repos/:owner/:repo/branches`
- `POST /repos/:owner/:repo/branches`
- `DELETE /repos/:owner/:repo/branches/:branchName`
- `PUT /repos/:owner/:repo/branches/:branchName/protection`
- `GET /repos/:owner/:repo/commits`
- `GET /repos/:owner/:repo/commits/:sha`
- `POST /repos/:owner/:repo/commits/:sha/revert`
- `GET /repos/:owner/:repo/compare?base=&head=`
- `GET /repos/:owner/:repo/tags`
- `POST /repos/:owner/:repo/tags`
- `DELETE /repos/:owner/:repo/tags/:tagName`

## Issues

- `GET /issues/:owner/:repo?status=all`
- `GET /issues/:owner/:repo/board`
- `GET /issues/:owner/:repo/labels`
- `POST /issues/:owner/:repo/labels`
- `GET /issues/:owner/:repo/milestones`
- `POST /issues/:owner/:repo/milestones`
- `GET /issues/:owner/:repo/:number`
- `POST /issues/:owner/:repo`
- `PUT /issues/:owner/:repo/:number`
- `POST /issues/:owner/:repo/:number/comments`

## Pull Requests

- `GET /pullrequests/:owner/:repo?status=all`
- `GET /pullrequests/:owner/:repo/:number`
- `POST /pullrequests/:owner/:repo`
- `POST /pullrequests/:owner/:repo/:number/review`
- `POST /pullrequests/:owner/:repo/:number/merge`
- `POST /pullrequests/:owner/:repo/:number/close`
- `POST /pullrequests/:owner/:repo/:number/comments`

## Actions, Wiki, Discussions, Releases

- `GET /repos/:owner/:repo/workflows`
- `POST /repos/:owner/:repo/workflows`
- `GET /repos/:owner/:repo/workflow-runs`
- `POST /repos/:owner/:repo/workflows/:workflowId/runs`
- `GET /repos/:owner/:repo/wiki`
- `PUT /repos/:owner/:repo/wiki/:slug`
- `GET /repos/:owner/:repo/wiki/:slug/history`
- `GET /repos/:owner/:repo/discussions`
- `POST /repos/:owner/:repo/discussions`
- `GET /repos/:owner/:repo/discussions/:discussionId`
- `POST /repos/:owner/:repo/discussions/:discussionId/replies`
- `POST /repos/:owner/:repo/discussions/:discussionId/upvote`
- `GET /repos/:owner/:repo/releases`
- `POST /repos/:owner/:repo/releases`

## Security, Analytics, AI

- `GET /repos/:owner/:repo/security`
- `GET /repos/:owner/:repo/insights`
- `GET /analytics/dashboard`
- `GET /analytics/admin`
- `GET /analytics/repo/:owner/:repo`
- `GET /ai/:owner/:repo/assistant`

