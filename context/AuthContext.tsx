'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, UserCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  signInWithGoogle as authSignInWithGoogle,
  login as authLogin,
  registerWithEmail as authRegisterWithEmail,
  loginWithPhone as authLoginWithPhone,
  registerWithPhone as authRegisterWithPhone,
  logout as authLogout,
  resetPassword as authResetPassword
} from '@/lib/auth';
import { isPhoneAccountEmail, extractPhoneFromEmail, formatPakistaniPhone } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPhoneUser: boolean;
  phoneNumber: string;
  displayName: string;
  signInWithGoogle: () => Promise<UserCredential | null>;
  loginWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<UserCredential>;
  loginWithPhone: (phone: string, pass: string) => Promise<UserCredential>;
  registerWithPhone: (phone: string, pass: string, name?: string) => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isPhoneUser = isPhoneAccountEmail(user?.email);
  const phoneNumber = isPhoneUser ? extractPhoneFromEmail(user?.email) : '';
  const displayName = user?.displayName 
    || (isPhoneUser ? formatPakistaniPhone(phoneNumber) : user?.email?.split('@')[0] || 'User');

  const signInWithGoogle = async () => {
    try {
      const res = await authSignInWithGoogle();
      toast.success(`Welcome, ${res.user.displayName || 'Customer'}!`);
      return res;
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        toast.error(error?.message || 'Google sign-in failed');
      }
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const res = await authLogin(email, pass);
      toast.success('Signed in successfully!');
      return res;
    } catch (error: any) {
      console.error('Email Login Error:', error);
      let msg = 'Failed to sign in. Please check your credentials.';
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password.';
      }
      toast.error(msg);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      const res = await authRegisterWithEmail(email, pass, name);
      toast.success('Account created successfully!');
      return res;
    } catch (error: any) {
      console.error('Registration Error:', error);
      let msg = error?.message || 'Failed to create account.';
      if (error?.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists.';
      } else if (error?.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      toast.error(msg);
      throw error;
    }
  };

  const loginWithPhone = async (phone: string, pass: string) => {
    try {
      const res = await authLoginWithPhone(phone, pass);
      toast.success('Signed in successfully!');
      return res;
    } catch (error: any) {
      console.error('Phone Login Error:', error);
      let msg = 'Failed to sign in. Please check your phone number and password.';
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
        msg = 'No account found with this phone number or incorrect password.';
      }
      toast.error(msg);
      throw error;
    }
  };

  const registerWithPhone = async (phone: string, pass: string, name?: string) => {
    try {
      const res = await authRegisterWithPhone(phone, pass, name);
      toast.success('Phone account created successfully!');
      return res;
    } catch (error: any) {
      console.error('Phone Register Error:', error);
      let msg = error?.message || 'Failed to create phone account.';
      if (error?.code === 'auth/email-already-in-use') {
        msg = 'An account with this phone number already exists. Please log in.';
      } else if (error?.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      toast.error(msg);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authResetPassword(email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      toast.error(error?.message || 'Failed to send password reset email');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authLogout();
      toast.success('Signed out');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPhoneUser,
        phoneNumber,
        displayName,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginWithPhone,
        registerWithPhone,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
