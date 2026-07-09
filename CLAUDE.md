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
  CSS custom properties in `:root` at the top, including a cool-blue accent ramp
  (`--accent-steel` -> `--accent-sky`, `--grad-accent`, `--grad-accent-soft`,
  `--shadow-glow`) used for heading underlines, hero stat numbers, card rims and
  hover glow, section kickers, and the nav underline. The original solid
  `--accent` is kept for the focus ring and bullet dots.
- `public/js/main.js` is vanilla JS: mobile nav toggle, an accessible photo
  lightbox (keyboard nav, focus trap, scroll lock), an auto-rotating hero
  carousel (crossfade, pause/play control, plus a slow Ken Burns zoom on the
  active slide, all starting paused under reduced-motion), a scroll-reveal system
  (an IntersectionObserver fades sections/cards in as they enter view; the hidden
  start state is opt-in via a `.js-reveal` root class that is added only after the
  observer is wired and only when reduced-motion is off, so no-JS shows
  everything), a scroll-spy that marks the current section's nav link
  (`.is-active` + `aria-current="location"`), a condensed header state on scroll
  (`.is-scrolled`, toggled by the same rAF-throttled passive scroll handler as
  the back-to-top button — it changes only color/shadow, never height, so the
  `--topbar-h` anchor offset stays valid), a floating back-to-top button
  (revealed past 600px of scroll), and collapsible photo/amenity grids (a
  JS-added "Show all" toggle hides all but the first 8 photos / 6 amenities to
  keep the first scroll short). Progressive enhancement — with JS disabled the
  page still works (hero shows its first slide, all photos show, no toggles, no
  reveal animation, everything visible).

## Content conventions

- Real photos live in `public/images/` as optimized JPGs (EXIF/GPS stripped).
  Each gallery photo has two sizes: a `*-sm.jpg` thumbnail (the grid `src`) and a
  full-size `*.jpg` (the lightbox `data-full`). The lightbox auto-collects every
  `.gallery-item` in the document, so the photo, floor-plan, and amenity grids
  share one viewer.
- The Matterport tour URL goes in **both** the `#tour` `<iframe src>` and the
  fallback `<a href>`. Format: `https://my.matterport.com/show/?m=<id>` (live id:
  `fTqNmKh5YzR`).
- Keep the JSON-LD block's address accurate. It carries
  beds/baths/floorSize/yearBuilt and an `offers` block (price, `priceCurrency`,
  `availability: InStock`) that mirrors the hero price ($559,900) and
  "Available Now" status; keep them in sync. (If the home returns to a future
  availability date, switch `availability` back to `PreOrder` and re-add an
  `availabilityStarts` date.) (Note:
  `offers` lives on the `SingleFamilyResidence` node, which strict schema.org
  validators may flag since `offers` is formally a `Product`/`Offer` property;
  this placement is intentional and search engines tolerate it.) A second JSON-LD
  block holds the open house `Event`s.
- The top of the page carries a For-Sale-by-Owner **announcement bar**, an
  **open house** band (`#openhouse`, gradient surface + calendar chip), and an
  auto-rotating **hero carousel** (`.hero-carousel`: highlight photos
  crossfading behind the hero text, decorative `alt=""`, with a pause/play
  control) — all tagged with `EDIT:` comments. The open house date/time lives in
  **four** places (announcement bar, `#openhouse` band, the JSON-LD `Event`s, and
  the `#contact` lead); update all four together. Hours can differ per day (e.g.
  Sat 11 AM–3 PM, Sun 1–4 PM), so each `Event`'s `startDate`/`endDate` and each
  visible time string must match its own day.
- A **Seller Notes** band (`#sellernotes`, before `#contact`, with its own nav
  link) carries time-sensitive logistics (availability date, offer-review
  deadline, title company) as `.feature-card`s, tagged with an `EDIT:` comment.
  Keep its availability status in sync with the hero status and the JSON-LD
  `offers.availability`.
- Contact is **display-only** (sms:/tel:/mailto:) — there is no form and no
  backend secret. Email is listed first, text is flagged as strongly preferred,
  and the primary button is an `sms:` link. Keep it form-free unless a contact
  form is explicitly requested.
- The site is **dark-mode only**: one dark `:root` palette in `styles.css`
  (deep navy + mid-gray surfaces, light text). There is no light theme or
  toggle. Call-to-action buttons (`.btn-primary`, header `.nav-cta`) are white
  with navy text, inverting to navy on hover.
- `styles.css` is cache-busted with a `?v=N` query on its `<link>` in
  `index.html` and `404.html`, and `main.js` carries the same `?v=N` on its
  `<script>` in `index.html`. Bump `N` whenever you change CSS or JS, because
  `public/_headers` caches `/css/*` and `/js/*` for an hour and same-filename
  edits would otherwise be served stale. (`404.html` loads no JS, so only its
  CSS link needs bumping.)

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
