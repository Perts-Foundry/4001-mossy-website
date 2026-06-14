# CLAUDE.md — 4001 Mossy Bank Lane

## Project overview

A single-page, for-sale property website for 4001 Mossy Bank Lane,
Fredericksburg, VA 22408 (live at https://4001mossy.com). Plain static site —
**no build step** — served by a minimal Cloudflare Worker. DNS, the Worker
route, and this repo are managed in the
[Perts-Foundry/infrastructure](https://github.com/Perts-Foundry/infrastructure)
repo (Terraform).

## Architecture

- The site is the literal contents of `public/` (HTML/CSS/JS/images), committed
  to the repo. There is no generator and no compile step.
- `src/worker.js` is a one-liner that hands every request to the static-assets
  binding (`env.ASSETS.fetch`). `wrangler.toml` wires `./public` to that binding
  with `not_found_handling = "404-page"`. Add dynamic routes (e.g. a contact API)
  by branching on `url.pathname` in the Worker before the assets fallthrough.
- `public/index.html` is the whole page. All editable content is tagged with
  `EDIT:` comments; the README's "Editing your listing" table maps each one.
- `public/css/styles.css` holds all styles; design tokens (colors, spacing) are
  CSS custom properties in `:root` at the top.
- `public/js/main.js` is vanilla JS: mobile nav toggle + an accessible photo
  lightbox (keyboard nav, focus trap, scroll lock). Progressive enhancement —
  the page works with JS disabled.

## Content conventions

- Placeholder photos are labeled SVGs in `public/images/`. Replace them with real
  photos (JPG/WebP) and update `src`/`data-full`/`alt` in `index.html`.
- The Matterport tour URL goes in **both** the `#tour` `<iframe src>` and the
  fallback `<a href>`. Format: `https://my.matterport.com/show/?m=<id>`.
- Keep the JSON-LD block's address accurate; extend it with beds/baths/floorSize
  and an `offers` price block when known.
- Contact is **display-only** (tel:/mailto:) — there is no form and no backend
  secret. Keep it that way unless a contact form is explicitly requested.

## CI / deploy

- `.github/workflows/validate.yml` is a single job named **`validate`** (the
  required status check — renaming it breaks branch protection and the deploy
  gate). It runs: prettier, htmltest, pa11y-ci (WCAG 2.1 AA), a content smoke
  test, gitleaks, actionlint, and posts one consolidated PR comment. `.pa11yci`
  ignores the axe `color-contrast`, `region`, and `frame-tested` rules: axe
  can't composite the hero's layered photo + overlay (it mis-measures the white
  hero text against the page background) and can't introspect the cross-origin
  Matterport iframe. Hero contrast is handled in CSS with a dark fallback +
  overlay; verify contrast by design when changing the palette.
- `.github/workflows/preview.yml` runs **draft (preview) deployments** on every
  push to a PR. It uploads a non-production Worker _version_ via
  `wrangler versions upload --preview-alias pr-<N>` (`.github/actions/preview-deploy`)
  and upserts one PR comment (marker `<!-- preview -->`) with a clickable
  `pr-<N>-4001-mossy-website.<subdomain>.workers.dev` URL. The alias is stable
  across pushes; the comment is marked closed when the PR closes. Production is
  untouched — preview uses `versions upload`, never `deploy`. Skips drafts, fork
  PRs (read-only token), and Dependabot (empty secrets scope). Reuses the same
  `CLOUDFLARE_*` secrets. Because `workers_dev = false`, Cloudflare leaves
  Preview URLs disabled on the live Worker and a `versions upload` does not flip
  that setting; the action therefore first enables Preview URLs idempotently via
  the Workers Script Subdomain API (`previews_enabled: true`, `enabled: false` so
  the production workers.dev route stays off) before uploading. The only
  remaining external prerequisite is an account workers.dev subdomain (see
  Infrastructure coupling). On a failed upload the workflow posts an error
  comment instead of a silent red check. There is no per-PR resource to delete: the `pr-<N>` alias is reused per
  PR and superseded (not torn down), and each push's uploaded version is retained
  by Cloudflare's version history and ages out automatically.
- Deploy (production) is comment-driven: comment `deploy` on a green PR →
  `wrangler deploy` via `.github/actions/deploy` → squash-merge. Needs repo
  secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` and a `production`
  environment (see `docs/runbook.md`).
- CI tools run via pinned `npx`/`curl` (no `package.json`); Dependabot manages
  GitHub Actions versions only.

## Local checks

```bash
npx serve public -l 8080            # preview at http://localhost:8080
npx prettier --check .              # formatting (CI gate)
npx wrangler dev                    # run as a Worker locally
```

## Infrastructure coupling

- The Worker script name (`4001-mossy-website` in `wrangler.toml`) must match the
  `cloudflare_workers_route` `script` value in the infrastructure repo. Don't
  rename one without the other.
- The Content-Security-Policy (security-headers ruleset in the infra repo) allows
  framing `https://my.matterport.com`. If the tour host changes, update the CSP
  `frame-src` there.
- Preview deployments require the Cloudflare account to have a registered
  workers.dev subdomain (an account-level resource). Without it, the preview
  `versions upload` still succeeds but mints no URL, and the PR comment shows a
  "no preview URL" warning. Provision/verify it through the infrastructure repo
  (Terraform), never the Cloudflare dashboard.
- Preview deployments serve from `*.workers.dev`, a different origin than the
  production custom domain. The infra security-headers ruleset (CSP etc.) is
  attached to the custom domain, so it does **not** apply to preview URLs. That's
  fine for review (the Matterport iframe still frames, since no CSP is enforced
  there); just don't treat a preview URL as a faithful test of production headers.
- All DNS / routing / header changes are Terraform — never make manual Cloudflare
  changes; open a PR in the infrastructure repo.

## Sensitive content

This repo is **public**. The address, photos, and contact details shown on the
site are public by design (it's a for-sale listing). Do **not** add anything that
isn't meant to be on a public listing: financial details beyond the asking price,
showing schedules, alarm/lockbox codes, or any secret/token. Cloudflare API
tokens live only in repo Actions secrets, never in source.
