import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    { portfolio: any[]; performance: any[]; gain: number } | { error: string }
  >
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const client = await clientPromise;
  const db = client.db();
  const saved = await db
    .collection('portfolios')
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  if (saved.length === 0) {
    return res.status(404).json({ error: 'No saved portfolio' });
  }
  const { portfolio, performance, gain } = saved[0];
  return res.status(200).json({ portfolio, performance, gain });
}