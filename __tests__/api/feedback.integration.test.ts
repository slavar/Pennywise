import { createMocks } from 'node-mocks-http';
import handleFeedback from '@/pages/api/feedback';
import clientPromise from '@/lib/mongodb';

describe('/api/feedback', () => {
  beforeEach(async () => {
    const client = await clientPromise;
    const db = client.db();
    await db.collection('UserFeedback').deleteMany({});
  });

  it('should save feedback to the database', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        feedback: 'This is a test feedback.',
      },
    });

    await handleFeedback(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData()).message).toEqual('Feedback submitted');

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('UserFeedback');
    const feedback = await collection.findOne({ feedback: 'This is a test feedback.' });
    expect(feedback).not.toBeNull();
  });
});