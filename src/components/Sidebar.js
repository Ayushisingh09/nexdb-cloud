'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession } from '@/lib/store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◉' },
  { href: '/dashboard/databases', label: 'Databases', icon: '▣' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({ user, onClose }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push('/');
  }

  return (
    <aside className="w-64 h-full glass border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <Link href="/dashboard" className="text-lg font-bold">
          Nex<span className="text-indigo-400">Db</span>
          <span className="ml-2 text-[10px] font-mono text-indigo-400/60">Cloud</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                active ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-2 text-center transition-colors">
          Sign Out
        </button>
      </div>
    </aside>
  );
}
