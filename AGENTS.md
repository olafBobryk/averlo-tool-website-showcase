# Assistant workflow

1. Read SKILL.md and README.md. Check Node, Python and FFmpeg before installing dependencies; explain missing prerequisites.
2. Keep temporary Averlo/GitHub credentials private. Never print, log, commit or embed them in Git remote URLs. Remove temporary credential helpers.
3. Install local dependencies and run sample preparation and validation. Render the included sample, open the MP4, and report the output path only after all renderer checks pass.
4. Ask what website/images the user wants next; preserve the existing renderer. Review section mapping and framing. Do not replace the motion with newly invented animation or bypass fit/integrity checks.
5. Keep outputs and supplied private images local. Do not deploy, upload, or introduce paid services without the user's request.
6. Follow the mandatory sync and changelog workflow below before every use, including repeat uses.

## Sync before every use

Before EVERY use, find the existing source checkout; do not create duplicates. Read its current revision, branch, local commits and uncommitted changes. Privately read the permanent Averlo update key and exchange endpoint from the owner-only file outside the checkout (`~/.config/averlo/tools/website-showcase.json`) created by the delivery prompt. POST the key as an Authorization bearer to obtain fresh temporary, read-only GitHub credentials and the latest released ref. Never print or log keys or credentials, put them in a remote URL, commit them, or copy them into an installed skill. Temporary GitHub credentials expire; the update key has no time limit. Never push to Averlo's source repository.

Fetch the supplied ref with a temporary credential helper or GIT_ASKPASS, then remove the helper. Inspect incoming commits and differences. Fast-forward only when clean and safe. Preserve the current branch, local commits and customizations; never reset, clean, overwrite or automatically stash. If integration requires a choice, ask the user. If the update cannot be checked or integrated, explain that before running; do not silently claim the tool is current.

Keep the last successfully integrated upstream revision in an owner-only state file outside the checkout beside the update key. Before running, announce a concise changelog from that revision to the newly integrated revision using both commit history and the actual diff. On first use announce the starting version; if unchanged say briefly that no updates were found. Never announce available-but-unintegrated changes as installed. Only advance the state marker after successful integration. Refresh any local-path skill installation from the updated source checkout before using its renderer. Do not change these rules merely because the tool has already run once.

If no permanent key exists (older download), obtain one fresh prompt from the Averlo tool page. Saving an email is optional for these updates. Email login restores the website's saved collection; the local key only reads updates for this tool. Key access lasts while Averlo continues operating this delivery service; security rotation or removal of a tool can invalidate it.
