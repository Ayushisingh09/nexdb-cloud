'use client';
import { useState, useEffect } from 'react';
import { getSession, getToken } from '@/lib/store';
import Avatar from '@/components/Avatar';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)] hover:bg-[rgba(0,229,153,0.2)] transition-all flex items-center gap-1.5">
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          Copied
        </>
      ) : 'Copy'}
    </button>
  );
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0114 0v1"/></> },
  { id: 'keys', label: 'API Keys', icon: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/> },
  { id: 'billing', label: 'Plan & Billing', icon: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></> },
  { id: 'danger', label: 'Danger Zone', icon: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></> },
];

export default function SettingsPage() {
  const [session, setSession] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showNewKey, setShowNewKey] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

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
    <div className="max-w-5xl fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your account, API keys, and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tab rail */}
        <nav className="md:w-52 flex-shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            const danger = tab.id === 'danger';
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  active
                    ? danger
                      ? 'bg-[rgba(255,71,87,0.1)] text-[var(--error)]'
                      : 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]'
                }`}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  {tab.icon}
                </svg>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === 'profile' && (
            <div className="card p-6 slide-up">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border-subtle)]">
                <Avatar name={session.user.name} email={session.user.email} size={64} />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{session.user.name}</p>
                  <p className="text-sm text-[var(--text-tertiary)]">{session.user.email}</p>
                  <a href="https://gravatar.com" target="_blank" rel="noreferrer"
                    className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] mt-1 inline-block">
                    Change photo on Gravatar →
                  </a>
                </div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] font-medium block mb-2">Name</label>
                    <input defaultValue={session.user.name}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] font-medium block mb-2">Email</label>
                    <input defaultValue={session.user.email} readOnly
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-[var(--text-tertiary)] cursor-not-allowed" />
                  </div>
                </div>
                <button type="submit" className="btn-primary">
                  {saved ? '✓ Saved' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="card p-6 slide-up">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">API Keys</h2>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Keys used to authenticate with the NexDB API</p>
                </div>
                <button onClick={generateKey}
                  className="text-xs flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] transition-colors font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/></svg>
                  Generate Key
                </button>
              </div>

              {showNewKey && (
                <div className="mb-5 p-4 rounded-lg bg-[var(--accent-soft)] border border-[rgba(0,229,153,0.2)] fade-in">
                  <p className="text-xs text-[var(--accent-primary)] font-semibold mb-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    New API Key Generated
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">Copy this key now. You won&apos;t be able to see it again.</p>
                  <div className="flex items-center gap-3 bg-[var(--bg-primary)] rounded-lg px-4 py-3 border border-[var(--border-subtle)]">
                    <code className="flex-1 text-sm font-mono text-[var(--text-primary)] truncate">{showNewKey}</code>
                    <CopyButton text={showNewKey} />
                  </div>
                  <button onClick={() => setShowNewKey(null)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mt-2">Dismiss</button>
                </div>
              )}

              {apiKeys.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">No API keys yet. Generate one to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map(key => (
                    <div key={key.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <svg className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                        </svg>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)]">{key.label}</p>
                          <code className="text-[10px] text-[var(--text-tertiary)] font-mono truncate block">{key.key}</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] text-[var(--text-tertiary)] hidden sm:block">
                          {key.lastUsed ? `Used ${new Date(key.lastUsed).toLocaleDateString()}` : 'Never used'}
                        </span>
                        <CopyButton text={key.key} />
                        <button onClick={() => revokeKey(key.id)}
                          className="text-[10px] text-[var(--error)] hover:text-[#ff6b78] transition-colors font-medium">
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card p-6 slide-up">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Plan &amp; Billing</h2>
              <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Free Plan</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">1 database · 10 MB storage · 1K requests/day</p>
                  </div>
                </div>
                <a href="/#pricing" className="text-xs px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] transition-colors font-semibold">Upgrade</a>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="card p-6 border-[rgba(255,71,87,0.25)] slide-up">
              <h2 className="text-sm font-semibold mb-2 text-[var(--error)]">Danger Zone</h2>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">Permanently delete your account and all associated databases. This action cannot be undone.</p>
              <button className="px-5 py-2.5 rounded-lg bg-[rgba(255,71,87,0.12)] hover:bg-[rgba(255,71,87,0.2)] text-[var(--error)] border border-[rgba(255,71,87,0.25)] font-medium text-sm transition-all">
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
