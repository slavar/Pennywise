import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { feedback } = req.body;

  if (!feedback) {
    return res.status(400).json({ message: 'Feedback is required' });
  }

  try {
    const client = await connectToDatabase;
    const db = client.db();
    const result = await db.collection('UserFeedback').insertOne({ feedback, createdAt: new Date() });

    return res.status(201).json({ message: 'Feedback submitted', id: result.insertedId });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
