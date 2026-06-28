'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/store';
import { formatBytes, formatNumber } from '@/lib/utils';

export default function DatabasesPage() {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); setCreating(false); return; }
      setDatabases(prev => [...prev, data.database]);
      setShowCreate(false);
      setNewName('');
    } catch { setError('Network error'); } finally { setCreating(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const s = getSession();
    try {
      const res = await fetch(`/api/databases/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${s.token}` },
      });
      if (res.ok) {
        setDatabases(prev => prev.filter(d => d.id !== deleteTarget.id));
      }
    } catch {}
    setDeleteTarget(null);
  }

  function SkeletonCard() {
    return (
      <div className="card p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl skeleton" />
            <div className="space-y-2">
              <div className="h-4 w-32 skeleton" />
              <div className="h-3 w-48 skeleton" />
            </div>
          </div>
          <div className="h-6 w-16 rounded-full skeleton" />
        </div>
        <div className="grid grid-cols-3 gap-6 mb-5">
          {[1,2,3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 skeleton" />
              <div className="h-5 w-12 skeleton" />
            </div>
          ))}
        </div>
        <div className="h-1.5 rounded-full skeleton" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Databases</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {loading ? 'Loading instances...' : `${databases.length} ${databases.length === 1 ? 'instance' : 'instances'} deployed`}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Database
          </button>
        </div>

        {/* Skeleton loading */}
        {loading ? (
          <div className="grid gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : databases.length === 0 ? (
          /* Empty state */
          <div className="card p-16 text-center slide-up">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">No databases yet</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">Create your first database to get a connection string and start building.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create Database
            </button>
          </div>
        ) : (
          /* Database list */
          <div className="grid gap-4">
            {databases.map((db, idx) => {
              const pct = Math.min(100, ((db.storageBytes || 0) / (10 * 1024 * 1024)) * 100);
              return (
                <div key={db.id} className="group relative slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                  <Link href={`/dashboard/databases/${db.id}`}
                    className="card-hover block">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                            <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-[15px] text-[var(--text-primary)]">{db.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 font-mono">{db.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="status-badge status-active">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                            Active
                          </span>
                          <svg className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 mb-5">
                        <div>
                          <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Documents</p>
                          <p className="text-base font-semibold mt-1.5 tabular-nums text-[var(--text-primary)]">{formatNumber(db.docCount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Storage</p>
                          <p className="text-base font-semibold mt-1.5 tabular-nums text-[var(--text-primary)]">{formatBytes(db.storageBytes || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Collections</p>
                          <p className="text-base font-semibold mt-1.5 tabular-nums text-[var(--text-primary)]">{formatNumber(db.collectionsCount || 0)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--info)] transition-all duration-700"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums whitespace-nowrap">{pct.toFixed(0)}% of 10 MB</span>
                      </div>
                    </div>
                  </Link>

                  {/* Delete button */}
                  <button onClick={e => { e.preventDefault(); setDeleteTarget(db); }}
                    className="absolute top-6 right-20 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[rgba(255,71,87,0.1)]"
                    title="Delete database">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!creating) { setShowCreate(false); setError(''); } }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-in" />
          <div className="relative w-full max-w-md bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-default)] p-6 shadow-2xl slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                  <svg className="w-[18px] h-[18px] text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create Database</h2>
              </div>
              <button onClick={() => { setShowCreate(false); setError(''); }}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="text-xs text-[var(--text-secondary)] font-medium block mb-2">Database Name</label>
                <input type="text" required autoFocus
                  value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all"
                  placeholder="e.g. my-app-prod" />
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">Use lowercase letters, numbers, and hyphens.</p>
              </div>
              {error && <div className="bg-[rgba(255,71,87,0.1)] border border-[rgba(255,71,87,0.2)] text-[var(--error)] text-xs rounded-lg px-4 py-3">{error}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowCreate(false); setError(''); }}
                  className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newName.trim()}
                  className="flex-1 btn-primary">
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] animate-spin" />
                      Creating...
                    </span>
                  ) : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-in" />
          <div className="relative w-full max-w-sm bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-default)] p-6 shadow-2xl text-center slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[rgba(255,71,87,0.1)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Delete database?</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              This will permanently delete <strong className="text-[var(--text-primary)]">{deleteTarget.name}</strong> and all its data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-lg bg-[var(--error)] hover:bg-[#ff6b78] text-white text-sm font-semibold transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
