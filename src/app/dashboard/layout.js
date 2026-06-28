'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import { getSession } from '@/lib/store';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s || !s.user) { router.push('/login'); return; }
    setSession(s);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--info)] flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 text-[var(--bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-[var(--text-tertiary)] text-sm">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
            Loading workspace...
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-primary)] flex">
      {/* Desktop sidebar — fixed, never scrolls with content */}
      <div className="hidden md:block flex-shrink-0 h-screen sticky top-0">
        <Sidebar user={session.user} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm fade-in" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 max-w-[80vw] slide-up">
            <Sidebar user={session.user} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
          <button onClick={() => setSidebarOpen(true)} className="text-[var(--text-secondary)] p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors" aria-label="Open menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <span className="text-sm font-bold tracking-tight">NexDB</span>
          <Avatar name={session.user?.name} email={session.user?.email} size={32} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
