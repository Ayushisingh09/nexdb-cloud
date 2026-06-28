'use client';
import Link from 'next/link';
import { useState } from 'react';

const plans = [
  { name: 'Free', price: '$0', docs: '100', storage: '10 MB', requests: '1K/day', features: ['1 Database', 'Basic Analytics', 'Community Support'] },
  { name: 'Starter', price: '$9', docs: '10K', storage: '100 MB', requests: '10K/day', features: ['5 Databases', 'Real-time Analytics', 'Email Support', 'Indexes'], popular: false },
  { name: 'Pro', price: '$29', docs: '100K', storage: '1 GB', requests: '100K/day', features: ['25 Databases', 'Advanced Analytics', 'Priority Support', 'Backups', 'Custom Domains'], popular: true },
  { name: 'Enterprise', price: 'Custom', docs: 'Unlimited', storage: 'Unlimited', requests: 'Unlimited', features: ['Unlimited Databases', 'Dedicated Cluster', '24/7 Support', 'SLA', 'On-Prem Option'] },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Nex<span className="text-indigo-400">Db</span>
            <span className="ml-2 text-xs font-mono text-indigo-400/60 bg-indigo-400/10 px-2 py-0.5 rounded-full">Cloud</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</a>
            <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">Docs</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-300 hover:text-white transition-colors px-4 py-2">Sign In</Link>
            <Link href="/register" className="text-sm font-medium px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-all text-white shadow-lg shadow-indigo-600/25">Get Started Free</Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-zinc-400 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden glass border-t border-white/5 px-6 py-4 flex flex-col gap-3">
            <a href="#features" className="text-zinc-400 text-sm">Features</a>
            <a href="#pricing" className="text-zinc-400 text-sm">Pricing</a>
            <Link href="/login" className="text-zinc-300 text-sm">Sign In</Link>
            <Link href="/register" className="text-sm font-medium text-center px-4 py-2 rounded-full bg-indigo-600 text-white">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Now in Public Beta — Free Tier Available
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Your Database,{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Zero Setup
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Get a free NexDb instance with a connection string — use it from Rust, Node.js, Python, or any language.
            Built for speed. Backed by WAL. Zero config.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register"
              className="px-8 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02]">
              Create Free Database →
            </Link>
            <a href="#features"
              className="px-8 py-3.5 rounded-full border border-white/10 hover:border-white/20 font-medium text-sm transition-all text-zinc-300 hover:text-white">
              See How It Works
            </a>
          </div>

          {/* Connection String Preview */}
          <div className="max-w-xl mx-auto">
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Your Connection String</span>
                <span className="text-[10px] text-indigo-400/60 font-mono">LIVE DEMO</span>
              </div>
              <div className="flex items-center gap-3 bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <code className="text-sm font-mono text-zinc-300 truncate typing-cursor">
                  nexdb://user_free_a1b2:token@nexdb.cloud:27017/free_db
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Go from zero to database in 30 seconds</h2>
          <p className="text-zinc-400 text-center max-w-xl mx-auto mb-16">Register, get your connection string, and start building.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up for free. No credit card required.', icon: '👤' },
              { step: '02', title: 'Get Connection String', desc: 'We generate a secure nexdb:// URL for your project.', icon: '🔗' },
              { step: '03', title: 'Build with Any Language', desc: 'Use our Rust, Node.js, or Python client. Same API everywhere.', icon: '⚡' },
            ].map((item, i) => (
              <div key={i} className="relative glass rounded-2xl p-8 border border-white/5 hover:border-indigo-500/20 transition-all group">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <span className="text-[10px] font-mono text-indigo-400/50">{item.step}</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Code Examples ─── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Connect in any language</h2>
          <p className="text-zinc-400 text-center max-w-xl mx-auto mb-16">The same NexDb API works everywhere.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { lang: 'Rust', code: `use nexdb::NexDb;\n\nlet db = NexDb::open(\n    "nexdb://user@cloud:27017/db"\n).await?;\ndb.insert("users", "u1", doc).await?;` },
              { lang: 'Node.js', code: `const { NexDb } = require('nexdb');\n\nconst db = new NexDb(\n  "nexdb://user@cloud:27017/db"\n);\nawait db.connect();\nawait db.insert("users", "u1", doc);` },
              { lang: 'Python', code: `from nexdb import NexDb\n\ndb = NexDb(\n    "nexdb://user@cloud:27017/db"\n)\ndb.create_collection("users")\ndb.insert("users", "u1", doc)` },
            ].map((item, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden border border-white/5">
                <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  </div>
                  <span className="text-xs text-zinc-500 font-mono ml-3">{item.lang}</span>
                </div>
                <pre className="p-5 text-xs font-mono text-zinc-300 leading-relaxed overflow-x-auto">{item.code}</pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything you expect from a modern database</h2>
          <p className="text-zinc-400 text-center max-w-xl mx-auto mb-16">Plus a few things you didn&apos;t know you needed.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Real-time Analytics', desc: 'Monitor query latency, storage, and request volume with live-updating charts.', icon: '📊' },
              { title: 'Connection Strings', desc: 'Standard nexdb:// format. Works with all our client libraries out of the box.', icon: '🔗' },
              { title: 'Document Browser', desc: 'View, search, and edit documents directly from the dashboard.', icon: '🔍' },
              { title: 'Instant Provisioning', desc: 'Your database is ready the moment you register. No queues, no waiting.', icon: '⚡' },
              { title: 'Usage Metrics', desc: 'Track document count, storage size, and API requests per day.', icon: '📈' },
              { title: 'Multi-Language', desc: 'Native clients for Rust, Node.js, and Python with identical APIs.', icon: '🌐' },
            ].map((f, i) => (
              <div key={i} className="glass rounded-xl p-6 border border-white/5 hover:border-indigo-500/20 transition-all group">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="font-semibold mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-zinc-400 text-center max-w-xl mx-auto mb-16">Free tier included. Upgrade when you grow.</p>

          <div className="grid md:grid-cols-4 gap-4">
            {plans.map((plan, i) => (
              <div key={i} className={`relative glass rounded-2xl p-6 border ${plan.popular ? 'border-indigo-500/40 shadow-xl shadow-indigo-500/10' : 'border-white/5'} transition-all hover:border-indigo-500/30`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-[10px] font-semibold uppercase tracking-wider">Most Popular</div>
                )}
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-zinc-500 text-sm ml-1">/mo</span>}
                </div>
                <div className="text-xs text-zinc-400 mb-4 space-y-1">
                  <p>📄 {plan.docs} documents</p>
                  <p>💾 {plan.storage}</p>
                  <p>📨 {plan.requests}</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="text-xs text-zinc-300 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}
                  className={`block text-center text-sm font-medium py-2.5 rounded-xl transition-all ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white'}`}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : plan.price === '$0' ? 'Get Started Free' : 'Subscribe'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>NexDb Cloud — Built with Next.js &amp; Rust. MIT License.</p>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-zinc-300 transition-colors">Docs</Link>
            <a href="https://github.com/nexdb" className="hover:text-zinc-300 transition-colors">GitHub</a>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
