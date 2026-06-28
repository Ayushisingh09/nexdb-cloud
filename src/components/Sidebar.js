'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession } from '@/lib/store';
import { useState } from 'react';
import Avatar from '@/components/Avatar';

const navItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    ),
  },
  {
    href: '/dashboard/databases',
    label: 'Databases',
    icon: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
      </>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <>
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
      </>
    ),
  },
];

export default function Sidebar({ user, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);

  function handleLogout() {
    clearSession();
    router.push('/');
  }

  return (
    <aside className="w-64 h-full bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[var(--border-subtle)]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--info)] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
            <svg className="w-4 h-4 text-[var(--bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">NexDB</span>
            <span className="text-[9px] font-semibold text-[var(--accent-primary)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded uppercase tracking-wider">Cloud</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]'
              }`}>
              <svg className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                {item.icon}
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-[var(--border-subtle)]">
        <div className="relative">
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 group">
            <Avatar name={user?.name} email={user?.email} size={36} showStatus />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.email || ''}</p>
            </div>
            <svg className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${showLogout ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {showLogout && (
            <div className="absolute bottom-full left-0 right-0 mb-2 px-3 fade-in">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 shadow-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
