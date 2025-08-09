# Pennywise

Investment Portfolio Recommendation Web Application.

## Features

- Provide investment portfolio recommendations based on Yahoo Finance data.
- Portfolio comprised of ETFs, shares, and bonds.
- Friendly UX/UI with risk and horizon sliders.
- Historic portfolio performance graph (1, 3, and 5 years) with gain/loss indicators.
- Persist custom portfolio analyses in MongoDB for logged-in users.

## Tech Stack

- Next.js with TypeScript for frontend and backend (API routes).
- Yahoo Finance integration via `yahoo-finance2`.
- Recharts for data visualization.
- date-fns for date handling.
- Clerk for authentication and user management.
- Vercel Analytics for real-time traffic insights.
- MongoDB (via Vercel integration) for persisting custom portfolio data.

## Setup & Installation

```bash
npm install
```

### Node version

Pennywise requires Node.js v18.14.0, v20.x, v22.x, or v24.x and above. Node.js v23.x is currently not supported by our test tooling.

You can automatically switch to the LTS version (v22.x) with nvm:
```bash
nvm use
```

## Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Build

```bash
npm run build
```

## Run

```bash
npm start
```

## Scripts

- `npm run instructions`: Display usage instructions.
- `npm run dev`: Run in development mode.
- `npm run build`: Build for production.
- `npm start`: Start production server.
- `npm test`: Run unit and integration tests.

## Testing

Run unit and integration tests via Vitest:
```bash
npm test
```

## Environment Variables

The app uses the following environment variables (create a `.env.local` file):

```bash
# Google Analytics (gtag.js)
NEXT_PUBLIC_GTAG_ID=AW-17250895076

# MongoDB connection string
MONGODB_URI=<your_mongodb_uri>
```

## API

### GET `/api/portfolio`

- Query: `tickers` (comma-separated symbols, default `BND,VOO,AAPL`), `years` (e.g., `1`, `3`, `5`; default `5`).
- Response: time-series per symbol using Yahoo Finance `chart`.

Example:
```json
{
  "series": [
    {
      "symbol": "VOO",
      "points": [
        { "date": "2023-01-01T00:00:00.000Z", "close": 377.45 },
        { "date": "2023-01-08T00:00:00.000Z", "close": 381.12 }
      ]
    }
  ]
}
```

Notes:
- Uses `chart(range, interval)` with `range = <years>y`; interval is `1wk` for `years >= 5`, otherwise `1d`.
- The app computes aggregate performance client-side using the selected tickers and current risk/horizon.
