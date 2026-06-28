'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/store';
import { formatBytes, formatNumber, timeAgo } from '@/lib/utils';

export default function DatabasesPage() {
  const [databases, setDatabases] = useState([]);

  useEffect(() => {
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
      } catch {}
    }
    fetchDatabases();
  }, []);

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Databases</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your NexDb instances.</p>
      </div>

      {/* Upgrade banner */}
      {databases.length <= 1 && (
        <div className="glass rounded-xl p-5 border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <p className="text-sm font-medium">Need more databases?</p>
              <p className="text-xs text-zinc-400 mt-0.5">Upgrade to Starter for 5 databases, more storage, and priority support.</p>
            </div>
          </div>
          <Link href="/#pricing"
            className="text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium flex-shrink-0">
            View Plans
          </Link>
        </div>
      )}

      {databases.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center border border-white/5">
          <p className="text-4xl mb-4">▣</p>
          <p className="text-zinc-400 text-sm">No databases yet.</p>
          <p className="text-xs text-zinc-500 mt-1">Create one to get your connection string.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {databases.map(db => {
            const progress = Math.min(100, ((db.storageBytes || 0) / (10 * 1024 * 1024)) * 100);
            return (
              <Link key={db.id} href={`/dashboard/databases/${db.id}`}
                className="glass rounded-xl p-6 border border-white/5 hover:border-indigo-500/20 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/15 flex items-center justify-center text-2xl text-indigo-400">▣</div>
                    <div>
                      <p className="font-semibold">{db.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 font-mono">{db.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">● Active</span>
                    <span className="text-indigo-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Documents</p>
                    <p className="text-sm font-semibold mt-1">{formatNumber(db.docCount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Storage</p>
                    <p className="text-sm font-semibold mt-1">{formatBytes(db.storageBytes || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Requests (24h)</p>
                    <p className="text-sm font-semibold mt-1">{formatNumber(db.requests24h || 0)}</p>
                  </div>
                </div>

                {/* Storage bar */}
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                    style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5">{progress.toFixed(0)}% of 10 MB used</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
