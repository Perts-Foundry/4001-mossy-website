// Cloudflare Worker for 4001mossy.com.
//
// This is a static brochure site, so the Worker does exactly one thing: hand
// every request to the static-assets binding. `not_found_handling` and
// `html_handling` (configured in wrangler.toml) take care of 404s and
// trailing slashes. If the site ever needs a dynamic endpoint (e.g. a contact
// form API), branch on `url.pathname` here before the ASSETS.fetch fallthrough.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
