# Fantasy preview publication

The preview lives under `gh-pages:fantasy-worlds/`. Keep the original root game, `modern-jyx/`, `western/`, and existing runtime binaries unchanged. Compare the Git blob IDs before and after publication, and retain source and Pages rollback tags. Do not rebuild or replace the runtime for a frontend-only change.

## Pages trigger diagnosed on 2026-10-22

The application compiled successfully. Updating `gh-pages` through the Git Database API and the Contents API uploaded the new files but did not start a Pages build in the observed environment. Manually requesting `POST /repos/gt88domain/jyxr/pages/builds` returned HTTP 403; its response explicitly requires `pages=write`. Repository administrator access alone does not grant that API permission to the current integration token. This is separate from game compilation and does not establish that the user's plan or repository permissions changed.

An authenticated **Git push** to the publishing branch immediately started the normal `pages build and deployment` workflow. This uses the existing publication configuration and does not require the manual Pages-build endpoint. Use the Git credential helper for each publishing command:

```sh
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin HEAD:refs/heads/feat/storybound-bulk-chapter
```

For Pages, construct a commit based on the current remote `gh-pages` head and push that explicit commit to `refs/heads/gh-pages` using the same per-command helper. Never push the source branch's tree into Pages. Use a temporary `GIT_INDEX_FILE` when constructing the Pages tree so the source checkout and index stay intact. Fetch the publishing branch with `--filter=blob:none --depth=1`, retain its full tree, and update only changed files under `fantasy-worlds/`. Verify the expected parent before pushing; do not force-push. Neither store credentials in URLs nor print tokens.

After pushing, require a successful Pages workflow for the new publishing commit. Fetch changed public files and compare them with the generated site, then exercise the real browser game. A successful upload or a successful old workflow is not proof that the new build is live. If deployment is blocked, describe the public preview as the previous version until verified.
