# CLAUDE.md — 4001 Mossy Bank Lane

## Project overview

A single-page Perts Foundry **showcase** for 4001 Mossy Bank Lane,
Fredericksburg, VA 22408 (live at https://4001mossy.com). The home has sold; the
site was its for-sale listing and is kept as a portfolio piece ("the website that
sold this home", built by Perts Foundry). Plain static site —
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
  `EDIT:` comments; the README's "Editing the showcase" table maps each one.
- `public/css/styles.css` holds all styles; design tokens (colors, spacing) are
  CSS custom properties in `:root` at the top, including a cool-blue accent ramp
  (`--accent-steel` -> `--accent-sky`, `--grad-accent`, `--grad-accent-soft`,
  `--shadow-glow`) used for heading underlines, card rims and hover glow,
  section kickers, and the nav underline. The original solid
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
  (revealed past 600px of scroll), and nothing else: the gallery shows
  every photo with no collapse toggle. Progressive enhancement — with JS disabled
  the page still works (hero shows its first slide, all photos show, no reveal
  animation, everything visible).

## Content conventions

- Real photos live in `public/images/` as optimized JPGs (EXIF/GPS stripped).
  Each gallery photo has two sizes: a `*-sm.jpg` thumbnail (the grid `src`) and a
  full-size `*.jpg` (the lightbox `data-full`). The lightbox auto-collects every
  `.gallery-item` in the document.
- **Image keep-list:** only exterior photos of the house stay in `public/images/`
  (no interior rooms, floor plans or community amenity photos). Today that is
  `photo-003/006/009/012/015/018/021/024/027/030` (each plus its `-sm.jpg`),
  `hero.jpg` and `og-cover.jpg`. Add a new photo only if it is an exterior shot
  that shows no interior through a window.
- **No listing:** the home has sold. No price, floor plans, seller notes,
  real-estate disclaimers, Equal Housing logo, byline names or JSON-LD `offers`.
  The JSON-LD is a `WebSite` whose `creator` is the Perts Foundry `Organization`.
- **No Matterport:** the `#tour` section is a static placeholder (an exterior
  photo with a "3D tour" overlay and a caption saying the listing's interactive
  tour was deactivated after the sale). No iframe and no third-party embed; the
  CSP in the infra repo should not allow framing.
- **Confirmed facts only:** copy may state only what the owner confirmed: sold
  by owner; listed on the MLS in July 2026 and sold in under three months; a
  homeowner selling by owner; the design and platform features; automated WCAG
  2.1 AA checks on every change; a preview link for every proposed change. Do
  not add claims about price, traffic, showings, inquiries, build speed or cost.
- **CTA and UTM:** the main call to action links to
  `https://pertsfoundry.com/small-business/website-design/` and the contact
  button to `https://pertsfoundry.com/contact/`, both with
  `?utm_source=4001mossy.com&utm_medium=referral&utm_campaign=showcase`.
- **Branding:** the design stays navy. The header carries an inline copy of the
  Perts Foundry horizontal dark logo (never draw a new one) and the page says
  "Built by Perts Foundry". Forge Blue (`--pf-blue`) is a fill behind white text
  or a border/underline only: it fails contrast as body text on navy.
- **No contact details:** no email address, phone number, `mailto:`, `tel:`,
  `sms:` or booking link anywhere under `public/`. The only contact path is the
  single link to the Perts Foundry contact page. Keep it form-free unless a
  contact form is explicitly requested.
- The site is **dark-mode only**: one dark `:root` palette in `styles.css`
  (deep navy + mid-gray surfaces, light text). There is no light theme or
  toggle.
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
  test, gitleaks, actionlint, and posts one consolidated PR comment. The smoke
  test requires the address, the ids `hero-heading gallery tour built contact`,
  a pertsfoundry.com link, the `pertsfoundry.com/contact/` link, JSON-LD and
  `gallery-item`; it fails if `public/` contains a Matterport embed, an email
  address, a `mailto:`/`tel:`/`sms:` link or a cal.com link. `.pa11yci`
  ignores the axe `color-contrast` and `region` rules: axe
  can't composite the hero's layered photo + overlay (it mis-measures the white
  hero text against the page background). Hero contrast is handled in CSS with a dark fallback +
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
- The Content-Security-Policy (security-headers ruleset in the infra repo) should
  use `frame-src 'none'`: the page embeds nothing. If an embed ever returns,
  update the CSP `frame-src` there first.
- Preview deployments require the Cloudflare account to have a registered
  workers.dev subdomain (an account-level resource). Without it, the preview
  `versions upload` still succeeds but mints no URL, and the PR comment shows a
  "no preview URL" warning. Provision/verify it through the infrastructure repo
  (Terraform), never the Cloudflare dashboard.
- Preview deployments serve from `*.workers.dev`, a different origin than the
  production custom domain. The infra security-headers ruleset (CSP etc.) is
  attached to the custom domain, so it does **not** apply to preview URLs. That's
  fine for review; just don't treat a preview URL as a faithful test of
  production headers.
- All DNS / routing / header changes are Terraform — never make manual Cloudflare
  changes; open a PR in the infrastructure repo.

## Sensitive content

This repo is **public**. The address and exterior photos shown on the site are
public by design. Do **not** add contact details, interior photos, financial
details, showing schedules, alarm/lockbox codes, or any secret/token. Old
commits still hold the former listing's interior photos and contact details;
history is not rewritten. Cloudflare API
tokens live only in repo Actions secrets, never in source.
