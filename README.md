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
npm install @clerk/nextjs@latest
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

## Testing

Run unit and integration tests via Jest:
```bash
npx jest --verbose
# or: npm test
```

## Environment Variables

The app uses the following environment variables (create a `.env.local` file):

```bash
# Google Analytics (gtag.js)
NEXT_PUBLIC_GTAG_ID=AW-17250895076

# MongoDB connection string
MONGODB_URI=<your_mongodb_uri>
```
