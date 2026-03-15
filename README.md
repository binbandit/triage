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

### Format

Each top-level key is a group name. Its value is an array of label strings. A PR belongs to a group when it has **all** of the listed labels. PRs are assigned to the **first matching** group. Unmatched PRs appear under "other".

```yaml
ready-to-merge:
  - approved
  - ci-passed
  - has:approval

needs-review:
  - needs-review
  - size:S

blocked:
  - do-not-merge
```

### Example

Given a PR with labels `approved`, `ci-passed`, and `has:approval`, it would appear under the **ready-to-merge** group. A PR with only `needs-review` would not match that group (missing `size:S`) and would fall to **other**.

### No config

When no `.triage.yml` is found, PRs are displayed as a flat list (or flat kanban columns) without grouping.

## Settings

Open the gear icon in the header to configure:

- **Appearance** - toggle between dark and light themes

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
