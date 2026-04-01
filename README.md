# Shortlisted

AI-powered UCAS personal statement reviewer for UK university applicants. Built with Next.js 14, Claude AI, Stripe, Upstash Redis, and Resend.

## Product Flow

1. User pastes their personal statement + email on the homepage
2. Free analysis runs via Claude — returns overall score and first criterion (Passion & Motivation)
3. Results page shows the free preview with 4 locked criteria cards
4. User pays £4.99 via Stripe Checkout to unlock the full analysis
5. Stripe webhook triggers a second Claude call; full results stored in Redis
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
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | See Stripe webhook setup below |
| `STRIPE_PRICE_ID` | Stripe Dashboard → Product catalog |
| `UPSTASH_REDIS_REST_URL` | [console.upstash.com](https://console.upstash.com) → Redis → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Same as above |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `NEXT_PUBLIC_BASE_URL` | Your deployed URL, e.g. `https://shortlisted.app` |

### 3. Create a Stripe product

1. Go to Stripe Dashboard → **Product catalog** → **Add product**
2. Name: "Full UCAS Personal Statement Analysis"
3. Price: £4.99, one-time
4. Copy the **Price ID** (starts with `price_`) into `STRIPE_PRICE_ID`

### 4. Set up the Stripe webhook

#### Local development (using Stripe CLI):

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the webhook signing secret printed by the CLI into `STRIPE_WEBHOOK_SECRET`.

#### Production (Vercel):

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://your-domain.com/api/webhook`
3. Events to listen for: `checkout.session.completed`
4. Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET` in your Vercel environment variables

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
│       ├── checkout/route.ts# POST — Stripe checkout session
│       ├── webhook/route.ts # POST — Stripe webhook + paid analysis
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
- **Payments**: Stripe Checkout
- **Storage**: Upstash Redis (48h TTL)
- **Email**: Resend
- **Hosting**: Vercel
