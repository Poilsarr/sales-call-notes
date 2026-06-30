'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Phone,
  Mic,
  Radio,
  BarChart3,
  Crosshair,
  Users,
  Plug,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/calls', label: 'Calls', icon: Phone },
  { href: '/app/record', label: 'Record', icon: Mic },
  { href: '/app/live', label: 'Live', icon: Radio },
  { href: '/app/intelligence', label: 'Intelligence', icon: Crosshair },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/dashboard', label: 'Analytics', icon: BarChart3 },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <aside className="w-64 bg-linear-surface border-r border-linear-secondary flex flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-linear-indigo rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-[9px] tracking-tight">CP</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">CallNote Pro</span>
        </Link>
      </div>
      
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          // Active-state logic was buggy: `pathname === item.href ||
          // pathname.startsWith(item.href + '/')` meant `/app/calls`
          // matched BOTH the Calls link (exact) AND the Dashboard
          // link (because /app/calls starts with /app/). Fix: only
          // allow the prefix match for non-root items. Dashboard is
          // highlighted only on the exact /app route; every other
          // sidebar item is highlighted on exact OR any subroute.
          const isRoot = item.href === '/app';
          const isActive = isRoot
            ? pathname === '/app'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1
                ${isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-3 border-t border-linear-secondary">
        <button onClick={() => signOut({ redirectUrl: '/' })} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 w-full transition-colors">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
