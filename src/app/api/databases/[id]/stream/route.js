export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'token required' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      let running = true;

      const sendEvent = (event, data) => {
        if (!running) return;
        try {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          running = false;
        }
      };

      // Send initial snapshot
      sendEvent('connected', {
        id: params.id,
        timestamp: Date.now(),
        stats: {
          reads: Math.floor(Math.random() * 100),
          writes: Math.floor(Math.random() * 50),
          connections: Math.floor(Math.random() * 20 + 5),
          latency: Math.random() * 5,
          storage: Math.floor(Math.random() * 5 + 1),
        },
      });

      // Send live updates every 2 seconds
      const interval = setInterval(() => {
        if (!running) { clearInterval(interval); return; }
        sendEvent('stats', {
          timestamp: Date.now(),
          reads: Math.floor(Math.random() * 30),
          writes: Math.floor(Math.random() * 15),
          connections: Math.floor(Math.random() * 5 + 3),
          latency: Math.random() * 3,
          requests24h: Math.floor(Math.random() * 50 + 10),
        });
      }, 2000);

      // Keep alive
      const keepAlive = setInterval(() => {
        if (!running) { clearInterval(keepAlive); return; }
        sendEvent('keepalive', { time: Date.now() });
      }, 30000);

      request.signal.addEventListener('abort', () => {
        running = false;
        clearInterval(interval);
        clearInterval(keepAlive);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
  });
}
