import type { NextApiRequest, NextApiResponse } from 'next';
import { subYears } from 'date-fns';
import yahooFinance from 'yahoo-finance2';
import { categories, categoryTickerOptions, PortfolioItem } from '../../lib/portfolio';
import clientPromise from '../../lib/mongodb';
import { getAuth, clerkClient } from '@clerk/nextjs/server';

/** One line item of the time-series performance */
type PerformanceEntry = { date: string; value: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    portfolio: PortfolioItem[];
    performance: PerformanceEntry[];
    gain: number;
  } | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await (await clerkClient()).users.getUser(userId);
    const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
    if (!email) {
      return res.status(400).json({ error: 'Primary email not found for user' });
    }
    const { text, fileData, fileType, years } = req.body;
    const numYears = parseInt(years as string, 10) || 1;


    let inputText: string;
    if (text) {
      inputText = text;
    } else if (fileData) {
      inputText = fileData;
    } else {
      throw new Error('No input provided');
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const messages: any[] = [
      {
        role: 'system',
        content:
          'Extract portfolio tickers, number of shares, and current ticker prices from the user input. ' +
          'Return only a JSON array of objects [{ "ticker": "AAPL", "shares": 100, "price": 150.0 }, ...]. ' +
          'Ticker symbols should be uppercase. Shares and prices should be numeric values. ' +
          'If input is an image, it will be provided as an image_url block; use vision capabilities to extract the data.',
      },
      { role: 'user', content: inputText },
    ];

    // If this was an image upload, send the image as an image_url block in the user message
    if (!text && fileData && fileType) {
      const imageDataUri = `data:${fileType};base64,${fileData}`;
      messages[1].content = [
        { type: 'text', text: 'Please extract the tickers, number of shares, and current ticker prices from the image.' },
        { type: 'image_url', image_url: { url: imageDataUri } },
      ];
    }

    // Call OpenAI Chat Completion API via JSON payload
    const payload = { model: 'gpt-4o', messages, temperature: 0 };
    const completionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    const completion = await completionRes.json();
    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse tickers, share counts, and optional prices from model output
    let parsed: Array<{ ticker: string; shares: number; price?: number }>;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Invalid JSON output from OpenAI');
      parsed = JSON.parse(match[0]);
    }

    // Build initial portfolio items with share counts
    const sharesPortfolio = parsed.map(({ ticker, shares }) => {
      const category =
        categories.find(cat =>
          (categoryTickerOptions[cat] as readonly string[]).includes(ticker)
        ) || categories[2];
      return { category, ticker, shares };
    });

    const endDate = new Date();
    const startDate = subYears(endDate, numYears);
    const client = new yahooFinance();
    const rawData = await Promise.all(
      sharesPortfolio.map(p =>
        client.historical(p.ticker, {
          period1: startDate,
          period2: endDate,
          interval: '1d',
        })
      )
    );
    if (!rawData.length) {
      return res.status(400).json({ error: 'No data available' });
    }

    const dates = rawData[0].map(d => d.date.toISOString().slice(0, 10));

    // Calculate performance time-series based on shares and closing prices
    const performance = dates.map((date, idx) => {
      const value = sharesPortfolio.reduce(
        (sum, p, ti) => sum + (rawData[ti][idx]?.close || 0) * p.shares,
        0
      );
      return { date, value };
    });
    const gain =
      (performance[performance.length - 1].value / performance[0].value - 1) *
      100;

    // Compute weights based on shares × current price (each ticker's latest closing price)
    const currentValues = sharesPortfolio.map((p, i) => {
      const history = rawData[i];
      const lastIdxForTicker = history.length - 1;
      const price = lastIdxForTicker >= 0 ? history[lastIdxForTicker]?.close ?? 0 : 0;
      return price * p.shares;
    });
    const totalValue = currentValues.reduce((sum, v) => sum + v, 0);
    const portfolio: PortfolioItem[] = sharesPortfolio.map((p, i) => {
      const history = rawData[i];
      const lastIdxForTicker = history.length - 1;
      const price = lastIdxForTicker >= 0 ? history[lastIdxForTicker]?.close ?? 0 : 0;
      return {
        category: p.category,
        ticker: p.ticker,
        shares: p.shares,
        price,
        weight: totalValue > 0 ? currentValues[i] / totalValue : 0,
      };
    });

    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    await db.collection('portfolios').updateOne(
      { userId: email },
      {
        $set: {
          createdAt: new Date(),
          portfolio,
          performance,
          gain,
        }
      },
      { upsert: true },
    );

    return res.status(200).json({ portfolio, performance, gain });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}