# Go-live runbook: 4001mossy.com

One-time steps to take the site from "PRs open" to "live on 4001mossy.com."
Two pull requests are involved:

- **Infra PR** in `Perts-Foundry/infrastructure` creates the `4001mossy.com`
  Cloudflare zone, DNS records, the Worker route, zone settings, security
  headers, and adopts this repo into Terraform.
- **Site PR** in this repo (`4001-mossy-website`): the website itself.

> **Order matters in one place:** the Worker script must be deployed **before**
> the infra PR is applied, because the Worker route references the script by
> name and Cloudflare rejects a route to a script that doesn't exist yet.

**Prerequisite: the GitHub repo exists.** `Perts-Foundry/4001-mossy-website`
must already exist on GitHub before the infra PR's `plan` runs, because the
infra repo's `import` block adopts the existing repo at plan time (a plan
against a non-existent repo fails). It is created during initial setup. If you
ever recreate it, create it **bare** (`gh repo create
Perts-Foundry/4001-mossy-website --public` with no manual rulesets, branch
protection, or Dependabot toggles), and let Terraform configure protection,
Dependabot, and the PR-creation policy on apply.

## 1. Add repo secrets and the `production` environment (one time)

The deploy workflow needs two Actions secrets and a `production` environment.
Use the **pertsfoundry** Cloudflare account (the same one the other sites use).

```bash
REPO=Perts-Foundry/4001-mossy-website

# Cloudflare account ID (pertsfoundry account, public, not a secret, but the
# workflow reads it from a secret for parity with the other repos).
gh secret set CLOUDFLARE_ACCOUNT_ID -R "$REPO" --body 8463b4729a652db1bd77de33602984fb

# A scoped API token with "Workers Scripts:Edit" (+ Account: Workers Routes if
# you manage routes from here; routes are managed in Terraform, so Workers
# Scripts edit is the minimum). Paste the token when prompted:
gh secret set CLOUDFLARE_API_TOKEN -R "$REPO"
```

The `production` environment is auto-created by GitHub the first time the deploy
workflow runs, with no required reviewers (which is what we want; required
reviewers would stall comment-driven deploys). For a GitHub-enforced second
layer, pre-create it under **Settings → Environments → New environment** named
`production` and add a deployment-branch policy limiting it to `main`
(comment-triggered deploys run on the `main` ref, so that policy still allows
them).

The PR preview workflow (`preview.yml`) reuses the same two secrets, but it also
needs the **pertsfoundry** Cloudflare account to have a registered **workers.dev
subdomain** (account-level, one time). Without it, `wrangler versions upload
--preview-alias` uploads the version but mints no preview URL, and the PR comment
shows a "no preview URL" warning. Set the subdomain once under **Workers &
Pages → (account) → Subdomain** if it is not already configured for the account.
The site's `wrangler.toml` keeps `workers_dev = false` (no production
`*.workers.dev` route) and `preview_urls = true` (per-PR previews); these are
independent settings.

## 2. First deploy: create the Worker script

On the **site PR**, once the **Validate** check is green, comment:

```
deploy
```

That runs `wrangler deploy`, which creates the `4001-mossy-website` Worker, then
squash-merges the PR. (You can also deploy locally with
`CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… npx wrangler deploy`.)

At this point the Worker exists but isn't reachable on the domain yet; there's
no route and no DNS. That's expected.

## 3. Apply the infra PR: zone, DNS, route

On the **infra PR**, comment `plan`, review the output, then comment `apply`.
This creates the zone, the apex/www DNS records, the Worker route (now valid
because the script exists), the www→apex redirect, zone settings, and security
headers. It also imports this repo into Terraform state.

## 4. Delegate the domain to Cloudflare

`4001mossy.com` is registered but not yet pointed at Cloudflare. After the apply:

```bash
# In the infrastructure repo, after apply:
terraform output mossy_zone_name_servers
```

(or read them from the Cloudflare dashboard for the zone). At your domain
registrar for `4001mossy.com`, set those two Cloudflare nameservers as the
domain's custom nameservers. Propagation usually takes minutes, occasionally up
to 24 hours. Cloudflare will issue the TLS certificate automatically once the
domain resolves to it.

## 5. Verify

```bash
dig 4001mossy.com +short          # should resolve via Cloudflare
curl -sI https://4001mossy.com    # 200, with HSTS + security headers
```

Then open https://4001mossy.com and check: the hero, the photo gallery lightbox,
the Matterport tour, the mobile menu, and the contact links (tap-to-call /
email). `https://www.4001mossy.com` should 301 to the apex.

## 6. Clean up the import block

After the infra apply succeeds, open a small follow-up PR in the infrastructure
repo removing the `import { to = github_repository.repo["mossy"] … }` block from
`github.tf` (import blocks are meant to be removed once the resource is in
state).

## Ongoing changes

Edit content (see the README's "Editing your listing"), open a PR, wait for
**Validate** to pass, and comment `deploy`. Done.

## Notes

- **Matterport CSP:** the security headers in the infra repo allow framing
  `https://my.matterport.com`. If your tour is hosted on a different Matterport
  domain, update the `Content-Security-Policy` `frame-src` in
  `cloudflare.tf` (the `mossy_response_headers` ruleset).
- **No email is configured** for `4001mossy.com`: the zone ships with null-MX,
  SPF, and DMARC reject records, so the domain can't be used to send spoofed
  mail. The contact email on the site (`mailto:`) can be any mailbox you already
  own.
