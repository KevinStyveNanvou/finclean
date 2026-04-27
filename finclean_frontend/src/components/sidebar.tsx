'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import {
  LayoutDashboard,
  Shield,
  Target,
  FileSearch,
  Activity,
  Settings,
  LogOut,
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react';

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Scan Configuration', href: '/scan/config', icon: Target },
  { title: 'Scan Results', href: '/scan/results', icon: FileSearch },
  { title: 'Import Scan', href: '/scan/import', icon: Activity },
  { title: 'Exploitation', href: '/exploitation', icon: Zap },
  { title: 'Scans Permanents', href: '/permanent-scans', icon: Clock },
  { title: 'Criticités', href: '/criticalities', icon: AlertCircle }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
  try {
    // Supprimer cookies
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

    // Optionnel : appeler backend pour blacklist refresh
    await api.post("/user/logout/");

  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    router.replace("/login"); // replace empêche retour
  }
};

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
            <img src="/logo2.png" alt="FinClean Logo" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-4 space-y-1">
        
        <Link
          href="/settings"
          className="flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>

        {/* 🔥 Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>

      </div>
    </div>
  );
}