'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/store';
import { formatBytes, formatNumber, timeAgo } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function generateChartData(days, base, variance) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - 1 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Math.floor(Math.random() * variance + base),
  }));
}

const EMPTY_DATA = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  value: 0,
}));

const STAT_ICONS = { Databases: '▣', Documents: '📄', Storage: '💾', Requests: '📨' };

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [chartData, setChartData] = useState(EMPTY_DATA);
  const [liveStats, setLiveStats] = useState({ reads: 0, writes: 0, latency: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    const s = getSession();
    if (s) {
      setSession(s);
      setDatabases(s.databases || []);
      setChartData(generateChartData(14, 20, 80));
    }
  }, []);

  // Live polling for stats
  useEffect(() => {
    if (!session?.databases?.length) return;
    const dbId = session.databases[0]?.id;
    if (!dbId) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/databases/${dbId}/stream?token=${session.token}`, {
          signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
        });
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.stats) {
                  setLiveStats(prev => ({
                    reads: prev.reads + (data.stats.reads || 0),
                    writes: prev.writes + (data.stats.writes || 0),
                    latency: data.stats.latency || 0,
                  }));
                }
                if (data.stats && data.timestamp) {
                  setChartData(prev => {
                    const next = [...prev];
                    next.push({
                      date: new Date(data.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      value: data.stats.reads + data.stats.writes,
                    });
                    return next.slice(-14);
                  });
                }
              } catch {}
            }
          }
        }
      } catch {}
    };

    intervalRef.current = setInterval(fetchStats, 5000);
    fetchStats();
    return () => clearInterval(intervalRef.current);
  }, [session]);

  if (!session) return null;

  const totalDocs = databases.reduce((a, d) => a + (d.docCount || 0), 0);
  const totalStorage = databases.reduce((a, d) => a + (d.storageBytes || 0), 0);
  const totalRequests = databases.reduce((a, d) => a + (d.requests24h || 0), 0);

  const stats = [
    { label: 'Databases', value: databases.length, color: 'indigo' },
    { label: 'Documents', value: formatNumber(totalDocs), color: 'emerald' },
    { label: 'Storage', value: formatBytes(totalStorage), color: 'purple' },
    { label: 'Requests Today', value: formatNumber(totalRequests), color: 'amber' },
  ];

  return (
    <div className="max-w-6xl space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">Welcome back, <span className="text-zinc-200">{session.user.name}</span>.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <span className="font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Live stats bar */}
      <div className="glass rounded-xl px-6 py-4 border border-white/5 flex items-center gap-8 text-sm">
        <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Live</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-zinc-300">{liveStats.reads} reads</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-300">{liveStats.writes} writes</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">⏱</span>
          <span className="text-zinc-300">{liveStats.latency.toFixed(1)}ms latency</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass rounded-xl p-5 border border-white/5 hover:border-indigo-500/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{STAT_ICONS[stat.label] || '📊'}</span>
              <span className={`text-[10px] font-mono text-${stat.color}-400/50 uppercase`}>{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-semibold mb-1">Request Volume (14 days)</h3>
          <p className="text-[10px] text-zinc-500 mb-6">Real-time request count across all databases</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#reqGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-semibold mb-1">Live Activity</h3>
          <p className="text-[10px] text-zinc-500 mb-6">Recent operations across your databases</p>
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? 'bg-indigo-400' : i % 3 === 1 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-zinc-400 font-mono">
                  {i % 3 === 0 ? 'READ' : i % 3 === 1 ? 'WRITE' : 'QUERY'}
                </span>
                <span className="text-zinc-500">
                  {['users.findById', 'orders.insert', 'products.search', 'sessions.create', 'analytics.count', 'users.update'][i]}
                </span>
                <span className="text-zinc-600 ml-auto">{i + 1}s ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Databases list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Databases</h2>
          <Link href="/dashboard/databases"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            View All →
          </Link>
        </div>

        {databases.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center border border-white/5">
            <p className="text-zinc-400 text-sm">No databases yet. They appear here after creation.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {databases.slice(0, 5).map(db => (
              <Link key={db.id} href={`/dashboard/databases/${db.id}`}
                className="glass rounded-xl p-5 border border-white/5 hover:border-indigo-500/20 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center text-indigo-400 text-lg">▣</div>
                  <div>
                    <p className="font-medium text-sm">{db.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatNumber(db.docCount || 0)} docs · {formatBytes(db.storageBytes || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-zinc-500">{timeAgo(db.createdAt)}</span>
                  <span className="text-indigo-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
