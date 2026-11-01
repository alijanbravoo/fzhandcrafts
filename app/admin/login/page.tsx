'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithGoogle, 
  login, 
  resetPassword, 
  getCurrentUser, 
  checkIsAdmin, 
  logout, 
  SUPER_ADMIN_EMAIL,
  getConfiguredAdminEmails 
} from '@/lib/auth';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiShield, FiAlertCircle, FiMail, FiLock, FiArrowRight, FiInfo } from 'react-icons/fi';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingInitialAuth, setCheckingInitialAuth] = useState(true);
  
  // Tab: 'google' | 'email'
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  
  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in with admin privileges
    let isMounted = true;
    getCurrentUser().then(async (user) => {
      if (!isMounted) return;
      if (user) {
        const isAdmin = await checkIsAdmin(user);
        if (isAdmin && isMounted) {
          router.push('/admin');
          return;
        }
      }
      setCheckingInitialAuth(false);
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const verifyAndRedirectAdmin = async (signedInUser: any) => {
    const userEmail = (signedInUser.email || '').toLowerCase().trim();
    const isAuthorized = await checkIsAdmin(signedInUser);

    if (!isAuthorized) {
      await logout();
      toast.error(`Access Denied: "${userEmail || 'Account'}" is not authorized as an admin.`, {
        duration: 5000,
      });
      return false;
    }

    toast.success(`Welcome back, ${signedInUser.displayName || userEmail}!`);
    router.push('/admin');
    return true;
  };

  const handleGoogleAdminLogin = async () => {
    setLoading(true);
    try {
      const credential = await signInWithGoogle();
      await verifyAndRedirectAdmin(credential.user);
    } catch (error: any) {
      console.error('Google Admin Login error:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        toast.error(error?.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const credential = await login(email.trim(), password);
      await verifyAndRedirectAdmin(credential.user);
    } catch (error: any) {
      console.error('Email Admin Login error:', error);
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        msg = 'Invalid admin email or password.';
      } else if (error?.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please wait a few minutes or reset your password.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your admin email address');
      return;
    }

    setResettingPassword(true);
    try {
      await resetPassword(forgotEmail.trim());
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgot(false);
    } catch (err: any) {
      console.error('Password reset error:', err);
      toast.error(err?.message || 'Failed to send password reset email.');
    } finally {
      setResettingPassword(false);
    }
  };

  if (checkingInitialAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#013428]"></div>
          <p className="mt-3 text-xs text-gray-500 font-medium">Checking admin session...</p>
        </div>
      </div>
    );
  }

  const configuredAdmins = getConfiguredAdminEmails();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#013428]/10 text-[#013428] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <FiShield className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            FZhandcrafts Admin
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Protected management portal for authorized team members
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-bold">Authorized Admin Access Only</p>
            <p className="mt-0.5 text-amber-800">
              Only authorized accounts (such as <span className="font-semibold underline">{SUPER_ADMIN_EMAIL}</span>) can access the store management system.
            </p>
          </div>
        </div>

        {/* Auth Method Selector Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => { setAuthMethod('google'); setShowForgot(false); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMethod === 'google'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Google (Gmail)
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('email')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMethod === 'email'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Email &amp; Password
          </button>
        </div>

        {/* Google Sign In Option */}
        {authMethod === 'google' && (
          <div className="space-y-4 pt-1">
            <button
              type="button"
              onClick={handleGoogleAdminLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-gray-300 rounded-xl shadow-xs text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#013428] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            >
              <FcGoogle className="w-5 h-5" />
              <span>{loading ? 'Authenticating with Google...' : 'Sign In with Authorized Gmail'}</span>
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              Requires a Google Account matching an authorized admin email.
            </p>
          </div>
        )}

        {/* Email & Password Option */}
        {authMethod === 'email' && !showForgot && (
          <form onSubmit={handleEmailAdminLogin} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#013428] focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotEmail(email); }}
                  className="text-xs text-[#013428] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#013428] focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#013428] hover:bg-[#1e4b3e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Forgot Password Sub-form */}
        {authMethod === 'email' && showForgot && (
          <form onSubmit={handlePasswordReset} className="space-y-4 pt-1">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <FiInfo className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Enter your admin email and we will send a password reset link.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#013428] focus:bg-white transition-all text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={resettingPassword}
                className="flex-1 py-2.5 px-4 bg-[#013428] hover:bg-[#1e4b3e] text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {resettingPassword ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-3 border-t border-gray-100">
          <Link
            href="/"
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Back to Store Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
