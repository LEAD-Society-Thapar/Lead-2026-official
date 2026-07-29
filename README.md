# LEAD 2026 Official Site

This project is a Vite + React single-page application configured for Netlify deployment.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

Build output is generated in `dist/`.

## Netlify Deployment

This repo includes:

- `netlify.toml` with build command and publish directory
- `public/_redirects` for SPA routing fallback (`/* -> /index.html 200`)

Netlify settings are:

- Build command: `npm run build`
- Publish directory: `dist`

## Connect Custom Domain (`leadtiet.in`)

In Netlify:

1. Open your site dashboard.
2. Go to Domain management.
3. Add custom domain: `leadtiet.in`.
4. Add domain alias: `www.leadtiet.in`.

If DNS is managed outside Netlify, set records at your DNS provider:

- `A` record for `@` -> `75.2.60.5`
- `A` record for `@` -> `99.83.190.102`
- `CNAME` for `www` -> `<your-netlify-subdomain>.netlify.app`

After DNS propagation, Netlify will provision SSL automatically.
