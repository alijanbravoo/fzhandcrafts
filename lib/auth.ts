import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './firebase';
import { phoneToEmail, validatePakistaniPhone } from './utils';

// Google Provider instance
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Sign in or Sign up with Google (Gmail)
export const signInWithGoogle = async (): Promise<UserCredential> => {
  return await signInWithPopup(auth, googleProvider);
};

// Sign in with Email and Password
export const login = async (email: string, password: string): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
};

// Register with Email and Password
export const registerWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<UserCredential> => {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && credential.user) {
    try {
      await updateProfile(credential.user, { displayName });
    } catch (e) {
      console.warn('Could not update displayName:', e);
    }
  }
  return credential;
};

// Register with Pakistani Phone Number (03XXXXXXXXX) and Password
export const registerWithPhone = async (
  phone: string,
  password: string,
  displayName?: string
): Promise<UserCredential> => {
  const validation = validatePakistaniPhone(phone);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid phone number');
  }
  const virtualEmail = phoneToEmail(validation.cleaned);
  const credential = await createUserWithEmailAndPassword(auth, virtualEmail, password);
  if (displayName && credential.user) {
    try {
      await updateProfile(credential.user, { displayName });
    } catch (e) {
      console.warn('Could not update displayName:', e);
    }
  }
  return credential;
};

// Login with Pakistani Phone Number (03XXXXXXXXX) and Password
export const loginWithPhone = async (
  phone: string,
  password: string
): Promise<UserCredential> => {
  const validation = validatePakistaniPhone(phone);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid phone number');
  }
  const virtualEmail = phoneToEmail(validation.cleaned);
  return await signInWithEmailAndPassword(auth, virtualEmail, password);
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  return await sendPasswordResetEmail(auth, email.trim());
};

// Sign out
export const logout = async (): Promise<void> => {
  return await signOut(auth);
};

// Get current user promise helper
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};
