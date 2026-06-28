import { getDatabaseStats } from '@/lib/db';
import { getMetrics, getDailyHistory } from '@/lib/metrics';

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

      const tick = async () => {
        if (!running) return;
        try {
          const [stats, metrics, history] = await Promise.all([
            getDatabaseStats(params.id),
            getMetrics(params.id),
            getDailyHistory(params.id),
          ]);

          sendEvent('stats', {
            timestamp: Date.now(),
            reads: metrics.reads,
            writes: metrics.writes,
            docCount: stats.docCount,
            storageBytes: stats.storageBytes,
            chartData: history,
          });
        } catch {
          // Database might not exist yet
        }
      };

      // Send initial snapshot
      (async () => {
        try {
          const [stats, metrics] = await Promise.all([
            getDatabaseStats(params.id),
            getMetrics(params.id),
          ]);
          sendEvent('connected', {
            id: params.id,
            timestamp: Date.now(),
            stats: {
              reads: metrics.reads,
              writes: metrics.writes,
              docCount: stats.docCount,
              storageBytes: stats.storageBytes,
            },
          });
        } catch {}
      })();

      const interval = setInterval(tick, 5000);

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
