# Shortlisted

AI-powered UCAS personal statement reviewer for UK university applicants. Built with Next.js 14, Claude AI, Lemon Squeezy, Upstash Redis, and Resend.

## Product Flow

1. User pastes their personal statement + email on the homepage
2. Free analysis runs via Claude — returns overall score and first criterion (Passion & Motivation)
3. Results page shows the free preview with 4 locked criteria cards
4. User pays £4.99 via Lemon Squeezy Checkout to unlock the full analysis
5. Lemon Squeezy webhook triggers a second Claude call; full results stored in Redis
6. Results page polls every 2s and re-renders when paid data is ready
7. Full analysis emailed to the user via Resend

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd shortlisted
npm install
```

### 2. Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy Dashboard → Settings → API |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | See webhook setup below |
| `LEMONSQUEEZY_STORE_ID` | Lemon Squeezy Dashboard → Settings → Stores |
| `LEMONSQUEEZY_VARIANT_ID` | See product setup below |
| `UPSTASH_REDIS_REST_URL` | [console.upstash.com](https://console.upstash.com) → Redis → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Same as above |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `NEXT_PUBLIC_BASE_URL` | Your deployed URL, e.g. `https://shortlisted.app` |

### 3. Create a Lemon Squeezy product

1. Go to [app.lemonsqueezy.com](https://app.lemonsqueezy.com) → **Products** → **Add product**
2. Name: "Full UCAS Personal Statement Analysis"
3. Set as a **one-time purchase**, price: **£4.99**
4. After saving, open the product and go to the **Variants** tab
5. Copy the **Variant ID** (numeric) into `LEMONSQUEEZY_VARIANT_ID`
6. Copy your **Store ID** from Settings → Stores into `LEMONSQUEEZY_STORE_ID`

### 4. Set up the Lemon Squeezy webhook

#### Production (Vercel):

1. Lemon Squeezy Dashboard → **Settings** → **Webhooks** → **Add webhook**
2. Callback URL: `https://your-domain.com/api/webhook`
3. Events to enable: **order_created**
4. Set a **Signing secret** — copy it into `LEMONSQUEEZY_WEBHOOK_SECRET`

#### Local development:

Use a tunnelling tool such as [ngrok](https://ngrok.com) or [localtunnel](https://theboroer.github.io/localtunnel-www/) to expose your local server, then add the tunnel URL as the webhook endpoint above.

```bash
# Example with ngrok
ngrok http 3000
# Use the https URL printed by ngrok as your webhook callback URL
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add all environment variables from `.env.local` in your Vercel project settings under **Settings → Environment Variables**.

Make sure `NEXT_PUBLIC_BASE_URL` is set to your production domain.

## Project Structure

```
shortlisted/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage (paste statement)
│   ├── globals.css          # Tailwind v4 + theme tokens
│   ├── results/
│   │   └── page.tsx         # Results + polling page
│   └── api/
│       ├── analyse/route.ts # POST — free Claude analysis
│       ├── checkout/route.ts# POST — Lemon Squeezy checkout session
│       ├── webhook/route.ts # POST — Lemon Squeezy webhook + paid analysis
│       └── results/route.ts # GET  — fetch from Redis
├── components/
│   ├── ScoreRing.tsx        # SVG circular progress ring
│   ├── CriterionCard.tsx    # Criterion card (locked/unlocked)
│   ├── ParagraphAnnotations.tsx
│   └── RewriteSuggestions.tsx
├── lib/
│   ├── claude.ts            # Claude API helpers
│   ├── redis.ts             # Upstash Redis client
│   ├── email.ts             # Resend email helper
│   └── types.ts             # Shared TypeScript types
└── .env.local.example       # Required environment variables
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: Anthropic Claude (`claude-sonnet-4-5`)
- **Payments**: Lemon Squeezy
- **Storage**: Upstash Redis (48h TTL)
- **Email**: Resend
- **Hosting**: Vercel
