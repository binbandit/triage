# Triage

A desktop app for open-source maintainers to triage GitHub pull requests. Built with Electron, React, and Tailwind CSS.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated (`gh auth login`)

## Getting started

```sh
bun install
bun run dev
```

## Usage

Enter an `owner/repo` in the header input (e.g. `vercel/next.js`) and press Enter. Triage will fetch all open PRs using your local `gh` CLI.

### Views

- **List view** - grouped, searchable PR list with expandable linked issues
- **Kanban view** - drag-and-drop board with Open, Closed, and Merged columns. Drop a PR into Closed or Merged to take action, with an optional comment dialog

Toggle between views using the icons in the header toolbar.

### Search

The search bar filters PRs by title, author, `#number`, or label name.

## `.triage.yml` configuration

Add a `.triage.yml` file to the root of any repository to define label-based groups. When Triage detects this file, PRs are automatically sorted into collapsible sections based on their labels.

### Simple format

Each top-level key is a group name. Its value is an array of label strings. A PR belongs to a group when it has **all** of the listed labels. PRs are assigned to the **first matching** group. Unmatched PRs appear under "other".

```yaml
ready-to-merge:
  - approved
  - ci-passed

needs-review:
  - needs-review

blocked:
  - do-not-merge
```

### Enhanced format

Groups can be objects with additional options:

```yaml
ready-to-merge:
  description: "PRs that have passed all checks and are ready to land"
  color: "#22c55e"
  match: all # all (AND, default) | any (OR)
  sort: updated # updated (default) | created | title
  priority: 0 # lower = rendered first
  labels:
    - approved
    - ci-passed
  exclude:
    - do-not-merge
    - wip
  review:
    min_approvals: 2
    changes_requested: false
```

| Field         | Type                              | Default       | Description                                                                    |
| ------------- | --------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `labels`      | `string[]`                        | `[]`          | Label names for matching                                                       |
| `match`       | `all` \| `any`                    | `all`         | `all` = PR must have every label (AND). `any` = PR must have at least one (OR) |
| `exclude`     | `string[]`                        | `[]`          | PR must NOT have any of these labels                                           |
| `description` | `string`                          | -             | Shown in the group section header                                              |
| `color`       | `string`                          | -             | Color dot shown next to group name                                             |
| `sort`        | `updated` \| `created` \| `title` | `updated`     | Sort order within the group                                                    |
| `priority`    | `number`                          | order in file | Lower numbers render first                                                     |

### Review conditions

The `review` key lets you match PRs based on their review status:

```yaml
needs-review:
  description: "PRs waiting for initial review"
  color: "#f59e0b"
  review:
    max_approvals: 0 # has no approvals
    min_reviewers: 1 # at least one reviewer assigned

approved-but-blocked:
  description: "Approved PRs with requested changes"
  review:
    min_approvals: 1
    changes_requested: true

ready-to-ship:
  description: "Fully approved, no blockers"
  labels:
    - ci-passed
  review:
    min_approvals: 2
    changes_requested: false
    review_decision:
      - APPROVED
```

| Condition           | Type       | Description                                                                          |
| ------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `min_approvals`     | `number`   | Minimum approval count                                                               |
| `max_approvals`     | `number`   | Maximum approval count (use `0` for "no approvals")                                  |
| `changes_requested` | `boolean`  | `true` = must have changes requested, `false` = must not                             |
| `review_decision`   | `string[]` | reviewDecision must match one of: `APPROVED`, `REVIEW_REQUIRED`, `CHANGES_REQUESTED` |
| `min_reviewers`     | `number`   | Minimum pending review requests                                                      |
| `max_reviewers`     | `number`   | Maximum pending review requests (use `0` for "no reviewers assigned")                |

All review conditions use AND logic - every specified condition must be met.

### No config

When no `.triage.yml` is found, PRs are displayed as a flat list (or flat kanban columns) without grouping.

## Local config override

You can define a local config file at `~/.config/triage/triage.yaml` that **overrides** the repo's `.triage.yml`. This lets you experiment with different groupings without committing changes to the repo.

The local config uses the same format, but wrapped under `owner/repo` keys so you can configure multiple repositories in one file:

```yaml
vercel/next.js:
  ready-to-merge:
    description: "My custom ready group"
    labels:
      - approved
      - ci-passed
    review:
      min_approvals: 2

  needs-review:
    match: any
    labels:
      - needs-review
      - review-requested

facebook/react:
  urgent:
    - priority:critical
    - bug
```

### Priority

1. **Local config** (`~/.config/triage/triage.yaml`) is checked first
2. **Repo config** (`.triage.yml` in the repository root) is used as fallback
3. If neither exists, PRs are displayed as a flat list

The Settings panel shows which config is active (blue dot for local, green dot for repo) along with the group count. Use the "Open config folder" button to quickly navigate to the config directory.

### Tips

- Use the local config to trial groupings before proposing changes to the repo
- Override the repo config when you want a personal view that differs from the team's
- Both simple and enhanced formats work inside local config — the value under each `owner/repo` key uses the exact same schema as `.triage.yml`

## Settings

Open the gear icon in the header to configure:

- **Appearance** - toggle between dark and light themes
- **Inline PR view** - view PR/issue details, diffs, and conversations without leaving the app (off by default)
- **Account** - switch between authenticated `gh` CLI accounts

Settings and the last-viewed repository are persisted in localStorage.

## Tech stack

| Layer           | Technology                    |
| --------------- | ----------------------------- |
| Framework       | Electron 41 + electron-vite 5 |
| Frontend        | React 19, TypeScript, Vite 8  |
| Styling         | Tailwind CSS 4                |
| Icons           | Lucide React                  |
| Data            | GitHub CLI (`gh`) via IPC     |
| Linting         | oxlint                        |
| Formatting      | oxfmt                         |
| Package manager | Bun                           |

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `bun run dev`       | Start dev server with hot reload |
| `bun run build`     | Production build to `out/`       |
| `bun run lint`      | Run oxlint                       |
| `bun run lint:fix`  | Run oxlint with auto-fix         |
| `bun run fmt`       | Format with oxfmt                |
| `bun run fmt:check` | Check formatting                 |

## License

MIT
