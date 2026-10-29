'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, checkIsAdmin, logout } from '@/lib/auth';
import { User } from 'firebase/auth';
import Link from 'next/link';
import { FiShield, FiAlertTriangle, FiLogOut } from 'react-icons/fi';

export default function AdminProtected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isCancelled = false;

    getCurrentUser().then(async (currentUser) => {
      if (isCancelled) return;

      if (!currentUser) {
        router.push('/admin/login');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      const authorized = await checkIsAdmin(currentUser);
      if (isCancelled) return;

      setIsAuthorized(authorized);
      setLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [router]);

  const handleSignOutAndExit = async () => {
    await logout();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-3 text-xs text-gray-500 font-medium">Verifying Administrative Privileges...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Access Denied: Logged in as regular customer or unauthorized email
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            The account <span className="font-semibold text-gray-900 font-mono text-xs block mt-1">{user.email || 'No Email'}</span> is not authorized as an administrator.
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 mb-6">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <FiShield className="w-4 h-4 text-amber-600" /> Administrative Security Rule
            </p>
            <p className="text-[11px] leading-normal text-amber-800">
              Only authorized Google (Gmail) accounts designated by the Super Admin can access the management panel.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSignOutAndExit}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm"
            >
              <FiLogOut className="w-4 h-4" /> Sign Out &amp; Use Authorized Gmail
            </button>
            <Link
              href="/"
              className="w-full inline-block text-center text-xs font-semibold text-gray-500 hover:text-gray-800 py-2 transition-colors"
            >
              ← Return to Store Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}







