# Arcus Perpetual DEX — Portfolio & Analytics Dashboard

An institutional-grade, real-time analytics dashboard and portfolio tracker for **[Arcus Perpetual DEX](https://arcus.xyz)**. Anyone can paste any EVM wallet address to instantly inspect positions, volume, historical trade fills, fees paid, PnL performance, funding cashflows, and account margin health directly from the live Arcus API.

Built in strict accordance with the official **[Arcus Brand Kit](https://arcus.xyz/brand-kit)**, featuring authentic Arcus vector marks, bespoke typography (`Hedvig Letters Serif`, `Instrument Sans`, `Fragment Mono`), and the official color palette (`#E8DDBE` Warm Sand, `#0F140D` Obsidian, `#1E3B25` Forest Green, and `#A2EE3A` Electric Lime).

---

## Key Features

- **Instant Wallet Inspection**: Paste any EVM wallet address (or choose top protocol whales from the built-in live leaderboard) to inspect on-chain trading activity.
- **Direct Live API Integration**: Communicates directly with the Arcus production API (`https://api.arcus.xyz/v1/`) with zero intermediary proxy bottlenecks (Arcus natively supports CORS `*`).
- **Exact Quantums Precision**: Accurately decodes Arcus 64-bit quote quantums ($10^{-9}$ precision where `1e9 = $1.00 USD`) for volume, fees, collateral, and cash flows.
- **6 Core KPI Metric Cards**:
  - **Portfolio Value (Equity)**: Real-time net collateral, available margin, and maintenance requirement.
  - **Total Return (PnL)**: Combined Unrealized + Realized return with percentage ROI.
  - **Volume Breakdown**: 30-Day, 24-Hour, and Lifetime notional trading volumes.
  - **Fees & VIP Tier**: Total trading fees paid with VIP fee tier progress and maker/taker rebate schedules.
  - **Margin Health**: Color-coded margin safety gauge and liquidation proximity meter.
  - **Weekly Points & Rewards**: Real-time estimated and authenticated Season 1 weekly points allocation, reward tier (Diamond/Platinum/Gold/Silver/Bronze), and next drop countdown timer.
- **Arcus Weekly Points & Rewards Ledger Tab**: Dedicated tab featuring live countdown to Wednesday 19:00 UTC drop, 4 points KPI cards, 3-week distribution history table, and optional Privy token verification.
- **Protocol Leaderboard with Weekly Points Column**: Browse top traders with estimated weekly points share alongside notional volume, net PnL, and fees paid.
- **Interactive Performance Chart**: Custom SVG chart with dynamic hover crosshairs and tooltips toggling between **Equity Curve ($)** and **Cumulative PnL ($)** across `24H`, `7D`, `30D`, and `ALL` timeframes.
- **Open Perpetual Positions Table**: Sortable and filterable positions with market symbol, leverage, side (Long/Short), notional position size, entry price, mark price, est. liquidation price, and unrealized ROI.
- **Trade Execution History & CSV Export**: Detailed log of past trade fills including execution price, closed PnL, fees paid, liquidity role (Maker/Taker), and timestamp, with one-click **CSV export** for accounting and tax reporting.
- **Resting & Open Orders**: Track pending limit orders, trigger prices, and order statuses.
- **Hourly Funding Cashflows**: Historical funding rate payments paid and received per market.
- **Transfers Ledger**: Inflows and outflows (USDC deposits, withdrawals, and settlements).
- **Live Market Ticker**: Real-time ticker ribbon showing mark prices, 24h price changes, and open interest across all active Arcus perpetual markets.
- **Protocol Leaderboard Modal**: Browse the top-performing traders by volume and PnL on Arcus with quick one-click wallet inspection.
- **Fee Tier Schedule Modal**: Transparent maker/taker fee tiers and 30-day volume milestones.
- **URL Query Sync**: Bookmark and share any address via URL parameter (`/?address=0x...`).

---

## Tech Stack

- **Core**: React 19, JavaScript (ES Modules)
- **Bundler & Tooling**: Vite 8, Oxlint
- **Icons**: Lucide React
- **Typography**: Google Fonts (`Hedvig Letters Serif`, `Instrument Sans`, `Fragment Mono`, `JetBrains Mono`)
- **Styling**: Vanilla CSS Design System with custom CSS variables, glassmorphic surfaces, and micro-interactions
- **Hosting / Deployment Target**: Vercel (Zero-config static deployment with SPA rewrites via `vercel.json`)

---

## Deploy to Vercel

### Option 1: Import via Vercel Web Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your GitHub repository: **`shhuubbhh/Arcus-Dashboard`**.
3. Vercel automatically detects the project settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Deploy**. Your live dashboard will be deployed globally on Vercel within ~1 minute!

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Deploy directly from repository root
vercel --prod
```

---

## Local Development

### Prerequisites

- Node.js 18+ installed on your machine
- npm or pnpm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/shhuubbhh/Arcus-Dashboard.git
cd Arcus-Dashboard

# Install dependencies
npm install

# Start local development server with hot-reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

The dev server will launch at `http://localhost:5173/`.

---

## Arcus API Reference

The dashboard directly utilizes the following public Arcus DEX endpoints:

| Endpoint | Description |
| :--- | :--- |
| `GET /v1/account?account={address}` | Account balance, equity, available margin, and maintenance requirement |
| `GET /v1/positions?account={address}` | Active open perpetual positions and unrealized PnL |
| `GET /v1/account/stats?account={address}` | 24h, 30d, and all-time trading volume and fees paid |
| `GET /v1/portfolio?account={address}&resolution={res}` | Historical equity and cumulative PnL time series points |
| `GET /v1/fills?account={address}&limit=100` | Historical trade executions, maker/taker status, and closed PnL |
| `GET /v1/openOrders?account={address}` | Active resting limit orders |
| `GET /v1/orders?account={address}&limit=50` | Historical order lifecycle |
| `GET /v1/funding?account={address}&limit=50` | Funding fee payments and credits |
| `GET /v1/accountTransferUpdates?account={address}` | Deposits, withdrawals, and collateral transfers |
| `GET /v1/markets` | All perpetual contracts, mark prices, funding rates, and 24h stats |
| `GET /v1/feetiers` | Maker/Taker fee tier breakdown and volume brackets |
| `GET /v1/leaderboard` | Top protocol traders ranked by volume and performance |
| `GET https://points-api.arcus.xyz/v1/meta` | Live Season 1 rewards metadata, current drop schedule, and pool statistics |
| `GET https://points-api.arcus.xyz/v1/points/{address}` | Authenticated user points, tier, and weekly drop history (requires `privy-id-token`) |
| `GET https://points-api.arcus.xyz/v1/leaderboard` | Season 1 points leaderboard rankings and anonymous codenames |

---

## License

MIT © [shhuubbhh](https://github.com/shhuubbhh)
