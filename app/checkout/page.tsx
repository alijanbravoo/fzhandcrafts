'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { 
  formatCurrency, 
  generateOrderNumber, 
  validatePakistaniPhone, 
  phoneToEmail, 
  cleanPhoneNumber,
  formatPakistaniPhone 
} from '@/lib/utils';
import { createOrder, getNextOrderNumber, OrderItem } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiCheckCircle, FiLock, FiPhone, FiUser, FiMapPin, FiMail, FiPhoneCall, FiArrowRight } from 'react-icons/fi';
import confetti from 'canvas-confetti';
import { trackHybridEvent } from '@/lib/fpixel';

export type GenericOrderErrorType =
  | 'SERVICE_PERMISSION_DENIED'
  | 'NETWORK_CONNECTIVITY_ISSUE'
  | 'DATA_SCHEMA_MISMATCH'
  | 'SERVICE_UNAVAILABLE'
  | 'TRANSACTION_ABORTED'
  | 'GENERIC_PROCESSING_FAILURE';

export interface OrderDebugReport {
  genericType: GenericOrderErrorType;
  errorCode: string;
  sanitizedMessage: string;
  authMode: 'AUTHENTICATED_USER' | 'GUEST_USER';
  timestamp: string;
}

export default function CheckoutPage() {
  const { cartItems, getTotal, clearCart } = useCart();
  const { user, displayName, isPhoneUser, phoneNumber, signInWithGoogle, registerWithPhone } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [orderDebugReport, setOrderDebugReport] = useState<OrderDebugReport | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    specialRequest: '',
    preferredCallTime: '',
  });

  // Post-order account creation prompt state for guest orders
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    orderId: string;
    phone: string;
    name: string;
  } | null>(null);

  // Transition overlay state shown immediately when an order is placed
  const [orderTransition, setOrderTransition] = useState<{
    orderNumber: string;
    phone: string;
    customerName: string;
    isGuest: boolean;
  } | null>(null);

  const [accountPassword, setAccountPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  const triggerConfetti = () => {
    try {
      // First burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#f43f5e', '#fb7185', '#10b981', '#3b82f6', '#f59e0b'],
      });
      // Second burst slightly delayed for realistic celebration feel
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#e11d48', '#10b981', '#fbbf24'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#e11d48', '#10b981', '#38bdf8'],
        });
      }, 250);
    } catch (e) {
      console.warn('Confetti animation failed:', e);
    }
  };

  // Prepopulate form if user is logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || displayName || '',
        customerEmail: prev.customerEmail || (!isPhoneUser && user.email ? user.email : ''),
        customerPhone: prev.customerPhone || (isPhoneUser ? phoneNumber : ''),
      }));
    } else if (typeof window !== 'undefined') {
      // Check if phone was used in previous order
      const savedOrders = JSON.parse(localStorage.getItem('fz_orders') || '[]');
      if (savedOrders.length > 0 && savedOrders[savedOrders.length - 1].customerPhone) {
        setFormData((prev) => ({
          ...prev,
          customerPhone: prev.customerPhone || savedOrders[savedOrders.length - 1].customerPhone,
        }));
      }
    }

    // Fire Meta InitiateCheckout hybrid event
    if (cartItems.length > 0) {
      const checkoutEventId = `initiate_checkout_${Date.now()}`;
      trackHybridEvent({
        eventName: 'InitiateCheckout',
        eventId: checkoutEventId,
        userData: {
          email: user?.email || undefined,
          phone: isPhoneUser ? phoneNumber : undefined,
          firstName: displayName || undefined,
        },
        customData: {
          currency: 'PKR',
          value: getTotal(),
          num_items: cartItems.length,
          contents: cartItems.map((item) => ({
            id: item.productId,
            quantity: item.quantity,
            item_price: item.price,
          })),
        },
      });
    }
  }, [user, displayName, isPhoneUser, phoneNumber]);

  const handlePhoneChange = (val: string) => {
    setFormData({ ...formData, customerPhone: val });
    if (phoneError) {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Validate form fields
    if (!formData.customerName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    // Strict Pakistani Phone Validation
    const phoneValidation = validatePakistaniPhone(formData.customerPhone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast.error(phoneValidation.error || 'Please enter a valid 11-digit phone number starting with 03');
      return;
    }

    if (formData.customerEmail.trim() && !formData.customerEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.customerAddress.trim()) {
      toast.error('Please enter your complete delivery address');
      return;
    }

    setLoading(true);
    setPhoneError(null);
    setOrderDebugReport(null);

    try {
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || '',
      }));

      let orderNumber = '';
      try {
        orderNumber = await getNextOrderNumber();
      } catch (error) {
        console.error('Error generating global order number, falling back to local:', error);
        orderNumber = generateOrderNumber();
      }

      const cleanedPhone = phoneValidation.cleaned;
      // If customer didn't provide email, use phone number as account identifier
      const effectiveEmail = formData.customerEmail.trim() || phoneToEmail(cleanedPhone);

      const orderPayload: any = {
        orderNumber,
        customerName: formData.customerName.trim(),
        customerEmail: effectiveEmail,
        customerPhone: cleanedPhone,
        customerAddress: formData.customerAddress.trim(),
        items: orderItems,
        total: getTotal(),
        status: 'processing',
        confirmationCallStatus: 'pending',
      };

      if (formData.specialRequest && formData.specialRequest.trim() !== '') {
        orderPayload.specialRequest = formData.specialRequest.trim();
      }
      if (formData.preferredCallTime && formData.preferredCallTime.trim() !== '') {
        orderPayload.preferredCallTime = formData.preferredCallTime.trim();
      }
      if (user?.uid) {
        orderPayload.userId = user.uid;
      }

      const orderId = await createOrder(orderPayload);

      // Save order to browser localStorage for easy reference
      if (typeof window !== 'undefined') {
        const savedOrders = JSON.parse(localStorage.getItem('fz_orders') || '[]');
        savedOrders.push({
          orderNumber,
          orderId,
          customerPhone: cleanedPhone,
          date: new Date().toISOString(),
        });
        localStorage.setItem('fz_orders', JSON.stringify(savedOrders));
      }

      // Fire Meta Purchase hybrid event (Browser Pixel + Server CAPI)
      const purchaseEventId = `order_${orderNumber}`;
      trackHybridEvent({
        eventName: 'Purchase',
        eventId: purchaseEventId,
        userData: {
          email: effectiveEmail,
          phone: cleanedPhone,
          firstName: formData.customerName.trim(),
          city: formData.customerAddress.trim(),
        },
        customData: {
          currency: 'PKR',
          value: getTotal(),
          order_id: orderNumber,
          num_items: orderItems.length,
          contents: orderItems.map((item) => ({
            id: item.productId,
            quantity: item.quantity,
            item_price: item.price,
          })),
        },
      });

      clearCart();

      // Trigger confetti celebration
      triggerConfetti();

      // Prepare transition overlay
      setOrderTransition({
        orderNumber,
        phone: cleanedPhone,
        customerName: formData.customerName.trim(),
        isGuest: !user,
      });

      // Also set completedOrder for guest post-order registration
      if (!user) {
        setCompletedOrder({
          orderNumber,
          orderId,
          phone: cleanedPhone,
          name: formData.customerName.trim(),
        });
      }
    } catch (error: any) {
      console.error('Error creating order:', error);

      const rawCode = String(error?.code || 'unknown').toLowerCase();
      const rawMsg = String(error?.message || '');

      let genericType: GenericOrderErrorType = 'GENERIC_PROCESSING_FAILURE';
      if (rawCode.includes('permission') || rawCode === 'permission-denied') {
        genericType = 'SERVICE_PERMISSION_DENIED';
      } else if (rawCode.includes('network') || rawCode.includes('unavailable') || rawCode.includes('deadline')) {
        genericType = 'NETWORK_CONNECTIVITY_ISSUE';
      } else if (rawCode.includes('invalid') || rawCode.includes('argument') || rawMsg.includes('undefined')) {
        genericType = 'DATA_SCHEMA_MISMATCH';
      } else if (rawCode.includes('aborted')) {
        genericType = 'TRANSACTION_ABORTED';
      }

      // Sanitize message so internal endpoints or keys are never exposed
      const sanitized = rawMsg
        .replace(/https?:\/\/[^\s]+/g, '[REDACTED_URI]')
        .slice(0, 180) || 'Database service was unable to persist document.';

      setOrderDebugReport({
        genericType,
        errorCode: error?.code || 'NO_CODE',
        sanitizedMessage: sanitized,
        authMode: user ? 'AUTHENTICATED_USER' : 'GUEST_USER',
        timestamp: new Date().toLocaleTimeString(),
      });

      toast.error('Failed to place order. Diagnostic details are shown below.');
    } finally {
      setLoading(false);
    }
  };

  // Post-order action: Link with Google
  const handlePostOrderGoogleAuth = async () => {
    if (!completedOrder) return;
    setSavingAccount(true);
    try {
      await signInWithGoogle();
      toast.success('Google account connected! Redirecting to your order tracking...');
      router.push(`/order-status?orderNumber=${completedOrder.orderNumber}`);
    } catch (err) {
      console.error('Google Sign In error:', err);
    } finally {
      setSavingAccount(false);
    }
  };

  // Post-order action: Create password for phone
  const handlePostOrderSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedOrder) return;
    if (accountPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setSavingAccount(true);
    try {
      await registerWithPhone(completedOrder.phone, accountPassword, completedOrder.name);
      toast.success('Account created! You can now log in anytime with your phone number.');
      router.push(`/order-status?orderNumber=${completedOrder.orderNumber}`);
    } catch (err: any) {
      console.error('Account creation error:', err);
    } finally {
      setSavingAccount(false);
    }
  };

  // Transition screen shown immediately when order is placed
  if (orderTransition) {
    const handleTransitionDone = () => {
      if (orderTransition.isGuest) {
        setOrderTransition(null); // Reveals the guest account creation screen
      } else {
        router.push(`/order-status?orderNumber=${orderTransition.orderNumber}`);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-10 text-center animate-modal-pop relative overflow-hidden border border-emerald-100">
          {/* Decorative ambient background accents */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-primary-100/50 rounded-full blur-2xl pointer-events-none" />

          {/* Animated celebration icon */}
          <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-pulse-ring" />
            <div className="relative w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <FiCheckCircle className="w-10 h-10" />
            </div>
          </div>

          {/* Primary celebration headline */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Order Placed, Thank you! 🎉
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-5">
            Order #{orderTransition.orderNumber} Confirmed
          </p>

          {/* Phone call notice banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 mb-6 text-left shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <FiPhoneCall className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Important Notice</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  Kindly keep your phone number active, we&apos;ll call you to confirm the order.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Registered number:{' '}
                  <span className="font-bold text-gray-900">
                    {formatPakistaniPhone(orderTransition.phone)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleTransitionDone}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
          >
            <span>{orderTransition.isGuest ? 'Continue to Order Details' : 'View Order Details'}</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Modal / Screen shown after guest checkout
  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Order #{completedOrder.orderNumber} Placed!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you, <span className="font-semibold">{completedOrder.name}</span>. Your order is now being processed.
          </p>

          <div className="bg-primary-50 rounded-xl p-5 mb-8 text-left border border-primary-100">
            <h2 className="text-lg font-bold text-primary-900 mb-1 flex items-center gap-2">
              <FiLock className="w-5 h-5 text-primary-600" /> Save Your Account
            </h2>
            <p className="text-sm text-primary-800 leading-relaxed">
              We identified your account phone number as{' '}
              <span className="font-bold">{formatPakistaniPhone(completedOrder.phone)}</span>.
              Create a password or sign in with Google so you can easily track all your orders and checkout faster next time!
            </p>

            <div className="mt-5 space-y-4">
              {/* Option 1: Google Login */}
              <button
                type="button"
                onClick={handlePostOrderGoogleAuth}
                disabled={savingAccount}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 py-3 px-4 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <FcGoogle className="w-5 h-5" />
                <span>Continue & Link with Google</span>
              </button>

              <div className="flex items-center my-3">
                <div className="flex-grow border-t border-primary-200"></div>
                <span className="flex-shrink mx-3 text-xs text-primary-600 uppercase font-bold">OR SET PASSWORD</span>
                <div className="flex-grow border-t border-primary-200"></div>
              </div>

              {/* Option 2: Set Password */}
              <form onSubmit={handlePostOrderSetPassword} className="space-y-3">
                <div>
                  <input
                    type="password"
                    placeholder="Create password for your phone (min 6 chars)"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingAccount ? 'Saving Account...' : 'Set Password & Save Account'}
                </button>
              </form>
            </div>
          </div>

          <Link
            href={`/order-status?orderNumber=${completedOrder.orderNumber}`}
            className="text-sm font-semibold text-gray-600 hover:text-primary-600 inline-block"
          >
            Skip for now & track order →
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center bg-white border border-[#eae8e5] p-10 sm:p-14 rounded-3xl max-w-lg mx-auto shadow-xs">
          <span className="text-4xl mb-3 block">🛍️</span>
          <h1 className="font-serif text-3xl font-bold text-[#013428] mb-3">Your Bag is Empty</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Explore our handcrafted artificial velvet gajray and festive floral jewelry collection.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="inline-block bg-[#013428] text-white hover:bg-[#1e4b3e] px-8 py-3.5 rounded-full font-semibold text-sm shadow-[0_8px_20px_rgba(1,52,40,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
      <div className="mb-6 sm:mb-8">
        <span className="text-xs uppercase tracking-widest text-[#6b1d30] font-bold">
          Secure Checkout
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#013428] font-medium tracking-tight mt-1">
          Complete Your Order
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse"></span>
          <span>Cash on Delivery (COD) &amp; Express 2-3 Days Nationwide Courier across Pakistan</span>
        </p>
      </div>

      {/* Guest Login Banner */}
      {!user && (
        <div className="mb-8 p-4 bg-white border border-[#eae8e5] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6b1d30]/10 text-[#6b1d30] flex items-center justify-center flex-shrink-0 text-lg">
              <FiUser />
            </div>
            <div>
              <p className="font-serif font-bold text-gray-900 text-sm">Have a Google or Phone Account?</p>
              <p className="text-xs text-gray-500">Sign in for quick autofill and instant live order status tracking.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => signInWithGoogle()}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-full border border-gray-300 shadow-xs flex items-center gap-2"
            >
              <FcGoogle className="w-4 h-4" /> Sign In with Google
            </button>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#013428] hover:bg-[#1e4b3e] text-white text-xs font-semibold rounded-full shadow-xs"
            >
              Login
            </Link>
          </div>
        </div>
      )}

      {user && (
        <div className="mb-8 p-4 bg-[#e6f4ea] border border-[#a8dab5] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#013428] text-white flex items-center justify-center font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Ordering as <span className="text-[#013428] font-bold">{displayName}</span>
              </p>
              <p className="text-xs text-gray-600">
                {user.email && !isPhoneUser ? user.email : formatPakistaniPhone(phoneNumber)}
              </p>
            </div>
          </div>
          <span className="text-xs text-[#1e6b47] bg-white/80 border border-[#a8dab5] px-2.5 py-1 rounded-full font-semibold">
            Logged In
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-start">
        {/* Shipping Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eae8e5] shadow-xs">
          <h2 className="font-serif text-2xl font-bold mb-4 sm:mb-6 text-[#013428] flex items-center gap-2">
            <span className="text-[#6b1d30]">📍</span> Shipping Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="customerName" className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                id="customerName"
                required
                placeholder="e.g. Ayesha Khan"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-3 border border-[#eae8e5] rounded-xl focus:ring-2 focus:ring-[#013428] focus:border-transparent bg-[#fbf9f6] text-gray-900 text-sm"
              />
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1.5">
                Phone Number (11 digits, starts with 03) *
              </label>
              <input
                type="tel"
                id="customerPhone"
                required
                placeholder="03001234567"
                maxLength={14}
                value={formData.customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent bg-[#fbf9f6] text-gray-900 text-sm ${
                  phoneError ? 'border-red-500 focus:ring-red-500' : 'border-[#eae8e5] focus:ring-[#013428]'
                }`}
              />
              {phoneError ? (
                <p className="text-xs text-red-600 font-medium mt-1">{phoneError}</p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1">
                  11 digits starting with 03 (e.g. 03001234567). We call this number for confirmation.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                id="customerEmail"
                placeholder="your.email@example.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-4 py-3 border border-[#eae8e5] rounded-xl focus:ring-2 focus:ring-[#013428] focus:border-transparent bg-[#fbf9f6] text-gray-900 text-sm"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                If omitted, your phone number will be used to track your orders.
              </p>
            </div>

            <div>
              <label htmlFor="customerAddress" className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1.5">
                Complete Delivery Address *
              </label>
              <textarea
                id="customerAddress"
                rows={3}
                required
                placeholder="House/Apartment #, Street, Sector/Area, City"
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                className="w-full px-4 py-3 border border-[#eae8e5] rounded-xl focus:ring-2 focus:ring-[#013428] focus:border-transparent bg-[#fbf9f6] text-gray-900 text-sm"
              />
            </div>

            {/* Special Request */}
            <div>
              <label htmlFor="specialRequest" className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1.5">
                Special Request or Custom Notes (Optional)
              </label>
              <textarea
                id="specialRequest"
                rows={2}
                placeholder="Add any customization details, gift greeting, or special event date..."
                value={formData.specialRequest}
                onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
                className="w-full px-4 py-3 border border-[#eae8e5] rounded-xl focus:ring-2 focus:ring-[#013428] focus:border-transparent bg-[#fbf9f6] text-gray-900 text-sm"
              />
            </div>

            {/* Preferred Call Time */}
            <div className="bg-[#f5f3f0] p-4 sm:p-5 rounded-2xl border border-[#eae8e5]">
              <label className="block text-xs uppercase tracking-wider font-bold text-[#013428] mb-1">
                Preferred Confirmation Call Window (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select your preferred window for our atelier team to call for order confirmation:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { value: 'Morning 8-12 AM', label: '🌅 Morning (8 AM - 12 PM)' },
                  { value: 'Noon 12-3 PM', label: '☀️ Noon (12 PM - 3 PM)' },
                  { value: 'Afternoon 3-6 PM', label: '🌤️ Afternoon (3 PM - 6 PM)' },
                  { value: 'Night 6-10 PM', label: '🌙 Night (6 PM - 10 PM)' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                      formData.preferredCallTime === option.value
                        ? 'border-[#013428] bg-white text-[#013428] ring-2 ring-[#013428]'
                        : 'border-[#eae8e5] bg-white/70 text-gray-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="preferredCallTime"
                      value={option.value}
                      checked={formData.preferredCallTime === option.value}
                      onChange={(e) => setFormData({ ...formData, preferredCallTime: e.target.value })}
                      className="text-[#013428] focus:ring-[#013428] w-4 h-4"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {formData.preferredCallTime && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, preferredCallTime: '' })}
                  className="text-[11px] text-[#6b1d30] hover:underline mt-2 block font-medium"
                >
                  Clear call time preference
                </button>
              )}
            </div>

            <div className="p-4 bg-[#f5f3f0] rounded-2xl border border-[#eae8e5] flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-gray-800">Payment Method</p>
                <div className="flex items-center gap-2 text-xs text-gray-700 font-medium mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#34a853] inline-block animate-pulse"></span>
                  <span>Cash on Delivery (Pay when delivered)</span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#013428] bg-white px-3 py-1 rounded-full border border-[#eae8e5]">
                COD
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 min-h-[56px] bg-[#013428] hover:bg-[#1e4b3e] text-white py-3.5 px-6 rounded-full font-bold text-base shadow-[0_8px_20px_rgba(1,52,40,0.25)] transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Confirming Your Order...' : `Place Order — ${formatCurrency(getTotal())}`}</span>
            </button>

            {orderDebugReport && (
              <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-950 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
                    <span>🛠️ Order Diagnostic (Debug Mode)</span>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-semibold">
                    {orderDebugReport.timestamp}
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-gray-800">
                  <p>
                    <span className="font-semibold text-gray-700">Generic Type:</span>{' '}
                    <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                      {orderDebugReport.genericType}
                    </code>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Code:</span>{' '}
                    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono">
                      {orderDebugReport.errorCode}
                    </code>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Auth Mode:</span>{' '}
                    <span className="font-medium text-gray-900">{orderDebugReport.authMode}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Summary:</span>{' '}
                    <span className="text-gray-900 font-mono text-[11px] break-all">{orderDebugReport.sanitizedMessage}</span>
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-3xl shadow-xs border border-[#eae8e5] p-6 sm:p-8 sticky top-20 md:top-24">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#eae8e5]">
              <h2 className="font-serif text-2xl font-bold text-[#013428]">Order Summary</h2>
              <span className="text-xs text-[#6b1d30] font-bold bg-[#6b1d30]/10 px-2.5 py-0.5 rounded-full">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#eae8e5]"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[#eae8e5] pt-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">{formatCurrency(getTotal())}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nationwide Delivery Charges</span>
                <span className="font-bold text-[#1e6b47] bg-[#e6f4ea] px-2 py-0.5 rounded-full text-xs">FREE</span>
              </div>
              <div className="border-t border-[#eae8e5] pt-4 mt-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-serif text-lg font-bold text-gray-900">Total Payable</span>
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#013428]">
                    {formatCurrency(getTotal())}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Currency: PKR • Includes cash-on-delivery handling</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#eae8e5] flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">🔒 100% Safe Checkout</span>
              <span>•</span>
              <span className="flex items-center gap-1">🌸 Handmade Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
