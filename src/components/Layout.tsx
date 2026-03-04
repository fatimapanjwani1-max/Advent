'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, LayoutDashboard, FolderKanban, LogOut, Menu, X } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';

export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'All Projects', href: '/admin/projects', icon: FolderKanban },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-3 text-xl font-bold text-slate-900">Advent SmartSite</span>
            </div>
            <nav className="mt-8 flex-1 space-y-1 bg-white px-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-slate-100 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-slate-200 p-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-slate-400" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow-sm md:hidden">
        <button
          type="button"
          className="border-r border-slate-200 px-4 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex flex-1 justify-between px-4">
          <div className="flex flex-1 items-center">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-lg font-bold text-slate-900">Advent SmartSite</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
