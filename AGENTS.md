# Assistant workflow

1. Read SKILL.md and README.md. Check Node, Python and FFmpeg before installing dependencies; explain missing prerequisites.
2. Use the public repository with credential-free Git URLs; follow the mandatory sync workflow below.
3. Install local dependencies and run sample preparation and validation. Render the included sample, open the MP4, and report the output path only after all renderer checks pass.
4. Ask what website/images the user wants next; preserve the existing renderer. Review section mapping and framing. Do not replace the motion with newly invented animation or bypass fit/integrity checks.
5. Keep outputs and supplied private images local. Do not deploy, upload, or introduce paid services without the user's request.
6. Follow the mandatory sync and changelog workflow below before every use, including repeat uses.

## Sync before every use

Before EVERY use, find the existing source checkout and inspect its branch, local commits and uncommitted changes. Fetch the public repository's main branch without credentials. Review incoming commits and diffs, then fast-forward only when clean and safe. Preserve all user customizations: never reset, clean, overwrite or automatically stash. Ask how to integrate conflicts or divergent work. If updating fails, explain the problem before using stale code.

Record the last successfully integrated upstream revision in an owner-only state file outside the checkout. Announce a concise changelog since that revision using both history and actual differences before running; on first use announce the starting version, and if unchanged say no updates were found. Do not announce unintegrated changes as installed. Advance the marker only after successful integration. Refresh local-path skill installations from the updated checkout; remote installs support `npx skills update averlo-website-showcase`.

The source and skill are public. No Averlo account, campaign code, access key or GitHub credential is required to clone, install or receive updates. Public access does not grant push permissions to Averlo's repository. Follow LICENSE for source usage and third-party terms.
