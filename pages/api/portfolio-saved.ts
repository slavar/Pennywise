import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { getAuth, clerkClient } from '@clerk/nextjs/server';

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
  const user = await (await clerkClient()).users.getUser(userId);
  const email = user.emailAddresses.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress;
  if (!email) {
    return res.status(400).json({ error: 'Primary email not found for user' });
  }
  const client = await clientPromise;
  const db = client.db();
  const saved = await db
    .collection('portfolios')
    .find({ userId: email })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  if (saved.length === 0) {
    return res.status(404).json({ error: 'No saved portfolio' });
  }
  const { portfolio, performance, gain } = saved[0];
  return res.status(200).json({ portfolio, performance, gain });
}
