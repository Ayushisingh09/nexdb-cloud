import { getUserDatabases, getDatabaseStats } from '@/lib/db';
import { getMetrics, getAggregatedDailyHistory } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), {
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
          const dbs = getUserDatabases(userId);
          const dbIds = dbs.map(d => d.id);

          let totalReads = 0, totalWrites = 0, totalDocs = 0, totalStorage = 0;
          for (const dbId of dbIds) {
            const [m, s] = await Promise.all([
              getMetrics(dbId),
              getDatabaseStats(dbId),
            ]);
            totalReads += m.reads;
            totalWrites += m.writes;
            totalDocs += s.docCount || 0;
            totalStorage += s.storageBytes || 0;
          }

          const chartData = getAggregatedDailyHistory(dbIds);

          sendEvent('stats', {
            timestamp: Date.now(),
            reads: totalReads,
            writes: totalWrites,
            docs: totalDocs,
            storage: totalStorage,
            chartData,
          });
        } catch {}
      };

      (async () => {
        try {
          const dbs = getUserDatabases(userId);
          const dbIds = dbs.map(d => d.id);

          let totalReads = 0, totalWrites = 0, totalDocs = 0, totalStorage = 0;
          for (const dbId of dbIds) {
            const [m, s] = await Promise.all([
              getMetrics(dbId),
              getDatabaseStats(dbId),
            ]);
            totalReads += m.reads;
            totalWrites += m.writes;
            totalDocs += s.docCount || 0;
            totalStorage += s.storageBytes || 0;
          }

          sendEvent('connected', {
            timestamp: Date.now(),
            stats: {
              reads: totalReads,
              writes: totalWrites,
              docs: totalDocs,
              storage: totalStorage,
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
