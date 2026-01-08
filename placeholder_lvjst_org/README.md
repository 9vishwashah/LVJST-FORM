# Placeholder site for lvjst.org (closed root, proxy /register)

Instructions
- Copy the contents of this `placeholder_lvjst_org` folder to the root of the repository that serves `lvjst.org`.
- Deploy that repo (Netlify or your host). The root (`/`) will show the placeholder page and `/register/*` will be proxied to the Netlify app at `https://lvjstregister.netlify.app`.

Files
- `_redirects` — Simple redirect rules for Netlify or hosts that support `_redirects`.
- `netlify.toml` — Equivalent rules if you prefer TOML config.
- `index.html` — The closed/placeholder root page.

Quick git commands (run in your `lvjst.org` repo):
```bash
git checkout -b placeholder/register-proxy
cp -r /path/to/placeholder_lvjst_org/* .
git add .
git commit -m "Add placeholder root and proxy rules for /register"
git push origin HEAD
```

Notes
- If `lvjst.org` is currently attached as a custom domain to the registration Netlify site, consider removing it from that Netlify site (Netlify dashboard → Site settings → Domain management) so `lvjst.org` can point to this placeholder site.
- If you use serverless functions under `/.netlify/functions`, keep the `_redirects` entry for them so they remain reachable at `/register/.netlify/functions/*`.
