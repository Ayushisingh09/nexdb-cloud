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

const STAT_ICONS = {
  Databases: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
    </>
  ),
  Documents: (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </>
  ),
  Storage: (
    <>
      <rect x="2" y="3" width="20" height="6" rx="1"/>
      <rect x="2" y="9" width="20" height="6" rx="1"/>
      <rect x="2" y="15" width="20" height="6" rx="1"/>
      <path d="M6 6h.01M6 12h.01M6 18h.01"/>
    </>
  ),
  'Requests Today': (
    <>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </>
  ),
};

const STAT_COLORS = {
  indigo: 'var(--accent-primary)',
  emerald: 'var(--success)',
  purple: 'var(--info)',
  amber: 'var(--warning)',
};

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
    }
  }, []);

  // Fetch actual databases with live stats
  useEffect(() => {
    if (!session) return;
    async function fetchDbs() {
      try {
        const res = await fetch('/api/databases', {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDatabases(data.databases || []);
        }
      } catch {}
    }
    fetchDbs();
  }, [session]);

  // Connect to aggregated SSE stream for real-time stats
  useEffect(() => {
    if (!session) return;
    const es = new EventSource(`/api/stats/stream?userId=${session.user.id}`);

    es.addEventListener('stats', (e) => {
      try {
        const data = JSON.parse(e.data);
        setLiveStats({ reads: data.reads, writes: data.writes, latency: 0 });
        if (data.chartData && data.chartData.length > 0) {
          setChartData(data.chartData);
        }
      } catch {}
    });

    es.addEventListener('connected', (e) => {
      try {
        const data = JSON.parse(e.data);
        setLiveStats({ reads: data.stats.reads, writes: data.stats.writes, latency: 0 });
      } catch {}
    });

    return () => es.close();
  }, [session]);

  if (!session) return null;

  const totalDocs = databases.reduce((a, d) => a + (d.docCount || 0), 0);
  const totalStorage = databases.reduce((a, d) => a + (d.storageBytes || 0), 0);
  const totalCollections = databases.reduce((a, d) => a + (d.collectionsCount || 0), 0);

  const stats = [
    { label: 'Databases', value: databases.length, color: 'indigo' },
    { label: 'Documents', value: formatNumber(totalDocs), color: 'emerald' },
    { label: 'Storage', value: formatBytes(totalStorage), color: 'purple' },
    { label: 'Collections', value: formatNumber(totalCollections), color: 'amber' },
  ];

  return (
    <div className="max-w-6xl space-y-8 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Overview</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Welcome back, <span className="text-[var(--text-primary)] font-medium">{session.user.name}</span>.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span className="status-badge status-active">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            Live
          </span>
          <span className="font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Live stats bar */}
      <div className="card px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
        <span className="text-xs text-[var(--text-tertiary)] font-mono uppercase tracking-wider">Realtime</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
          <span className="text-[var(--text-secondary)]"><span className="text-[var(--text-primary)] font-semibold tabular-nums">{liveStats.reads}</span> reads</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--info)] animate-pulse" />
          <span className="text-[var(--text-secondary)]"><span className="text-[var(--text-primary)] font-semibold tabular-nums">{liveStats.writes}</span> writes</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
          </svg>
          <span className="text-[var(--text-secondary)]"><span className="text-[var(--text-primary)] font-semibold tabular-nums">{liveStats.latency.toFixed(1)}</span>ms latency</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card-hover p-5 slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                <svg className="w-[18px] h-[18px]" style={{ color: STAT_COLORS[stat.color] }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  {STAT_ICONS[stat.label]}
                </svg>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Request Volume</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-6">Last 14 days across all databases</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e599" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00e599" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#696974', fontSize: 10 }} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#696974', fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ background: '#16161d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#00e599" strokeWidth={2} fill="url(#reqGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Live Activity</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-6">Recent operations across your databases</p>
          <div className="space-y-3.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i % 3 === 0 ? 'bg-[var(--accent-primary)]' : i % 3 === 1 ? 'bg-[var(--info)]' : 'bg-[var(--warning)]'}`} />
                <span className={`font-mono font-medium px-1.5 py-0.5 rounded text-[10px] ${i % 3 === 0 ? 'text-[var(--accent-primary)] bg-[var(--accent-soft)]' : i % 3 === 1 ? 'text-[var(--info)] bg-[rgba(0,212,255,0.1)]' : 'text-[var(--warning)] bg-[rgba(255,176,32,0.1)]'}`}>
                  {i % 3 === 0 ? 'READ' : i % 3 === 1 ? 'WRITE' : 'QUERY'}
                </span>
                <span className="text-[var(--text-secondary)] font-mono">
                  {['users.findById', 'orders.insert', 'products.search', 'sessions.create', 'analytics.count', 'users.update'][i]}
                </span>
                <span className="text-[var(--text-tertiary)] ml-auto tabular-nums">{i + 1}s ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Databases list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Databases</h2>
          <Link href="/dashboard/databases"
            className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1 group">
            View All
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {databases.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-[var(--text-secondary)] text-sm">No databases yet. They appear here after creation.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {databases.slice(0, 5).map((db, idx) => (
              <Link key={db.id} href={`/dashboard/databases/${db.id}`}
                className="card-hover p-5 flex items-center justify-between group slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text-primary)]">{db.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 tabular-nums">{formatNumber(db.docCount || 0)} docs · {formatBytes(db.storageBytes || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-[var(--text-tertiary)]">{timeAgo(db.createdAt)}</span>
                  <svg className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
