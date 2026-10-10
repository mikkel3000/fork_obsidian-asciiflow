# Repository guidance

Follow `.github/copilot-instructions.md` for the project structure and code style.

## Commits and releases

Always use the versionedcommits convention described in
[.github/VERSIONEDCOMMITS.md](.github/VERSIONEDCOMMITS.md). Write a free-form
subject and implementation explanation, with explicit release metadata in the
body for user-facing changes. Use `@minor` for compatible features, `@patch` for
fixes, and `@major` for breaking changes. Do not substitute conventional-commit
prefixes for these hints. Internal-only commits may omit release hints.

Preserve the metadata when squashing. Do not rewrite existing history unless
asked. The reusable GitHub Actions workflow manages changelog PRs and tags;
do not create competing release tags locally.

## Local workflow

Build with `npm run build`. Keep verification proportional to the task and honor
the user's preference to avoid extended testing work. If asked to install locally,
copy `main.js`, `manifest.json`, and `styles.css` into the vault's plugin directory;
preserve its `data.json`, which contains recovery drafts.
