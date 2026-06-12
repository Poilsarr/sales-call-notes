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
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-[9px] tracking-tight">CP</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-gray-900">CallNote Pro</span>
        </Link>
      </div>
      
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1
                ${isActive 
                  ? 'bg-gray-200 text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-3 border-t border-gray-200">
        <button onClick={() => signOut({ redirectUrl: '/' })} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 w-full transition-colors">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
