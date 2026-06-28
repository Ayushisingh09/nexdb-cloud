'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveSession } from '@/lib/store';

const HIGHLIGHTS = [
  'Free database instance, ready instantly',
  '10 MB storage — no credit card required',
  'Same API across Rust, Node.js & Python',
];

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH = [
  { label: '', color: '' },
  { label: 'Weak', color: 'var(--error)' },
  { label: 'Fair', color: 'var(--warning)' },
  { label: 'Good', color: 'var(--info)' },
  { label: 'Strong', color: 'var(--success)' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      saveSession(data.user, data.databases, data.token);
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden flex-col justify-between p-12 border-r border-[var(--border-subtle)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[rgba(0,229,153,0.08)] rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[rgba(0,212,255,0.06)] rounded-full blur-[100px]" />
        </div>
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--info)] flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <span className="text-base font-bold tracking-tight">NexDB <span className="text-[var(--accent-primary)]">Cloud</span></span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight mb-6 text-[var(--text-primary)]">
            Your database,<br />
            <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--info)] bg-clip-text text-transparent">live in 30 seconds.</span>
          </h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[var(--text-tertiary)]">© 2026 NexDB Cloud. Built with Next.js &amp; Rust.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm fade-in">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--info)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </span>
              NexDB
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Create your account</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-8">Get a free database with a connection string.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-[rgba(255,71,87,0.1)] border border-[rgba(255,71,87,0.2)] text-[var(--error)] text-xs rounded-lg px-4 py-3 fade-in">{error}</div>
            )}

            <div>
              <label className="text-xs text-[var(--text-secondary)] font-medium block mb-2">Name</label>
              <div className="relative">
                <svg className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0114 0v1"/></svg>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all"
                  placeholder="Alice Johnson" />
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] font-medium block mb-2">Email</label>
              <div className="relative">
                <svg className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 5L2 7"/></svg>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all"
                  placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] font-medium block mb-2">Password</label>
              <div className="relative">
                <svg className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg pl-10 pr-10 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all"
                  placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? STRENGTH[strength].color : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: STRENGTH[strength].color || 'var(--text-tertiary)' }}>
                    {STRENGTH[strength].label}
                  </span>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] animate-spin" />
                  Creating your database...
                </>
              ) : 'Create Free Database'}
            </button>

            <div className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] bg-[var(--accent-soft)] rounded-lg px-4 py-3 border border-[rgba(0,229,153,0.15)]">
              <svg className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>You get <strong className="text-[var(--text-primary)]">1 free database</strong> with 10 MB storage on signup. No credit card needed.</span>
            </div>

            <p className="text-center text-xs text-[var(--text-tertiary)]">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-medium">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
