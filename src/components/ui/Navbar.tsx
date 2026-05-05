'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const path = usePathname();

  const navItems = [
    { href: '/employee', label: 'הטופס שלי' },
    ...(user?.is_admin ? [{ href: '/admin', label: 'ניהול ושליפה' }] : []),
  ];

  return (
    <header className="bg-[#1B3A6B] text-white h-14 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="text-lg font-medium tracking-tight">
        מוכ<span className="text-blue-300">שרים</span>
      </div>

      <nav className="flex gap-1 mr-4">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              path.startsWith(item.href)
                ? 'bg-white/20 text-white font-medium'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {user && (
        <div className="mr-auto flex items-center gap-3">
          <Avatar name={user.name} size="sm" />
          <span className="text-sm text-white/80">{user.name}</span>
          {user.is_admin && (
            <span className="text-xs bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">Admin</span>
          )}
          <button
            onClick={logout}
            className="text-white/60 hover:text-white transition-colors mr-2"
            title="התנתק"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
}
