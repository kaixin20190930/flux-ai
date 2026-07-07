const constructEvent = jest.fn();
const fetchMock = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent,
    },
  }));
});

describe('stripe webhook route', () => {
  beforeEach(() => {
    jest.resetModules();
    constructEvent.mockReset();
    fetchMock.mockReset();

    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.NEXT_PUBLIC_WORKER_URL = 'https://worker.example.com';
    process.env.STRIPE_FULFILL_SECRET = 'fulfill-secret';

    global.fetch = fetchMock;
  });

  it('forwards a paid checkout session to the worker fulfillment endpoint', async () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          payment_status: 'paid',
          amount_total: 3000,
          currency: 'usd',
          metadata: {
            userId: 'user-123',
            points: '300',
            source: 'pricing_page',
          },
          client_reference_id: 'user-123',
        },
      },
    });

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        points: 600,
        creditedPoints: 300,
        transactionId: 'txn_123',
      }),
      text: async () => 'ok',
    });

    const { POST } = await import('../route');
    const request = {
      text: async () => 'event-body',
      headers: new Headers({
        'stripe-signature': 'sig_test',
      }),
    } as any;

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://worker.example.com/points/stripe-fulfill',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-stripe-fulfill-secret': 'fulfill-secret',
        }),
      })
    );
  });
});
