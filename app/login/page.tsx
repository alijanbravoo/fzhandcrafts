'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FiLock, FiUser, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { signInWithGoogle, loginWithEmail, loginWithPhone, resetPassword } = useAuth();

  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push('/account');
    } catch (err) {
      // Handled in context toast
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('Please enter both your email/phone and password');
      return;
    }

    setLoading(true);
    try {
      const trimmed = identifier.trim();
      const cleaned = trimmed.replace(/\D/g, '');

      // If user provided a Pakistani phone number (e.g. 03001234567)
      if (cleaned.startsWith('03') && cleaned.length === 11) {
        await loginWithPhone(cleaned, password);
      } else if (trimmed.includes('@')) {
        await loginWithEmail(trimmed, password);
      } else if (cleaned.length === 11) {
        // Fallback for 11 digits
        await loginWithPhone(cleaned, password);
      } else {
        // Assume email or standard format
        await loginWithEmail(trimmed, password);
      }

      router.push('/account');
    } catch (err) {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    try {
      await resetPassword(forgotEmail);
      setShowForgot(false);
    } catch (err) {
      // Handled in context
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <Link href="/" className="text-3xl font-extrabold text-primary-600 block mb-2">
            🌸 FZhandcrafts
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mt-1">Track orders and manage your profile</p>
        </div>

        {/* Google Sign In Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <FcGoogle className="w-5 h-5" />
            <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google (Gmail)'}</span>
          </button>
        </div>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-3 text-xs text-gray-400 uppercase font-semibold">
            or sign in with email / phone
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleFormLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email or Phone Number (03XXXXXXXXX)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@gmail.com or 03001234567"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 text-sm"
              />
              <FiUser className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => setShowForgot(!showForgot)}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 text-sm"
              />
              <FiLock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-xl font-bold transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Forgot password collapsible form */}
        {showForgot && (
          <form onSubmit={handlePasswordReset} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <p className="text-xs text-gray-600 font-medium">
              Enter your email address to receive a password reset link:
            </p>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            />
            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-black text-white text-xs font-semibold py-2 rounded-lg"
            >
              Send Reset Link
            </button>
          </form>
        )}

        <div className="border-t border-gray-100 pt-4 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Create an account
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            Store Administrator?{' '}
            <Link href="/admin/login" className="text-gray-600 hover:underline">
              Admin Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
