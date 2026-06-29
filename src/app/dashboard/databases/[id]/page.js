'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession, getToken } from '@/lib/store';
import { formatBytes, formatNumber } from '@/lib/utils';

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-[10px] px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)] hover:bg-[rgba(0,229,153,0.2)] transition-all flex-shrink-0">
      {copied ? 'Copied' : label || 'Copy'}
    </button>
  );
}

function SkeletonBlock({ height = 20, width = '100%', className = '' }) {
  return <div className={`rounded-lg bg-zinc-800/50 animate-pulse ${className}`} style={{ height, width }} />;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'browser', label: 'Data Browser', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
  { id: 'monitor', label: 'Monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'danger', label: 'Danger Zone', icon: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', danger: true },
];

export default function DatabaseDetailPage({ params }) {
  const router = useRouter();
  const [db, setDb] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [colLoading, setColLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [showCreateCol, setShowCreateCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [creatingCol, setCreatingCol] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocJson, setNewDocJson] = useState('{\n  \n}');
  const [addingDoc, setAddingDoc] = useState(false);
  const [docError, setDocError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);

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
          setRenameValue(data.database.name);
        } else {
          router.push('/dashboard/databases');
        }
      } catch {
        router.push('/dashboard/databases');
      } finally {
        setLoading(false);
      }
    }
    fetchDb();
  }, [params.id, router]);

  useEffect(() => {
    if (!db) return;
    async function fetchCollections() {
      setColLoading(true);
      try {
        const res = await fetch(`/api/databases/${params.id}/collections`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCollections(data.collections || []);
        }
      } catch {} finally {
        setColLoading(false);
      }
    }
    fetchCollections();
  }, [db, params.id]);

  useEffect(() => {
    if (!selectedCollection || !db) return;
    async function fetchDocs() {
      setDocsLoading(true);
      try {
        const res = await fetch(`/api/databases/${params.id}/documents?collectionId=${selectedCollection.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch {} finally {
        setDocsLoading(false);
      }
    }
    fetchDocs();
  }, [selectedCollection, db, params.id]);

  function refreshDb() {
    fetch(`/api/databases/${params.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.ok && r.json()).then(d => d && setDb(d.database));
  }

  async function handleToggleStatus() {
    setTogglingStatus(true);
    const newStatus = db.status === 'paused' ? 'active' : 'paused';
    try {
      const res = await fetch(`/api/databases/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setDb(data.database);
      }
    } catch {} finally {
      setTogglingStatus(false);
    }
  }

  async function handleRename(e) {
    e.preventDefault();
    const name = renameValue.trim();
    if (!name || name === db.name) { setRenameOpen(false); return; }
    setRenaming(true);
    try {
      const res = await fetch(`/api/databases/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setDb(data.database);
        setRenameOpen(false);
      }
    } catch {} finally {
      setRenaming(false);
    }
  }

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

  async function handleCreateCol(e) {
    e.preventDefault();
    const name = newColName.trim();
    if (!name) return;
    setCreatingCol(true);
    try {
      const res = await fetch(`/api/databases/${params.id}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(prev => [...prev, data.collection]);
        setSelectedCollection(data.collection);
        setShowCreateCol(false);
        setNewColName('');
      }
    } catch {} finally {
      setCreatingCol(false);
    }
  }

  async function handleAddDoc(e) {
    e.preventDefault();
    if (!selectedCollection) return;
    setDocError('');
    let parsed;
    try { parsed = JSON.parse(newDocJson); } catch { setDocError('Invalid JSON'); return; }
    setAddingDoc(true);
    try {
      const res = await fetch(`/api/databases/${params.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ collectionId: selectedCollection.id, data: parsed }),
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => [...prev, data.document]);
        setShowAddDoc(false);
        setNewDocJson('{\n  \n}');
        refreshDb();
      } else {
        const err = await res.json();
        setDocError(err.error || 'Failed');
      }
    } catch { setDocError('Network error'); } finally { setAddingDoc(false); }
  }

  async function handleDeleteDoc(docId) {
    if (!selectedCollection) return;
    try {
      const res = await fetch(`/api/databases/${params.id}/documents/${docId}?collectionId=${selectedCollection.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        refreshDb();
      }
    } catch {}
  }

  if (loading) return (
    <div className="max-w-7xl space-y-8">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <SkeletonBlock width={80} height={14} /><span>/</span><SkeletonBlock width={60} height={14} /><span>/</span><SkeletonBlock width={100} height={14} />
      </div>
      <div className="flex justify-between">
        <div className="space-y-2"><SkeletonBlock width={200} height={28} /><SkeletonBlock width={160} height={14} /></div>
        <SkeletonBlock width={120} height={36} />
      </div>
      <SkeletonBlock height={200} />
    </div>
  );

  if (!db || !session) return null;

  const isPaused = db.status === 'paused';
  const connStr = `nexdb://${session.user.id}_${db.id}:${db.token || 'xxxx'}@nexdb.cloud:27017/${db.name}`;
  const progress = Math.min(100, ((db.storageBytes || 0) / (10 * 1024 * 1024)) * 100);
  const totalDocs = db.docCount || 0;
  const totalStorage = db.storageBytes || 0;

  const STATS = [
    { label: 'Documents', value: formatNumber(totalDocs), change: '+0 this hour', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
    { label: 'Storage', value: formatBytes(totalStorage), change: `${progress.toFixed(0)}% of 10 MB`, icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Collections', value: formatNumber(collections.length), change: `${collections.length} total`, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { label: 'Plan', value: db.plan || 'Free', change: `${formatBytes(totalStorage)} used`, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  ];

  return (
    <div className="max-w-7xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/databases" className="hover:text-zinc-300 transition-colors">Databases</Link>
        <span>/</span>
        <span className="text-zinc-300">{db.name}</span>
      </div>

      {/* Paused banner */}
      {isPaused && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>This database is <strong>paused</strong>. Read operations still work, but writes are blocked.</span>
          <button onClick={handleToggleStatus} disabled={togglingStatus}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-all disabled:opacity-40">
            Resume
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isPaused ? 'bg-amber-500/10' : 'bg-[var(--accent-soft)]'}`}>
            <svg className={`w-5 h-5 ${isPaused ? 'text-amber-400' : 'text-[var(--accent-primary)]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{db.name}</h1>
              <span className={`text-[10px] font-mono px-2 py-1 rounded-full flex items-center gap-1 ${
                isPaused
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'} ${isPaused ? '' : 'animate-pulse'}`} />
                {isPaused ? 'Paused' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">{db.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={handleToggleStatus} disabled={togglingStatus}
            className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg border transition-all disabled:opacity-40 ${
              isPaused
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d={isPaused ? 'M5 3l14 9L5 21V3z' : 'M6 4h4v16H6zM14 4h4v16h-4z'} />
            </svg>
            {togglingStatus ? '...' : isPaused ? 'Start' : 'Stop'}
          </button>
          <span className="text-[10px] text-zinc-500 px-1">{db.plan}</span>
          <Link href="/#pricing"
            className="text-xs px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] transition-colors font-semibold">
            Upgrade
          </Link>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-black/30 border border-white/[0.06] overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? tab.danger
                  ? 'bg-red-500/15 text-red-400 shadow-sm'
                  : 'bg-[var(--accent-soft)] text-[var(--accent-primary)] shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
            }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <div key={i} className="glass rounded-xl p-5 border border-white/5 hover:border-[var(--border-default)] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d={stat.icon} />
                  </svg>
                  <span className="text-[10px] text-zinc-500">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3 className="text-sm font-semibold">Storage Usage</h3>
              </div>
              <span className="text-xs text-zinc-500">{formatBytes(totalStorage)} / 10 MB</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--info)] transition-all duration-1000"
                style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">{progress.toFixed(0)}% used. Upgrade for more storage.</p>
          </div>

          <div className="glass rounded-xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
              <h2 className="text-sm font-semibold">Connection String</h2>
            </div>
            <div className="flex items-center gap-3 bg-black/60 rounded-xl px-5 py-4 border border-white/5">
              <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'} flex-shrink-0`} />
              <code className="flex-1 text-sm font-mono text-zinc-300 truncate">{connStr}</code>
              <CopyButton text={connStr} label="Copy" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'browser' && (
        <div className="grid md:grid-cols-4 gap-6">
          <div className="glass rounded-xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Collections</h3>
              <button onClick={() => setShowCreateCol(true)}
                className="text-[10px] px-2 py-1 rounded bg-[var(--accent-soft)] text-[var(--accent-primary)] hover:bg-[rgba(0,229,153,0.2)] transition-all">
                + New
              </button>
            </div>
            <div className="p-2">
              {colLoading ? (
                <div className="space-y-1 p-2">
                  {[1,2,3].map(i => <SkeletonBlock key={i} height={32} className="rounded-lg" />)}
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <svg className="w-8 h-8 mx-auto mb-2 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  <p className="text-xs text-zinc-500">No collections yet</p>
                  <button onClick={() => setShowCreateCol(true)}
                    className="text-[10px] mt-2 px-3 py-1.5 rounded bg-[var(--accent-soft)] text-[var(--accent-primary)] hover:bg-[rgba(0,229,153,0.2)] transition-all">
                    Create your first
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {collections.map(col => (
                    <button key={col.id} onClick={() => setSelectedCollection(col)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left ${
                        selectedCollection?.id === col.id
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                      }`}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                      <span className="truncate flex-1">{col.name}</span>
                      <span className="text-[10px] text-zinc-500 tabular-nums">{col.docCount || 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-3 glass rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Data Browser</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {selectedCollection
                    ? `Browsing documents in ${selectedCollection.name}`
                    : 'Select a collection to browse documents'}
                </p>
              </div>
              {selectedCollection && (
                <button onClick={() => { setShowAddDoc(true); setDocError(''); }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)] hover:bg-[rgba(0,229,153,0.2)] transition-all flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Document
                </button>
              )}
            </div>

            {!selectedCollection ? (
              <div className="py-16 text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <p className="text-sm text-zinc-500">Select or create a collection to view documents</p>
              </div>
            ) : docsLoading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <SkeletonBlock key={i} height={48} className="rounded-lg" />)}
              </div>
            ) : documents.length === 0 ? (
              <div className="py-16 text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p className="text-sm text-zinc-400 mb-1">No documents in this collection</p>
                <p className="text-xs text-zinc-500 mb-5">Add a document to get started</p>
                <button onClick={() => { setShowAddDoc(true); setDocError(''); }}
                  className="text-xs px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] font-semibold transition-colors">
                  Add Document
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-5 py-3 text-[10px] text-zinc-500 uppercase tracking-wider font-medium w-20">ID</th>
                      <th className="text-left px-5 py-3 text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Data</th>
                      <th className="text-left px-5 py-3 text-[10px] text-zinc-500 uppercase tracking-wider font-medium w-28">Created</th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => {
                      const jsonStr = JSON.stringify(doc.data, null, 2);
                      const truncated = jsonStr.length > 120 ? jsonStr.slice(0, 120) + '...' : jsonStr;
                      return (
                        <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <td className="px-5 py-3 font-mono text-[11px] text-zinc-500 align-top pt-4 whitespace-nowrap">{doc.id}</td>
                          <td className="px-5 py-3">
                            <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed">{truncated}</pre>
                          </td>
                          <td className="px-5 py-3 text-[11px] text-zinc-500 align-top pt-4 whitespace-nowrap">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-3 align-top pt-4">
                            <button onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                              title="Delete document">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <div className="glass rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold">Database Name</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">The name used to identify this database.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-sm font-mono text-zinc-300 bg-black/40 rounded-lg px-4 py-3 border border-white/5">{db.name}</code>
              <button onClick={() => setRenameOpen(!renameOpen)}
                className="text-xs px-4 py-2 rounded-lg border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-all">
                Rename
              </button>
            </div>
            {renameOpen && (
              <form onSubmit={handleRename} className="mt-4 flex items-center gap-3">
                <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600"
                  placeholder="New name" autoFocus />
                <button type="submit" disabled={renaming || !renameValue.trim()}
                  className="text-xs px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] font-semibold transition-all disabled:opacity-40">
                  {renaming ? '...' : 'Save'}
                </button>
                <button type="button" onClick={() => setRenameOpen(false)}
                  className="text-xs px-4 py-2.5 rounded-lg border border-white/10 text-zinc-400 hover:text-zinc-200 transition-all">
                  Cancel
                </button>
              </form>
            )}
          </div>

          <div className="glass rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold">Plan</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Your current subscription plan.</p>
              </div>
              <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">{db.plan}</span>
            </div>
            <div className="flex items-center gap-3 bg-black/30 rounded-lg px-4 py-3 border border-white/5">
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs text-zinc-400">Free plan includes 10 MB storage. Upgrade for more storage and higher rate limits.</p>
              <Link href="/#pricing" className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] font-semibold transition-all flex-shrink-0">
                Upgrade
              </Link>
            </div>
          </div>

          <div className="glass rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">API Keys</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Keys used to authenticate API requests.</p>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)] hover:bg-[rgba(0,229,153,0.2)] transition-all">
                Generate Key
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-black/30 border border-white/5">
              <div className="flex items-center gap-3">
                <svg className="w-3.5 h-3.5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
      )}

      {activeTab === 'monitor' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-semibold mb-1">Request Volume</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Last 14 days</p>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <p className="text-sm text-zinc-500">No data yet</p>
                <p className="text-xs text-zinc-600 mt-1">Metrics will appear as you use the database</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-semibold mb-1">Recent Activity</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Latest operations</p>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-10 h-10 mx-auto mb-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  <p className="text-sm text-zinc-500">No activity yet</p>
                </div>
              ) : (
                documents.slice(0, 10).map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0" />
                    <span className="font-mono font-medium px-1.5 py-0.5 rounded text-[10px] text-[var(--accent-primary)] bg-[var(--accent-soft)]">WRITE</span>
                    <span className="text-zinc-400 font-mono text-[10px]">{selectedCollection?.name || '?'}</span>
                    <span className="text-zinc-600 ml-auto">{timeAgo(doc.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'danger' && (
        <div className="max-w-lg space-y-6">
          <div className="glass rounded-xl p-6 border border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Irreversible actions for this database.</p>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <div>
                <p className="text-sm font-medium">Delete this database</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Permanently delete <strong className="text-zinc-300">{db.name}</strong> and all its data.</p>
              </div>
              <button onClick={() => setDeleteOpen(true)}
                className="text-xs px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-all flex-shrink-0">
                Delete Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}

      {showCreateCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!creatingCol) { setShowCreateCol(false); setNewColName(''); } }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm glass rounded-2xl border border-white/10 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Create Collection</h2>
            <form onSubmit={handleCreateCol} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-2">Collection Name</label>
                <input type="text" required autoFocus
                  value={newColName} onChange={e => setNewColName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors"
                  placeholder="e.g. users" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowCreateCol(false); setNewColName(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={creatingCol || !newColName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] text-sm font-semibold transition-all disabled:opacity-40">
                  {creatingCol ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!addingDoc) { setShowAddDoc(false); setDocError(''); } }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg glass rounded-2xl border border-white/10 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-1">Add Document</h2>
            <p className="text-xs text-zinc-500 mb-4">Insert into <code className="text-[var(--accent-primary)]">{selectedCollection?.name}</code></p>
            <form onSubmit={handleAddDoc} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-2">Document Data (JSON)</label>
                <textarea rows={8} required autoFocus
                  value={newDocJson} onChange={e => setNewDocJson(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-300 placeholder-zinc-600 transition-colors resize-none"
                  placeholder='{"key": "value"}' />
              </div>
              {docError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-4 py-3">{docError}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowAddDoc(false); setDocError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={addingDoc}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] text-sm font-semibold transition-all disabled:opacity-40">
                  {addingDoc ? 'Adding...' : 'Add Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
