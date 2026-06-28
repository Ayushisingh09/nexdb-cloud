'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/store';
import { formatBytes, formatNumber } from '@/lib/utils';

export default function DatabasesPage() {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function fetchDatabases() {
    const s = getSession();
    if (!s) return;
    try {
      const res = await fetch('/api/databases', {
        headers: { Authorization: `Bearer ${s.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDatabases(data.databases || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDatabases(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError('');
    const s = getSession();
    try {
      const res = await fetch('/api/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.token}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create'); setCreating(false); return; }
      setDatabases(prev => [...prev, data.database]);
      setShowModal(false);
      setNewName('');
    } catch { setError('Network error'); } finally { setCreating(false); }
  }

  return (
    <>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Databases</h1>
            <p className="text-sm text-zinc-400 mt-1">{databases.length} {databases.length === 1 ? 'instance' : 'instances'} deployed</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all shadow-lg shadow-indigo-600/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Database
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : databases.length === 0 ? (
          /* Empty state */
          <div className="glass rounded-2xl border border-white/5 p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No databases yet</h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">Create your first database to get a connection string and start building.</p>
            <button onClick={() => setShowModal(true)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all">
              Create Database
            </button>
          </div>
        ) : (
          /* Database list */
          <div className="grid gap-4">
            {databases.map(db => {
              const pct = Math.min(100, ((db.storageBytes || 0) / (10 * 1024 * 1024)) * 100);
              return (
                <Link key={db.id} href={`/dashboard/databases/${db.id}`}
                  className="glass rounded-2xl border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.02] transition-all group block">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-indigo-600/15 flex items-center justify-center border border-indigo-500/10">
                          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-[15px]">{db.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 font-mono">{db.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full bg-emerald-500/8 text-emerald-400 border border-emerald-500/15">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                        <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-5">
                      <div>
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Documents</p>
                        <p className="text-base font-semibold mt-1.5 tabular-nums">{formatNumber(db.docCount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Storage</p>
                        <p className="text-base font-semibold mt-1.5 tabular-nums">{formatBytes(db.storageBytes || 0)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Requests / 24h</p>
                        <p className="text-base font-semibold mt-1.5 tabular-nums">{formatNumber(db.requests24h || 0)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] text-zinc-500 tabular-nums whitespace-nowrap">{pct.toFixed(0)}% of 10 MB</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!creating) { setShowModal(false); setError(''); } }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md glass rounded-2xl border border-white/10 p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Create Database</h2>
              <button onClick={() => { setShowModal(false); setError(''); }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-2">Database Name</label>
                <input type="text" required autoFocus
                  value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="e.g. my-app-prod" />
                <p className="text-[11px] text-zinc-500 mt-1.5">Use lowercase letters, numbers, and hyphens.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-4 py-3">{error}</div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/20">
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Creating...
                    </span>
                  ) : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
