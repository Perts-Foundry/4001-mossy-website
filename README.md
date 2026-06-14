# 4001 Mossy Bank Lane

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020)](https://workers.cloudflare.com/)

For-sale property website for **4001 Mossy Bank Lane, Fredericksburg, VA 22408**,
live at **[4001mossy.com](https://4001mossy.com)**.

A single-page listing: hero, photo gallery with lightbox, an interactive
Matterport 3D tour, property details and renovation highlights, floor plans,
location and community amenities, and contact information. It is a plain static
site (no build step) served by a Cloudflare Worker. DNS, the Worker route, and
this repository are all managed as code in the
[Perts-Foundry/infrastructure](https://github.com/Perts-Foundry/infrastructure)
repo.

## Editing your listing

The listing content is populated. The handful of spots most likely to change are
marked with **`EDIT:`** comments in **`public/index.html`** (search for `EDIT:`):

| What                | Where (search `public/index.html` for…)                                  |
| ------------------- | ------------------------------------------------------------------------ |
| **Status**          | `EDIT: status` (For Sale by Owner, Coming Soon, etc.)                    |
| **Price**           | `EDIT: list price` (currently "Price Upon Request")                      |
| **FSBO banner**     | `EDIT: For-Sale-by-Owner banner` (top announcement bar)                  |
| **Open house**      | `EDIT: open house` (band + JSON-LD) and `EDIT: For-Sale-by-Owner banner` |
| **Featured photos** | `EDIT: the 5 featured photos` (the "Highlights" strip up top)            |
| **Matterport tour** | `EDIT: Matterport tour` (iframe `src` + fallback)                        |
| **Phone**           | `EDIT: phone number` (update the `sms:`, `tel:`, and text)               |
| **Email**           | `EDIT: email` (update the `mailto:` link too)                            |
| Social image        | `EDIT: 1200x630 social image`                                            |
| Page title / SEO    | `EDIT: page title` and `EDIT: one-sentence summary`                      |

Everything else (beds/baths/square footage, quick facts, the written
description, renovation highlights, floor plans, location, and amenities) is
plain HTML in `public/index.html`. Edit it directly.

### Photos

Real photos live in **`public/images/`** as optimized JPGs (EXIF/GPS stripped).
Each gallery photo ships in two sizes: a `*-sm.jpg` thumbnail used as the grid
`src`, and a full-size `*.jpg` used by the lightbox (`data-full`). To change a
photo:

1. Add your image to `public/images/` (JPG or WebP; ~2000px wide for the hero,
   ~1600px for gallery/full views, ~800px for thumbnails).
2. Point the gallery item's `src` (thumbnail) and `data-full` (full size) at the
   new files and update the `alt` text and `data-caption`. Add or remove `<li>`
   items freely; the lightbox picks up every `.gallery-item` automatically. The
   main photo grid and the amenity grid start collapsed (first 8 and 6 photos)
   with a JS-added "Show all" toggle, so adding photos doesn't lengthen the
   first scroll.
3. The hero is `/images/hero.jpg` and the social card is `/images/og-cover.jpg`
   (1200×630).

The favicon is a simple house mark (`public/favicon.svg`), with
`public/apple-touch-icon.png` for iOS.

### Matterport 3D tour

In Matterport, open your model → **Share → Embed** and copy the URL (it looks
like `https://my.matterport.com/show/?m=XXXXXXXXXXX`). Paste it into **both**
the `<iframe src>` and the fallback `<a href>` in the `#tour` section.

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
   secret scan, a content smoke test). It posts a report on the PR.
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
  index.html         The single listing page (edit this)
  404.html           Not-found page
  css/styles.css     All styles (design tokens at the top)
  js/main.js         Mobile nav, lightbox, back-to-top, collapsible galleries
  images/            Optimized photos, floor plans, logo, hero, og-cover
  robots.txt, sitemap.xml, favicon.svg, apple-touch-icon.png
  _headers           Cache-Control TTLs for /css, /js, /images
src/worker.js        Minimal Worker that serves the static assets
wrangler.toml        Cloudflare Workers deploy config
.github/workflows/   validate.yml (PR checks), preview.yml (per-PR draft preview),
                     deploy.yml (comment-driven production deploy)
.github/actions/     deploy + preview-deploy composite actions (wrangler)
docs/runbook.md      Go-live runbook (DNS cutover, secrets, deploy order)
```

## Infrastructure

DNS for `4001mossy.com`, the Cloudflare Worker route, zone settings, security
headers, and this repository are all defined in the
[Perts-Foundry/infrastructure](https://github.com/Perts-Foundry/infrastructure)
repo. **Never make manual infrastructure changes** (open a PR there instead).

## License

Code is released under the [MIT License](LICENSE). Property photos and listing
content are © their owner and not covered by the code license.
