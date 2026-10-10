# versionedcommits

This repository uses [mikkel3000/versionedcommits](https://github.com/mikkel3000/versionedcommits).

Write a free-form subject and a body for maintainers. Release metadata starts on
its own line at column one:

```text
Keep connector endpoints in smart selections

Include shared attachment cells and restore their box borders when moving a connector.

@patch Fixed selection of attached connectors
Smart selection includes the complete connector and preserves its attached boxes.
@patch
```

Use `@minor` for compatible features, `@patch` for fixes, and `@major` for breaking
changes. Internal changes without release impact may omit a hint. Close detailed
release-note blocks with the same bare hint. Start release-note titles with
Added, Changed, Deprecated, Removed, Fixed, or Security. Preserve these blocks
when squashing; a conventional-commit subject does not request a version bump.

## GitHub Actions

`.github/workflows/versionedcommits.yml` calls the upstream reusable workflow,
pinned to `eb9ac58a58fb9ef7ed92802cbdcc244106e3e8b0` (the same implementation used
by the sibling fork_bigpowers repository). It runs on main pushes, closed PRs
against main, and manual dispatch. No separate secret is required.

In GitHub **Settings → Actions → General**, enable **Allow GitHub Actions to
create and approve pull requests**. The workflow uses `GITHUB_TOKEN` with
contents, pull-requests, and statuses write permissions.

Hinted commits create/update a changelog PR on `versionedcommits/release`.
Merging that PR creates the release tag. This workflow does not build plugin
assets, publish a GitHub Release, or update `package.json`, `manifest.json`,
`package-lock.json`, or `versions.json`. Coordinate those version files separately
when publishing an Obsidian plugin release. Tag calculation uses existing stable
SemVer tags, not the version in the manifest.
