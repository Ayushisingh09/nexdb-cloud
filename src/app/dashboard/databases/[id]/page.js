'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession, getToken } from '@/lib/store';
import { formatBytes, formatNumber } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const requestHistory = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  reads: Math.floor(Math.random() * 60 + 10),
  writes: Math.floor(Math.random() * 30 + 5),
}));

const latencyHistory = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  p50: Math.floor(Math.random() * 5 + 1),
  p99: Math.floor(Math.random() * 20 + 5),
}));

const collectionData = [
  { name: 'users', count: 47, color: '#6366f1' },
  { name: 'orders', count: 123, color: '#10b981' },
  { name: 'products', count: 89, color: '#f59e0b' },
  { name: 'sessions', count: 256, color: '#ef4444' },
];

const sampleDocs = [
  { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', age: 30, role: 'admin' },
  { id: 'u2', name: 'Bob Smith', email: 'bob@example.com', age: 25, role: 'user' },
  { id: 'u3', name: 'Carol Davis', email: 'carol@example.com', age: 35, role: 'editor' },
  { id: 'u4', name: 'David Wilson', email: 'david@example.com', age: 28, role: 'user' },
];

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-[10px] px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/20 transition-all flex-shrink-0">
      {copied ? 'Copied' : label || 'Copy'}
    </button>
  );
}

function SkeletonBlock({ height = 20, width = '100%', className = '' }) {
  return <div className={`rounded-lg bg-zinc-800/50 animate-pulse ${className}`} style={{ height, width }} />;
}

