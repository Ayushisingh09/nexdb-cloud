'use client';
import Link from 'next/link';
import { useState } from 'react';

const plans = [
  { name: 'Free', price: '$0', docs: '100', storage: '10 MB', requests: '1K/day', features: ['1 Database', 'Basic Analytics', 'Community Support'] },
  { name: 'Starter', price: '$9', docs: '10K', storage: '100 MB', requests: '10K/day', features: ['5 Databases', 'Real-time Analytics', 'Email Support', 'Indexes'], popular: false },
  { name: 'Pro', price: '$29', docs: '100K', storage: '1 GB', requests: '100K/day', features: ['25 Databases', 'Advanced Analytics', 'Priority Support', 'Backups', 'Custom Domains'], popular: true },
  { name: 'Enterprise', price: 'Custom', docs: 'Unlimited', storage: 'Unlimited', requests: 'Unlimited', features: ['Unlimited Databases', 'Dedicated Cluster', '24/7 Support', 'SLA', 'On-Prem Option'] },
];

// Stroke-icon set (no emoji) — matches the dashboard's visual language.
const Icon = ({ d, children, className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const steps = [
  { step: '01', title: 'Create Account', desc: 'Sign up for free. No credit card required.', icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0114 0v1"/></> },
  { step: '02', title: 'Get Connection String', desc: 'We generate a secure nexdb:// URL for your project.', icon: <><path d="M10 13a5 5 0 007.07 0l1.93-1.93a5 5 0 00-7.07-7.07L11 5"/><path d="M14 11a5 5 0 00-7.07 0L5 12.93a5 5 0 007.07 7.07L13 19"/></> },
  { step: '03', title: 'Build with Any Language', desc: 'Use our Rust, Node.js, or Python client. Same API everywhere.', icon: <path d="M13 10V3L4 14h7v7l9-11h-7z"/> },
];

const features = [
  { title: 'Real-time Analytics', desc: 'Monitor query latency, storage, and request volume with live-updating charts.', icon: <><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></> },
  { title: 'Connection Strings', desc: 'Standard nexdb:// format. Works with all our client libraries out of the box.', icon: <><path d="M10 13a5 5 0 007.07 0l1.93-1.93a5 5 0 00-7.07-7.07L11 5"/><path d="M14 11a5 5 0 00-7.07 0L5 12.93a5 5 0 007.07 7.07L13 19"/></> },
  { title: 'Document Browser', desc: 'View, search, and edit documents directly from the dashboard.', icon: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></> },
  { title: 'Instant Provisioning', desc: 'Your database is ready the moment you register. No queues, no waiting.', icon: <path d="M13 10V3L4 14h7v7l9-11h-7z"/> },
  { title: 'Usage Metrics', desc: 'Track document count, storage size, and API requests per day.', icon: <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></> },
  { title: 'Multi-Language', desc: 'Native clients for Rust, Node.js, and Python with identical APIs.', icon: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></> },
];

const stats = [
  { value: '12K+', label: 'Databases created' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<5ms', label: 'Median latency' },
  { value: '3', label: 'Client languages' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--info)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </span>
            NexDB
            <span className="ml-1 text-[10px] font-semibold text-[var(--accent-primary)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full uppercase tracking-wider">Cloud</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</a>
            <Link href="/docs" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Docs</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2">Sign In</Link>
            <Link href="/register" className="text-sm font-semibold px-5 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-all text-[var(--bg-primary)]">Get Started Free</Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[var(--text-secondary)] p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden glass border-t border-[var(--border-subtle)] px-6 py-4 flex flex-col gap-3">
            <a href="#features" className="text-[var(--text-secondary)] text-sm">Features</a>
            <a href="#pricing" className="text-[var(--text-secondary)] text-sm">Pricing</a>
            <Link href="/login" className="text-[var(--text-secondary)] text-sm">Sign In</Link>
            <Link href="/register" className="text-sm font-semibold text-center px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-primary)]">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(0,229,153,0.08),transparent_60%)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[rgba(0,229,153,0.06)] rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[rgba(0,212,255,0.06)] rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[rgba(0,229,153,0.2)] text-[var(--accent-primary)] text-xs font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            Now in Public Beta — Free Tier Available
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            Your Database,{' '}
            <span className="bg-gradient-to-r from-[var(--accent-primary)] via-[var(--info)] to-[var(--accent-primary)] bg-clip-text text-transparent animate-gradient">
              Zero Setup
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Get a free NexDB instance with a connection string — use it from Rust, Node.js, Python, or any language.
            Built for speed. Backed by WAL. Zero config.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link href="/register"
              className="px-8 py-3.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] font-semibold text-sm transition-all hover:scale-[1.02] flex items-center gap-2">
              Create Free Database
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
            <a href="#features"
              className="px-8 py-3.5 rounded-lg border border-[var(--border-default)] hover:border-[rgba(255,255,255,0.15)] font-medium text-sm transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              See How It Works
            </a>
          </div>

          {/* Connection String Preview */}
          <div className="max-w-xl mx-auto">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--text-tertiary)] font-mono uppercase tracking-wider">Your Connection String</span>
                <span className="text-[10px] text-[var(--accent-primary)] font-mono">LIVE DEMO</span>
              </div>
              <div className="flex items-center gap-3 bg-[var(--bg-primary)] rounded-lg px-4 py-3 border border-[var(--border-subtle)]">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse flex-shrink-0" />
                <code className="text-sm font-mono text-[var(--text-secondary)] truncate typing-cursor">
                  nexdb://user_free_a1b2:token@nexdb.cloud:27017/free_db
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust strip ─── */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center py-6 card-hover">
              <p className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--info)] bg-clip-text text-transparent tabular-nums">{s.value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Go from zero to database in 30 seconds</h2>
          <p className="text-[var(--text-secondary)] text-center max-w-xl mx-auto mb-16">Register, get your connection string, and start building.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((item, i) => (
              <div key={i} className="relative card-hover p-8 group">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center mb-5 text-[var(--accent-primary)] group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6">{item.icon}</Icon>
                </div>
                <span className="text-[10px] font-mono text-[var(--accent-primary)]">{item.step}</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Code Examples ─── */}
      <section className="py-20 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Connect in any language</h2>
          <p className="text-[var(--text-secondary)] text-center max-w-xl mx-auto mb-16">The same NexDB API works everywhere.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { lang: 'Rust', code: `use nexdb::NexDb;\n\nlet db = NexDb::open(\n    "nexdb://user@cloud:27017/db"\n).await?;\ndb.insert("users", "u1", doc).await?;` },
              { lang: 'Node.js', code: `const { NexDb } = require('nexdb');\n\nconst db = new NexDb(\n  "nexdb://user@cloud:27017/db"\n);\nawait db.connect();\nawait db.insert("users", "u1", doc);` },
              { lang: 'Python', code: `from nexdb import NexDb\n\ndb = NexDb(\n    "nexdb://user@cloud:27017/db"\n)\ndb.create_collection("users")\ndb.insert("users", "u1", doc)` },
            ].map((item, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)] font-mono ml-3">{item.lang}</span>
                </div>
                <pre className="p-5 text-xs font-mono text-[var(--text-secondary)] leading-relaxed overflow-x-auto">{item.code}</pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything you expect from a modern database</h2>
          <p className="text-[var(--text-secondary)] text-center max-w-xl mx-auto mb-16">Plus a few things you didn&apos;t know you needed.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="card-hover p-6 group">
                <div className="w-11 h-11 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center mb-4 text-[var(--accent-primary)] group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5">{f.icon}</Icon>
                </div>
                <h3 className="font-semibold mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-[var(--text-secondary)] text-center max-w-xl mx-auto mb-16">Free tier included. Upgrade when you grow.</p>

          <div className="grid md:grid-cols-4 gap-4">
            {plans.map((plan, i) => (
              <div key={i} className={`relative rounded-xl p-6 border transition-all ${plan.popular ? 'border-[var(--accent-primary)] bg-[var(--bg-secondary)] shadow-[0_0_40px_rgba(0,229,153,0.08)]' : 'card-hover'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--accent-primary)] text-[var(--bg-primary)] text-[10px] font-bold uppercase tracking-wider">Most Popular</div>
                )}
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-[var(--text-tertiary)] text-sm ml-1">/mo</span>}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mb-4 space-y-1.5">
                  <p className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]"><><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></></Icon> {plan.docs} documents</p>
                  <p className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]"><><rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/></></Icon> {plan.storage}</p>
                  <p className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></Icon> {plan.requests}</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-[var(--accent-primary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}
                  className={`block text-center text-sm font-semibold py-2.5 rounded-lg transition-all ${plan.popular ? 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)]' : 'border border-[var(--border-default)] hover:border-[rgba(255,255,255,0.15)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : plan.price === '$0' ? 'Get Started Free' : 'Subscribe'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[rgba(0,229,153,0.06)] rounded-full blur-[120px] pointer-events-none" />
          <h2 className="relative text-3xl md:text-4xl font-bold mb-4">Ready to ship faster?</h2>
          <p className="relative text-[var(--text-secondary)] mb-8">Spin up your free database now. No credit card, no config files.</p>
          <Link href="/register"
            className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] font-semibold text-sm transition-all hover:scale-[1.02]">
            Create Free Database
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--border-subtle)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-tertiary)]">
          <p>NexDB Cloud — Built with Next.js &amp; Rust. MIT License.</p>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-[var(--text-secondary)] transition-colors">Docs</Link>
            <a href="https://github.com/nexdb" className="hover:text-[var(--text-secondary)] transition-colors">GitHub</a>
            <Link href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
