import type { NextApiRequest, NextApiResponse } from 'next';
import { subYears } from 'date-fns';
import yahooFinance from 'yahoo-finance2';
import { categories, categoryTickerOptions, PortfolioItem } from '../../lib/portfolio';

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
          'Extract portfolio tickers and allocation percentages from the user input. ' +
          'Return only a JSON array of objects [{ "ticker": "AAPL", "weight": 0.25 }, ...]. ' +
          'Ticker symbols should be uppercase. Weights should be decimal fractions that sum to 1; normalize weights if necessary. ' +
          'If input is an image, it will be provided as an image_url block; use vision capabilities to extract the data.',
      },
      { role: 'user', content: inputText },
    ];

    // If this was an image upload, send the image as an image_url block in the user message
    if (!text && fileData && fileType) {
      const imageDataUri = `data:${fileType};base64,${fileData}`;
      messages[1].content = [
        { type: 'text', text: 'Please extract the tickers and weights from the image.' },
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

    let parsed: Array<{ ticker: string; weight: number }>;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Invalid JSON output from OpenAI');
      parsed = JSON.parse(match[0]);
    }

    const portfolio: PortfolioItem[] = parsed.map(({ ticker, weight }) => {
      const category =
        categories.find(cat =>
          (categoryTickerOptions[cat] as readonly string[]).includes(ticker)
        ) || categories[2];
      return { category, ticker, weight };
    });

    const endDate = new Date();
    const startDate = subYears(endDate, numYears);
    const client = new yahooFinance();
    const rawData = await Promise.all(
      portfolio.map(p =>
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
    const performance = dates.map((date, idx) => {
      const value = portfolio.reduce(
        (sum, p, ti) => sum + (rawData[ti][idx]?.close || 0) * p.weight,
        0
      );
      return { date, value };
    });
    const gain =
      (performance[performance.length - 1].value / performance[0].value - 1) *
      100;
    return res.status(200).json({ portfolio, performance, gain });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}