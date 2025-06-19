# Pennywise 

Investment Portfolio Recommendation Web Application.

## Features

- Provide investment portfolio recommendations based on Yahoo Finance data.
- Portfolio comprised of ETFs, shares, and bonds.
- Friendly UX/UI with risk and horizon sliders.
- Historic portfolio performance graph (1, 3, and 5 years) with gain/loss indicators.

## Tech Stack

- Next.js with TypeScript for frontend and backend (API routes).
- Yahoo Finance integration via `yahoo-finance2`.
- Recharts for data visualization.
- date-fns for date handling.
- Clerk for authentication and user management.
- Vercel Analytics for real-time traffic insights.

## Setup & Installation

```bash
npm install @clerk/nextjs@latest
npm install
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
