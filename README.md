# 4001 Mossy Bank Lane

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020)](https://workers.cloudflare.com/)

Perts Foundry showcase page for **4001 Mossy Bank Lane, Fredericksburg, VA
22408**, live at **[4001mossy.com](https://4001mossy.com)**.

The home has sold. The site began as its for-sale listing and is now kept as a
portfolio piece: "the website that sold this home," designed, built and hosted
by [Perts Foundry](https://pertsfoundry.com). It shows the hero carousel, a
photo gallery with lightbox, a static placeholder for the 3D tour the listing
carried, and a "What we built" summary. Its calls to action link to the Perts
Foundry Website Design page and, in the contact section, to the Perts Foundry
contact page. It is a plain static site (no build step) served by
a Cloudflare Worker. DNS, the Worker route, and this repository are all managed
as code in the
[Perts-Foundry/infrastructure](https://github.com/Perts-Foundry/infrastructure)
repo.

## Editing the showcase

A few spots are marked with **`EDIT:`** comments in **`public/index.html`**
(search for `EDIT:`):

| What                 | Where (search `public/index.html` for…)                      |
| -------------------- | ------------------------------------------------------------ |
| **Announcement bar** | `EDIT: announcement bar` (top bar, links to Website Design)  |
| **Hero photos**      | `EDIT: hero slideshow images` (the auto-rotating carousel)   |
| Social image         | `EDIT: 1200x630 social image`                                |
| Page title / SEO     | `EDIT: page title` and `EDIT: one-sentence summary`         |

Everything else (the facts strip, gallery, tour placeholder, "What we built"
cards, results and contact sections) is plain HTML in `public/index.html`.
Edit it directly.

### Content rules

- Copy may state only facts the owner of the page has confirmed: sold by owner,
  listed on the MLS in July 2026 and sold in under three months, a homeowner
  selling by owner, the design and platform features, WCAG 2.1 AA checks on
  every change, and a preview link for every proposed change. Do not add claims
  about price, traffic, showings, inquiries, speed or cost.
- No listing content: no price, floor plans, seller notes, real-estate
  disclaimers or JSON-LD `offers`.
- No contact details of any kind: no email address, phone number, `mailto:`,
  `tel:`, `sms:` or booking link. The only contact path is the link to the
  Perts Foundry contact page.
- Links to pertsfoundry.com carry the UTM tags `utm_source=4001mossy.com`,
  `utm_medium=referral` and `utm_campaign=showcase`.
- The Perts Foundry logo in the header is an inline copy of the main site's
  horizontal dark logo. Do not draw a new one.

### Photos

Real photos live in **`public/images/`** as optimized JPGs (EXIF/GPS stripped).
Only exterior photos of the house are kept: no interior rooms, floor plans or
community amenity photos. Each gallery photo ships in two sizes: a `*-sm.jpg`
thumbnail used as the grid `src`, and a full-size `*.jpg` used by the lightbox
(`data-full`). To change a photo:

1. Add your exterior image to `public/images/` (JPG or WebP; ~2000px wide for
   the hero, ~1600px for gallery/full views, ~800px for thumbnails).
2. Point the gallery item's `src` (thumbnail) and `data-full` (full size) at the
   new files and update the `alt` text and `data-caption`. Add or remove `<li>`
   items freely; the lightbox picks up every `.gallery-item` automatically. The
   whole gallery shows, with no collapse toggle.
3. The hero is `/images/hero.jpg` and the social card is `/images/og-cover.jpg`
   (1200×630).

The favicon is a simple house mark (`public/favicon.svg`), with
`public/apple-touch-icon.png` for iOS.

### 3D tour placeholder

The `#tour` section is a static card: an exterior photo with a "3D tour"
overlay and a caption saying the listing carried an interactive 3D tour that was
deactivated after the sale. There is no iframe and no third-party embed.

## Local preview

No build step. Just serve the `public/` folder:

```bash
npx serve public -l 8080
# then open http://localhost:8080
```

Or test it the way it runs in production (Cloudflare Worker + static assets):

```bash
npx wrangler dev
```

## How changes go live

This repo uses the same PR-and-comment flow as the other Perts Foundry sites:

1. Create a branch, make your edits, open a pull request.
2. The **Validate** check runs automatically (formatting, links, accessibility,
   secret scan, a content smoke test that also rejects a Matterport embed, email
   addresses, and mailto/tel/sms or cal.com links). It posts a report on the PR.
3. A **draft preview** also deploys automatically on every push. The **Preview**
   workflow posts (and keeps updating) a comment with a clickable URL where you
   can click through your changes live before anything goes to production. The
   preview is a non-production Cloudflare Worker version, separate from the live
   site, which stays untouched. When the PR closes, the comment is marked closed.
4. When checks pass, comment **`deploy`** on the PR. That runs `wrangler deploy`
   to push the site to Cloudflare Workers, then squash-merges the PR.

First-time setup (DNS, repo secrets, the production environment) is documented
in **[docs/runbook.md](docs/runbook.md)**.

## Project structure

```
public/              The site itself (served as-is by the Worker)
  index.html         The single showcase page (edit this)
  404.html           Not-found page
  css/styles.css     All styles (design tokens at the top)
  js/main.js         Mobile nav, lightbox, hero carousel (Ken Burns), scroll
                     reveal/spy, sticky-header state, back-to-top
  images/            Exterior photos (thumbnails and full size), hero, og-cover
  robots.txt, sitemap.xml, favicon.svg, apple-touch-icon.png
  _headers           Cache-Control TTLs for /css, /js, /images
src/worker.js        Minimal Worker that serves the static assets
wrangler.toml        Cloudflare Workers deploy config
.github/workflows/   validate.yml (PR checks), preview.yml (per-PR draft preview),
                     deploy.yml (comment-driven production deploy)
.github/actions/     deploy + preview-deploy composite actions (wrangler)
docs/runbook.md      Go-live runbook (DNS cutover, secrets, deploy order)
```

> **Editing CSS or JS?** `_headers` caches `/css/*` and `/js/*` for an hour, so
> after changing `css/styles.css` or `js/main.js` bump the `?v=N` version on
> their `<link>` / `<script>` tags in `index.html` (and the CSS link in
> `404.html`, which loads no JS). Otherwise returning visitors may be served the
> stale file for up to an hour. Content edits to `index.html` itself go live
> immediately (HTML is not cached).

## Infrastructure

DNS for `4001mossy.com`, the Cloudflare Worker route, zone settings, security
headers, and this repository are all defined in the
[Perts-Foundry/infrastructure](https://github.com/Perts-Foundry/infrastructure)
repo. **Never make manual infrastructure changes** (open a PR there instead).

## License

Code is released under the [MIT License](LICENSE). Property photos and page
content are © their owner and not covered by the code license.
