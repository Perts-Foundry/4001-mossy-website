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

- Real photos live in `public/images/` as optimized JPGs (EXIF/GPS stripped).
  Each gallery photo has two sizes: a `*-sm.jpg` thumbnail (the grid `src`) and a
  full-size `*.jpg` (the lightbox `data-full`). The lightbox auto-collects every
  `.gallery-item` in the document, so the photo, floor-plan, and amenity grids
  share one viewer.
- The Matterport tour URL goes in **both** the `#tour` `<iframe src>` and the
  fallback `<a href>`. Format: `https://my.matterport.com/show/?m=<id>` (live id:
  `fTqNmKh5YzR`).
- Keep the JSON-LD block's address accurate. It already carries
  beds/baths/floorSize/yearBuilt; add an `offers` price block once an asking
  price is set (the hero currently shows "Price Upon Request").
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
- Deploy is comment-driven: comment `deploy` on a green PR → `wrangler deploy`
  via `.github/actions/deploy` → squash-merge. Needs repo secrets
  `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` and a `production`
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
- All DNS / routing / header changes are Terraform — never make manual Cloudflare
  changes; open a PR in the infrastructure repo.

## Sensitive content

This repo is **public**. The address, photos, and contact details shown on the
site are public by design (it's a for-sale listing). Do **not** add anything that
isn't meant to be on a public listing: financial details beyond the asking price,
showing schedules, alarm/lockbox codes, or any secret/token. Cloudflare API
tokens live only in repo Actions secrets, never in source.
