'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/admin-auth';
import { Gavel, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    isAdmin().then((ok) => {
      if (!ok) {
        router.replace('/');
      } else {
        setAuthorized(true);
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0e0b]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0f0e0b] text-amber-50 flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-amber-900/40 flex flex-col py-6 px-4 gap-2 shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <Gavel className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-amber-300 text-sm">Gavalogy Admin</span>
        </div>
        <Link
          href="/admin/tag"
          className="flex items-center gap-2 px-3 py-2 rounded text-sm text-amber-200 hover:bg-amber-900/30 transition-colors"
        >
          <Tag className="w-4 h-4" />
          Tag Cases
        </Link>
        <div className="mt-auto">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded text-xs text-amber-600 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
