'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
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
import GaugeLogo from '@/components/gauge-logo';

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
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  function getDisplayName() {
    if (!isLoaded || !user) return null;
    if (user.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (email) return email.split("@")[0];
    return null;
  }

  const displayName = getDisplayName();

  return (
    <aside className="w-64 bg-linear-surface border-r border-linear-secondary flex flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={displayName ?? "Gauge"}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-white/10">
              <GaugeLogo className="mix-blend-screen" size={24} />
            </div>
          )}
          <span className="text-[15px] font-semibold tracking-tight text-white truncate">
            {displayName ?? "Gauge"}
          </span>
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
