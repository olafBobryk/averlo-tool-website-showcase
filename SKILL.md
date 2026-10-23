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

For catalog access or updates, obtain a fresh prompt from https://www.averlo.co/tools/website-showcase. Follow its temporary-credential instructions. Never embed credentials in Git remote URLs or files that may be committed. Preserve local changes and review updates before integrating them; do not reset or overwrite customizations. Remote skill updates require valid repository access; local-path installations should be refreshed from the updated checkout.
