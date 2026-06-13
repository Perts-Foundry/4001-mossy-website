# 4001 Mossy Bank Lane

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020)](https://workers.cloudflare.com/)

For-sale property website for **4001 Mossy Bank Lane, Fredericksburg, VA 22408**,
live at **[4001mossy.com](https://4001mossy.com)**.

A single-page listing: hero, photo gallery with lightbox, an interactive
Matterport 3D tour, property details, location, and contact information. It is a
plain static site (no build step) served by a Cloudflare Worker. DNS, the Worker
route, and this repository are all managed as code in the
[Perts-Foundry/infrastructure](https://github.com/Perts-Foundry/infrastructure)
repo.

## Editing your listing

Almost everything you'll want to change lives in **`public/index.html`**. Open
it and search for **`EDIT:`**. Every editable spot is marked with a comment.
Here's what to fill in:

| What                | Where (search `public/index.html` for…)             |
| ------------------- | --------------------------------------------------- |
| Price               | `EDIT: list price`                                  |
| Beds / baths / sqft | `EDIT: beds / baths`                                |
| Status              | `EDIT: status` (For Sale, Coming Soon, etc.)        |
| Quick facts         | `EDIT: fill in each value` (year, lot, garage…)     |
| Description         | `EDIT: write a few paragraphs`                      |
| Features list       | `EDIT: list the property's notable features`        |
| Location text       | `EDIT: a sentence or two about the area`            |
| **Matterport tour** | `EDIT: paste your Matterport "embed" URL`           |
| **Phone**           | `EDIT: phone number` (update the `tel:` link too)   |
| **Email**           | `EDIT: email` (update the `mailto:` link too)       |
| Page title / SEO    | `EDIT: page title` and `EDIT: one-sentence summary` |

### Photos

1. Drop your photos into **`public/images/`** (JPG or WebP recommended,
   ~1600px wide for the hero, ~1200px for gallery shots).
2. Replace the hero: overwrite/rename `public/images/hero.svg` references in the
   `<img class="hero-img" …>` tag to point at your file (e.g. `/images/hero.jpg`).
3. Update each gallery item in the `<ul class="gallery-grid">` block: point
   `src` and `data-full` at your photo and write descriptive `alt`/`data-caption`
   text. Add or remove `<li>` items freely.
4. For nice link previews, add a 1200×630 `public/images/og-cover.jpg` and update
   the `og:image` / `twitter:image` tags.

The shipped `*.svg` files are labeled placeholders; replace them with real
photos when ready.

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
3. When checks pass, comment **`deploy`** on the PR. That runs `wrangler deploy`
   to push the site to Cloudflare Workers, then squash-merges the PR.

First-time setup (DNS, repo secrets, the production environment) is documented
in **[docs/runbook.md](docs/runbook.md)**.

## Project structure

```
public/              The site itself (served as-is by the Worker)
  index.html         The single listing page (edit this)
  404.html           Not-found page
  css/styles.css     All styles (design tokens at the top)
  js/main.js         Mobile nav + accessible photo lightbox
  images/            Photos (placeholders shipped; replace with yours)
  robots.txt, sitemap.xml, favicon.svg
src/worker.js        Minimal Worker that serves the static assets
wrangler.toml        Cloudflare Workers deploy config
.github/workflows/   validate.yml (PR checks), deploy.yml (comment-driven deploy)
.github/actions/     deploy composite action (wrangler deploy)
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