export default function DatabaseDetailPage({ params }) {
  const router = useRouter();
  const [db, setDb] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveLatency, setLiveLatency] = useState(0);
  const [liveOps, setLiveOps] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/login'); return; }
    setSession(s);

    async function fetchDb() {
      try {
        const res = await fetch(`/api/databases/${params.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDb(data.database);
        } else {
          router.push('/dashboard/databases');
        }
      } catch {
        const { getDatabase } = await import('@/lib/store');
        const database = getDatabase ? { id: params.id, name: 'demo', plan: 'Free', docCount: 0, storageBytes: 0, requests24h: 0, createdAt: Date.now() } : null;
        setDb(database || null);
      } finally {
        setLoading(false);
      }
    }
    fetchDb();
  }, [params.id, router]);

  useEffect(() => {
    if (!db) return;
    const token = getToken();
    if (!token) return;

    let eventSource;
    if (typeof window !== 'undefined' && window.EventSource) {
      try {
        eventSource = new EventSource(`/api/databases/${params.id}/stream?token=${token}`);
        eventSource.addEventListener('stats', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLiveLatency(data.stats?.latency || 0);
            setLiveOps(prev => prev + (data.stats?.reads || 0) + (data.stats?.writes || 0));
          } catch {}
        });
        eventSourceRef.current = eventSource;
      } catch {}
    }

    return () => { eventSource?.close(); };
  }, [db, params.id]);

  useEffect(() => {
    if (!db || (typeof window !== 'undefined' && window.EventSource)) return;
    const interval = setInterval(async () => {
      setLiveOps(prev => prev + Math.floor(Math.random() * 5));
      setLiveLatency(Math.random() * 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [db]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/databases/${params.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) router.push('/dashboard/databases');
    } catch {}
    setDeleting(false);
  }

  if (loading) return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <SkeletonBlock width={80} height={14} />
        <span>/</span>
        <SkeletonBlock width={60} height={14} />
        <span>/</span>
        <SkeletonBlock width={100} height={14} />
      </div>
      <div className="flex justify-between">
        <div className="space-y-2">
          <SkeletonBlock width={200} height={28} />
          <SkeletonBlock width={160} height={14} />
        </div>
        <SkeletonBlock width={120} height={36} className="rounded-lg" />
      </div>
      <SkeletonBlock height={120} className="rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <SkeletonBlock key={i} height={100} className="rounded-xl" />)}
      </div>
      <SkeletonBlock height={72} className="rounded-xl" />
      <div className="grid md:grid-cols-2 gap-6">
        <SkeletonBlock height={280} className="rounded-xl" />
        <SkeletonBlock height={280} className="rounded-xl" />
      </div>
    </div>
  );

  if (!db || !session) return null;

  const connStr = `nexdb://${session.user.id}_${db.id}:${db.token || 'xxxx'}@nexdb.cloud:27017/${db.name}`;
  const progress = Math.min(100, ((db.storageBytes || 0) / (10 * 1024 * 1024)) * 100);

  return (
    <div className="max-w-6xl space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/databases" className="hover:text-zinc-300 transition-colors">Databases</Link>
        <span>/</span>
        <span className="text-zinc-300">{db.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/15 flex items-center justify-center border border-indigo-500/10">
              <svg className="w-4.5 h-4.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{db.name}</h1>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">{db.id}</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span className="font-mono">{liveOps} ops/session</span>
          </div>
          <span className="text-[10px] text-zinc-500">{db.plan} Plan</span>
          <Link href="/#pricing"
            className="text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium">
            Upgrade
          </Link>
          <button onClick={() => setDeleteOpen(true)}
            className="text-xs px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Connection String */}
      <div className="glass rounded-xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
            <h2 className="text-sm font-semibold">Connection String</h2>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-black/60 rounded-xl px-5 py-4 border border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <code className="flex-1 text-sm font-mono text-zinc-300 truncate">{connStr}</code>
          <CopyButton text={connStr} label="Copy" />
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {[
            { label: 'Rust', code: `NexDb::open("${connStr}")` },
            { label: 'Node.js', code: `new NexDb("${connStr}")` },
            { label: 'Python', code: `NexDb("${connStr}")` },
            { label: 'CLI', code: `nexdb repl ${connStr}` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 border border-white/5">
              <span className="text-[10px] font-medium text-zinc-500 uppercase">{item.label}</span>
              <code className="text-[10px] font-mono text-zinc-400 truncate max-w-[200px]">{item.code}</code>
              <CopyButton text={item.code} label="Copy" />
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="glass rounded-xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            <h2 className="text-sm font-semibold">API Keys</h2>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600/25 border border-indigo-500/20 transition-all">
            Generate Key
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-black/30 border border-white/5">
            <div className="flex items-center gap-3">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              <div>
                <p className="text-xs font-medium">Default Key</p>
                <code className="text-[10px] text-zinc-500 font-mono">{db.token ? `ndb_${db.token.slice(0, 16)}...` : 'Generate a key to get started'}</code>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400">Active</span>
              <CopyButton text={db.token || ''} label="Copy" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Documents', value: formatNumber(db.docCount || 0), svg: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4', sub: 'stored documents' },
          { label: 'Storage', value: formatBytes(db.storageBytes || 0), svg: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', sub: `${progress.toFixed(0)}% of 10 MB` },
          { label: 'Requests Today', value: formatNumber(db.requests24h || 0), svg: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', sub: 'API calls (24h)' },
          { label: 'Avg Latency', value: liveLatency ? `${liveLatency.toFixed(1)}ms` : '<1ms', svg: 'M13 10V3L4 14h7v7l9-11h-7z', sub: 'p50 read latency' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-xl p-5 border border-white/5 hover:border-indigo-500/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d={stat.svg} />
              </svg>
              <span className="text-[10px] text-zinc-500">{stat.sub}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-[11px] text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Storage Bar */}
      <div className="glass rounded-xl p-5 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 className="text-sm font-semibold">Storage Usage</h3>
          </div>
          <span className="text-xs text-zinc-500">{formatBytes(db.storageBytes || 0)} / 10 MB</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-zinc-500 mt-2">{progress.toFixed(0)}% used. Upgrade for more storage.</p>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-semibold mb-1">Read / Write Requests</h3>
          <p className="text-[10px] text-zinc-500 mb-6">Last 30 days</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={requestHistory}>
                <defs>
                  <linearGradient id="reads" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                  <linearGradient id="writes" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="reads" stroke="#6366f1" strokeWidth={2} fill="url(#reads)" name="Reads" />
                <Area type="monotone" dataKey="writes" stroke="#10b981" strokeWidth={2} fill="url(#writes)" name="Writes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-semibold mb-1">Latency (ms)</h3>
          <p className="text-[10px] text-zinc-500 mb-6">Last 24 hours</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyHistory}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} interval={3} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="p50" fill="#6366f1" radius={[4,4,0,0]} name="p50" />
                <Bar dataKey="p99" fill="#a855f7" radius={[4,4,0,0]} name="p99" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Collections + Pie */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-semibold mb-4">Collections</h3>
          <div className="space-y-2">
            {collectionData.map((col, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-black/30 border border-white/5 hover:border-indigo-500/20 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-mono">{col.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400">{col.count} documents</span>
                  <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-semibold mb-4">Document Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={collectionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="count">
                  {collectionData.map((col, i) => (
                    <Cell key={i} fill={col.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {collectionData.map((col, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-[10px] text-zinc-400">{col.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Browser */}
      <div className="glass rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Data Browser</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Browse documents in the <code className="text-indigo-400">users</code> collection</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search
            </button>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600/25 border border-indigo-500/20 transition-all">
              Add Document
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['ID', 'Name', 'Email', 'Age', 'Role'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{h}</th>
                ))}
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {sampleDocs.map((doc, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-3 font-mono text-xs text-zinc-400">{doc.id}</td>
                  <td className="px-6 py-3 text-sm">{doc.name}</td>
                  <td className="px-6 py-3 text-xs text-zinc-400">{doc.email}</td>
                  <td className="px-6 py-3">{doc.age}</td>
                  <td className="px-6 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      doc.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      doc.role === 'editor' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                    }`}>{doc.role}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]" title="Edit document">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10" title="Delete document">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">Showing 4 of 47 documents</span>
          <div className="flex items-center gap-2">
            <button className="text-[10px] px-3 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-zinc-200 transition-colors">Previous</button>
            <button className="text-[10px] px-3 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-zinc-200 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="glass rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <h3 className="text-sm font-semibold">Quick Start</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { lang: 'Rust', code: [
              'use nexdb::{NexDb, Document};',
              '',
              '#[tokio::main]',
              'async fn main() {',
              '    let db = NexDb::open(',
              '        "' + connStr + '"',
              '    ).await.unwrap();',
              '',
              '    db.create_collection("users").await;',
              '    let doc = Document::from_json(',
              '        r#\x7b"name":"Alice"\x7d#',
              '    ).unwrap();',
              '    db.insert("users", "u1", doc).await;',
              '}',
            ].join('\n') },
            { lang: 'Node.js', code: [
              'const { NexDb } = require(\'nexdb\');',
              '',
              'async function main() {',
              '    const db = new NexDb("' + connStr + '");',
              '    await db.connect();',
              '    await db.createCollection(\'users\');',
              '    await db.insertAutoId(\'users\', {',
              '        name: \'Alice\'',
              '    });',
              '    const doc = await db.get(\'users\', \'u1\');',
              '    console.log(doc);',
              '    await db.close();',
              '}',
              'main();',
            ].join('\n') },
            { lang: 'Python', code: [
              'from nexdb import NexDb',
              '',
              'db = NexDb("' + connStr + '")',
              'db.create_collection("users")',
              'db.insert("users", "u1", {',
              '    "name": "Alice"',
              '})',
              'doc = db.get("users", "u1")',
              'print(doc)',
              'db.close()',
            ].join('\n') },
          ].map((item, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden border border-white/5">
              <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">{item.lang}</span>
                <CopyButton text={item.code} label="Copy" />
              </div>
              <pre className="p-4 text-[10px] font-mono text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre">{item.code}</pre>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!deleting) setDeleteOpen(false); }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm glass rounded-2xl border border-white/10 p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Delete database?</h2>
            <p className="text-sm text-zinc-400 mb-6">
              This will permanently delete <strong className="text-zinc-200">{db.name}</strong> and all its data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-medium transition-all disabled:opacity-40 shadow-lg shadow-red-600/20">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
