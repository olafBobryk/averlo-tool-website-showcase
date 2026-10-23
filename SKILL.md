---
name: averlo-website-showcase
description: Render a website page or supplied screenshots as a local 2D animated showcase video using Averlo's preserved renderer. Use for Website Showcase requests, rather than inventing new motion or hosting a rendering service.
---

# Website Showcase

Use the renderer bundled beside this file. Resolve all script and sample paths from this skill's directory, not the user's current directory. Read [README.md](README.md) for prerequisites, input mapping, rendering commands, and output checks; follow [AGENTS.md](AGENTS.md) for credential and update handling.

## First result

Check Node.js 22+, Python 3.12+, and FFmpeg before installing dependencies. Explain missing prerequisites. Install the pinned Node dependencies and isolated Python dependencies as described in the README. Prepare, validate, and render the included sample before offering customization. Open the resulting MP4, and report its absolute path only after source, frame, and fit checks pass. Keep generated frames, supplied images, and outputs local.

## Make it theirs

Use the user's page or screenshots in a separate working directory. Start with `sample/request.json`; preserve the supplied pixels and record real dimensions and SHA-256 hashes. Map coherent vertical page sections into the existing shots. Review framing and section selection; paired sections need different pixels, and opening strips need distinct upper and lower passages. If validation fails, fix the mapping or choose shorter sections rather than bypassing the checks. Preserve the renderer's motion unless the user explicitly requests changes.

Do not fabricate missing page content or retrieve private assets without permission. Rendering does not require an Averlo server. Do not upload, deploy, or add paid services unless requested. The tool permits use and customization, including commercial outputs, but not redistribution or resale of its source or modified versions; see [LICENSE](LICENSE). Third-party terms still apply.

## Install and update

This skill includes its renderer. With access to the private repository, install using `npx skills add olafBobryk/averlo-tool-website-showcase --skill averlo-website-showcase`. A recipient who already obtained a checkout through the catalog can instead run `npx skills add /absolute/path/to/that-checkout --skill averlo-website-showcase` without exposing credentials.

## Sync before every use

Before EVERY use, find the existing source checkout; do not create duplicates. Read its current revision, branch, local commits and uncommitted changes. Privately read the permanent Averlo update key and exchange endpoint from the owner-only file outside the checkout (`~/.config/averlo/tools/website-showcase.json`) created by the delivery prompt. POST the key as an Authorization bearer to obtain fresh temporary, read-only GitHub credentials and the latest released ref. Never print or log keys or credentials, put them in a remote URL, commit them, or copy them into an installed skill. Temporary GitHub credentials expire; the update key has no time limit. Never push to Averlo's source repository.

Fetch the supplied ref with a temporary credential helper or GIT_ASKPASS, then remove the helper. Inspect incoming commits and differences. Fast-forward only when clean and safe. Preserve the current branch, local commits and customizations; never reset, clean, overwrite or automatically stash. If integration requires a choice, ask the user. If the update cannot be checked or integrated, explain that before running; do not silently claim the tool is current.

Keep the last successfully integrated upstream revision in an owner-only state file outside the checkout beside the update key. Before running, announce a concise changelog from that revision to the newly integrated revision using both commit history and the actual diff. On first use announce the starting version; if unchanged say briefly that no updates were found. Never announce available-but-unintegrated changes as installed. Only advance the state marker after successful integration. Refresh any local-path skill installation from the updated source checkout before using its renderer. Do not change these rules merely because the tool has already run once.

If no permanent key exists (older download), obtain one fresh prompt from the Averlo tool page. Saving an email is optional for these updates. Email login restores the website's saved collection; the local key only reads updates for this tool. Key access lasts while Averlo continues operating this delivery service; security rotation or removal of a tool can invalidate it.
