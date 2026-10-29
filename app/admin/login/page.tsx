'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, getCurrentUser, checkIsAdmin, logout, SUPER_ADMIN_EMAIL } from '@/lib/auth';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiShield, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingInitialAuth, setCheckingInitialAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in with admin privileges
    getCurrentUser().then(async (user) => {
      if (user) {
        const isAdmin = await checkIsAdmin(user);
        if (isAdmin) {
          router.push('/admin');
          return;
        }
      }
      setCheckingInitialAuth(false);
    });
  }, [router]);

  const handleGoogleAdminLogin = async () => {
    setLoading(true);

    try {
      const credential = await signInWithGoogle();
      const signedInUser = credential.user;
      const email = (signedInUser.email || '').toLowerCase().trim();

      // Check if signed-in account is authorized
      const isAuthorized = await checkIsAdmin(signedInUser);

      if (!isAuthorized) {
        // Immediately sign them out
        await logout();
        toast.error(`Access Denied: ${email} is not an authorized admin account.`, {
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${signedInUser.displayName || email}!`);
      router.push('/admin');
    } catch (error: any) {
      console.error('Google Admin Login error:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        toast.error(error?.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingInitialAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-50 text-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <FiShield className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            FZhandcrafts Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Protected management portal for authorized team members
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-bold">Authorized Gmail Login Only</p>
            <p className="mt-0.5 text-amber-800">
              Only authorized Google Accounts (including Super Admin <span className="font-semibold underline">{SUPER_ADMIN_EMAIL}</span>) can access this dashboard.
            </p>
          </div>
        </div>

        {/* Google Sign In Button */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
          >
            <FcGoogle className="w-5 h-5" />
            <span>{loading ? 'Authenticating with Google...' : 'Sign In with Authorized Gmail'}</span>
          </button>

          <div className="text-center pt-4 border-t border-gray-100">
            <Link
              href="/"
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Back to Store Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



