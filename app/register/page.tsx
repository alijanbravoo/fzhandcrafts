'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FiLock, FiUser, FiPhone, FiMail, FiArrowRight } from 'react-icons/fi';
import { validatePakistaniPhone } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { signInWithGoogle, registerWithEmail, registerWithPhone } = useAuth();

  const [signupMethod, setSignupMethod] = useState<'phone' | 'email'>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push('/account');
    } catch (err) {
      // Handled in context
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setPhoneError(null);

    try {
      if (signupMethod === 'phone') {
        const check = validatePakistaniPhone(phone);
        if (!check.isValid) {
          setPhoneError(check.error || 'Invalid phone number');
          toast.error(check.error || 'Phone must be 11 digits starting with 03');
          setLoading(false);
          return;
        }

        await registerWithPhone(check.cleaned, password, name.trim());
      } else {
        if (!email.trim() || !email.includes('@')) {
          toast.error('Please enter a valid email address');
          setLoading(false);
          return;
        }

        await registerWithEmail(email.trim(), password, name.trim());
      }

      router.push('/account');
    } catch (err) {
      // Error handled in context toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <Link href="/" className="text-3xl font-extrabold text-primary-600 block mb-2">
            🌸 FZhandcrafts
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
          <p className="text-sm text-gray-500 mt-1">Join to track your flower orders seamlessly</p>
        </div>

        {/* Google One-Click Sign Up */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <FcGoogle className="w-5 h-5" />
            <span>{googleLoading ? 'Connecting...' : 'Sign up with Google (Gmail)'}</span>
          </button>
        </div>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-3 text-xs text-gray-400 uppercase font-semibold">
            or sign up with credentials
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Method Toggle: Phone or Email */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSignupMethod('phone')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              signupMethod === 'phone'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📱 Phone Number (03...)
          </button>
          <button
            type="button"
            onClick={() => setSignupMethod('email')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              signupMethod === 'email'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✉️ Email Address
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ayesha Khan"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 text-sm"
              />
              <FiUser className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          {signupMethod === 'phone' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone Number (11 digits, starts with 03) *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="03001234567"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 bg-white text-gray-900 text-sm ${
                    phoneError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                />
                <FiPhone className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              </div>
              {phoneError ? (
                <p className="text-xs text-red-600 font-medium mt-1">{phoneError}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Must start with 03 and be 11 digits</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 text-sm"
                />
                <FiMail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Create Password (min 6 characters) *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
