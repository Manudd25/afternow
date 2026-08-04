# AfterNow

**Explore tomorrow's world.**

AfterNow is an interactive platform that lets you explore possible future scenarios of cities around the world — powered by scientific data and AI-generated narratives.

## Features

- **City Search** — Explore any city worldwide via Open-Meteo geocoding
- **Future Timeline** — Interactive slider from Today to 2100
- **Future Dashboard** — Temperature, heatwaves, rainfall, flood/wildfire/sea level risk, air quality, water stress
- **Interactive Map** — Leaflet map with risk zone overlays
- **AI Summary** — Plain-language climate projections
- **Compare Cities** — Side-by-side comparison with charts
- **Story Mode** — Immersive narrative of future city life
- **Future City Visualizations** — Timeline-synced illustrative city scenes with optional Cloudflare Workers AI generation

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- React Router, Framer Motion
- Leaflet / React-Leaflet
- Recharts, Lucide React
- Open-Meteo Climate API
- Cloudflare Workers AI (optional)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The app works fully in **mock mode** with no Cloudflare account or paid API required.

## Environment Variables

Copy `.env.example` to `.env.local`:

```env
AI_IMAGE_PROVIDER=mock
AI_IMAGE_API_URL=
```

These variables are read **server-side by Vite only** — they are never exposed to the browser via `import.meta.env`.

| Variable | Values | Description |
|---|---|---|
| `AI_IMAGE_PROVIDER` | `mock` \| `cloudflare` | Image provider (default: `mock`) |
| `AI_IMAGE_API_URL` | Worker URL | Cloudflare Worker base URL for the Vite dev proxy |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID | Required by Wrangler for Workers AI |
| `CLOUDFLARE_API_TOKEN` | API token | Wrangler auth (Workers AI + Account permissions) |

The frontend calls the relative path `/api/generate-image`. Vite proxies that to your Worker in development — the Worker URL never appears in the client bundle.

**Security:** Do not add API keys to this file. Workers AI uses the `[ai]` binding in `cloudflare-worker/wrangler.toml` — credentials stay in Cloudflare, not in the React app.

---

## Cloudflare Workers AI Setup (Optional)

Live AI image generation uses a separate Cloudflare Worker in `cloudflare-worker/`. The frontend calls the Worker; the Worker calls Workers AI using the `[ai]` binding — no secrets in the browser.

### 1. Create a Cloudflare account

Sign up at [cloudflare.com](https://www.cloudflare.com/). Workers AI is available on the free tier with daily limits.

### 2. Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 3. Install Worker dependencies

```bash
cd cloudflare-worker
npm install
```

### 4. Configure allowed origins

Edit `cloudflare-worker/wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,https://your-production-domain.com"
```

Only listed origins receive CORS headers. Add your production domain before deploying.

### 5. Local Worker development

```bash
cd cloudflare-worker
npm run dev
```

Wrangler prints a local URL (e.g. `http://localhost:8787`). Use it in `.env.local`:

```env
AI_IMAGE_PROVIDER=cloudflare
AI_IMAGE_API_URL=http://localhost:8787
```

Restart the Vite dev server after changing env vars.

### 6. Deploy the Worker

```bash
cd cloudflare-worker
npm run deploy
```

Copy the deployed Worker URL into your frontend `.env.local`:

```env
AI_IMAGE_PROVIDER=cloudflare
AI_IMAGE_API_URL=https://afternow-image-worker.<your-subdomain>.workers.dev
```

For production hosting, configure your platform to proxy `/api/generate-image` to the Worker URL (same as Vite does in dev).

### 7. Secrets with Wrangler

Workers AI uses the `[ai]` binding — **no API token is required in the Worker code**. If you add other secrets later:

```bash
wrangler secret put MY_SECRET
```

Never commit secrets to git or expose them via `VITE_*` env vars.

### 8. Using AI generation in the app

1. Select a city and timeline year — metrics and CSS overlays update immediately
2. Click **Generate AI visualization** — sends the scenario prompt to your Worker
3. The Worker calls `@cf/black-forest-labs/flux-2-klein-4b` and returns the image
4. Generated images are cached in session memory by city + year + scenario

Generation is **on-demand only** (not on every timeline slider move) with a 30-second cooldown between requests.

---

## Mock Fallback

The app always works without Cloudflare configured:

| Condition | Behavior |
|---|---|
| `AI_IMAGE_PROVIDER=mock` | CSS overlays + curated placeholder photos |
| No Worker URL configured | Mock mode automatically |
| Worker error / timeout | Mock image stays visible + subtle fallback message |
| Daily quota exhausted (429) | Mock fallback with quota message |

Fallback message:

> Live AI generation is currently unavailable. Showing an illustrative scenario instead.

Mock cities with curated photos: **Berlin, Rome, Madrid, Amsterdam**. All other cities use a generic skyline.

---

## Free Tier Limitations

Cloudflare Workers AI free tier includes:

- Daily request limits (varies by model; check [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/))
- FLUX.2 Klein 4B is optimized for speed and cost-efficiency
- Rate limiting in the Worker defaults to 10 requests/minute per IP

The Worker returns `429` when rate-limited or quota is exceeded; the frontend falls back to mock visualization automatically.

---

## Data Sources

- [Open-Meteo Climate API](https://open-meteo.com/en/docs/climate-api)
- IPCC AR6 Assessment Reports
- NASA Climate Change Research
- Copernicus Climate Data Store

Projections use an intermediate emission scenario (SSP2-4.5) and represent possible futures — not certainties.

Visualizations are labeled **"Data-informed illustrative scenario"** (mock) or **"AI-generated illustrative scenario"** (live AI) and are never presented as guaranteed photographs of the future.

## License

MIT
