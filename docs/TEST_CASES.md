# Test Cases

## Authentication

| ID | Scenario | Expected Result |
| --- | --- | --- |
| AUTH-01 | Register with valid username, email, password | User is created and tokens are returned |
| AUTH-02 | Login with valid credentials | Access token, refresh token, and user profile are returned |
| AUTH-03 | Access protected route without token | API returns `401` |
| AUTH-04 | Refresh token rotation | New access and refresh tokens are returned |
| AUTH-05 | Password reset token flow | Password changes and old refresh token is revoked |

## Repository

| ID | Scenario | Expected Result |
| --- | --- | --- |
| REPO-01 | Create public repository | Repository, main branch, README, and default labels are created |
| REPO-02 | Star repository | Star count increments and notification is created |
| REPO-03 | Fork repository | New repository references source repository |
| REPO-04 | Archive repository | `isArchived` changes and activity log records event |
| REPO-05 | Pin repository | Repository appears in user pinned list |

## Files and Commits

| ID | Scenario | Expected Result |
| --- | --- | --- |
| FILE-01 | Create nested file `src/app.js` | Directory records, file, and commit are created |
| FILE-02 | Update existing file | File content changes and modified commit is created |
| FILE-03 | Move file | File path changes and move activity is recorded |
| FILE-04 | Delete file | File is removed and delete commit is created |
| FILE-05 | Browse folder | API returns immediate children and breadcrumbs |

## Issues and Pull Requests

| ID | Scenario | Expected Result |
| --- | --- | --- |
| ISSUE-01 | Create issue with labels and assignees | Issue number is generated and assignees are notified |
| ISSUE-02 | Move issue to review | Status changes to `review` |
| ISSUE-03 | Board view | Issues are grouped by open, in progress, review, testing, closed |
| PR-01 | Create draft pull request | PR is open with `isDraft=true` |
| PR-02 | Approve pull request | Review decision changes to approved |
| PR-03 | Request changes with inline comments | Review document stores inline comments |
| PR-04 | Merge with squash strategy | PR status is merged and strategy is stored |

## Collaboration

| ID | Scenario | Expected Result |
| --- | --- | --- |
| ORG-01 | Create organization | Owner is added as organization owner/member |
| TEAM-01 | Create team | Team is linked to organization |
| DISC-01 | Create discussion | Discussion appears under repository discussions |
| WIKI-01 | Save wiki page | Wiki page and wiki history are created |
| ACTION-01 | Create workflow | Workflow YAML is saved |
| ACTION-02 | Run workflow | Workflow run logs and conclusion are created |

## Security and Analytics

| ID | Scenario | Expected Result |
| --- | --- | --- |
| SEC-01 | View security dashboard | Alert counts and recommendations are returned |
| SEC-02 | Enable 2FA | Secret and recovery codes are generated in development |
| ANALYTICS-01 | Dashboard analytics | Home widgets return recent repos, issues, PRs, activity, notifications |
| ANALYTICS-02 | Repository insights | Health score, contributors, activity, issue and PR stats are returned |
| AI-01 | AI assistant | Commit summary, release notes, review suggestions, bug prediction, and documentation starter are returned |

