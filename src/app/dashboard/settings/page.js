'use client';
import { useState, useEffect } from 'react';
import { getSession, getToken } from '@/lib/store';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/20 transition-all">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default function SettingsPage() {
  const [session, setSession] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showNewKey, setShowNewKey] = useState(null);

  useEffect(() => {
    const s = getSession();
    if (s) setSession(s);
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    try {
      const res = await fetch('/api/keys', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch {}
  }

  async function generateKey() {
    const label = prompt('Enter a label for this API key:');
    if (!label) return;
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ label }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowNewKey(data.key.key);
        loadApiKeys();
      }
    } catch {}
  }

  async function revokeKey(id) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id }),
      });
      loadApiKeys();
    } catch {}
  }

  if (!session) return null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your account, API keys, and preferences.</p>
      </div>

      {/* Profile */}
      <div className="glass rounded-xl p-6 border border-white/5">
        <h2 className="text-sm font-semibold mb-4">Profile</h2>
        <form onSubmit={(e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-2">Name</label>
              <input defaultValue={session.user.name}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-2">Email</label>
              <input defaultValue={session.user.email}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-not-allowed" readOnly />
            </div>
          </div>
          <button type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm transition-all shadow-lg shadow-indigo-600/20">
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* API Keys */}
      <div className="glass rounded-xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">API Keys</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Keys used to authenticate with the NexDb API</p>
          </div>
          <button onClick={generateKey}
            className="text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium">
            + Generate Key
          </button>
        </div>

        {showNewKey && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-medium mb-2">🎉 New API Key Generated</p>
            <p className="text-xs text-zinc-400 mb-3">Copy this key now. You won&apos;t be able to see it again.</p>
            <div className="flex items-center gap-3 bg-black/40 rounded-lg px-4 py-3 border border-white/5">
              <code className="flex-1 text-sm font-mono text-zinc-200">{showNewKey}</code>
              <CopyButton text={showNewKey} />
            </div>
            <button onClick={() => setShowNewKey(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300 mt-2">Dismiss</button>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <div className="p-6 text-center text-sm text-zinc-500">
            No API keys yet. Generate one to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {apiKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-black/30 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-indigo-400 text-sm">🔑</span>
                  <div>
                    <p className="text-xs font-medium">{key.label}</p>
                    <code className="text-[10px] text-zinc-500 font-mono">{key.key}</code>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500">
                    {key.lastUsed ? `Used ${new Date(key.lastUsed).toLocaleDateString()}` : 'Never used'}
                  </span>
                  <CopyButton text={key.key} />
                  <button onClick={() => revokeKey(key.id)}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan */}
      <div className="glass rounded-xl p-6 border border-white/5">
        <h2 className="text-sm font-semibold mb-4">Plan &amp; Billing</h2>
        <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
          <div>
            <p className="font-medium">Free Plan</p>
            <p className="text-xs text-zinc-500 mt-1">1 database · 10 MB storage · 1K requests/day</p>
          </div>
          <a href="/#pricing" className="text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium">Upgrade</a>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-xl p-6 border border-red-500/20">
        <h2 className="text-sm font-semibold mb-4 text-red-400">Danger Zone</h2>
        <p className="text-xs text-zinc-500 mb-4">Permanently delete your account and all associated databases.</p>
        <button className="px-6 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 font-medium text-sm transition-all">
          Delete Account
        </button>
      </div>
    </div>
  );
}
