'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getOrderByNumber } from '@/lib/firestore';
import { Order } from '@/lib/firestore';
import { formatCurrency, cleanPhoneNumber } from '@/lib/utils';
import Image from 'next/image';
import { FiCheckCircle, FiClock, FiPackage, FiTruck, FiXCircle, FiPhoneCall, FiLock, FiShield } from 'react-icons/fi';
import PWAInstallButton from '@/components/PWAInstallButton';

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const { user, phoneNumber, isPhoneUser } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchOrderNumber, setSearchOrderNumber] = useState(orderNumber || '');
  const [savedOrderNumbers, setSavedOrderNumbers] = useState<string[]>([]);
  
  // Security verification states
  const [authRequired, setAuthRequired] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [guestPhoneVerificationNeeded, setGuestPhoneVerificationNeeded] = useState(false);
  const [guestPhoneInput, setGuestPhoneInput] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      loadOrder(orderNumber);
    } else {
      setLoading(false);
    }
  }, [orderNumber, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedOrders = JSON.parse(localStorage.getItem('fz_orders') || '[]') as Array<{ orderNumber?: string }>;
      const unique = Array.from(
        new Set(savedOrders.map((o) => String(o.orderNumber || '').trim()).filter(Boolean))
      ).reverse();
      setSavedOrderNumbers(unique);
    } catch {
      setSavedOrderNumbers([]);
    }
  }, []);

  const verifyOrderAccess = (orderData: Order): boolean => {
    // Reset security gates
    setAuthRequired(false);
    setAccessDenied(false);
    setGuestPhoneVerificationNeeded(false);

    const userPhoneClean = phoneNumber ? cleanPhoneNumber(phoneNumber) : '';
    const orderPhoneClean = orderData.customerPhone ? cleanPhoneNumber(orderData.customerPhone) : '';
    const userEmailClean = user?.email?.toLowerCase().trim() || '';
    const orderEmailClean = orderData.customerEmail?.toLowerCase().trim() || '';

    // Check if order was created by a registered user account
    if (orderData.userId) {
      if (!user) {
        // Must be logged in to view an account order
        setAuthRequired(true);
        return false;
      }

      const isOwner =
        orderData.userId === user.uid ||
        (userEmailClean && userEmailClean === orderEmailClean) ||
        (userPhoneClean && userPhoneClean === orderPhoneClean);

      if (!isOwner) {
        // Logged in as a different user
        setAccessDenied(true);
        return false;
      }

      return true;
    }

    // Guest Order: check if this browser placed the order
    if (typeof window !== 'undefined') {
      const savedOrders = JSON.parse(localStorage.getItem('fz_orders') || '[]') as Array<{ orderNumber?: string }>;
      const isSavedInBrowser = savedOrders.some((o) => String(o.orderNumber).trim() === String(orderData.orderNumber).trim());
      if (isSavedInBrowser) return true;
    }

    // If logged in customer matches guest order phone/email
    if (user && ((userPhoneClean && userPhoneClean === orderPhoneClean) || (userEmailClean && userEmailClean === orderEmailClean))) {
      return true;
    }

    // Otherwise, require phone verification
    if (!phoneVerified) {
      setGuestPhoneVerificationNeeded(true);
      return false;
    }

    return true;
  };

  const loadOrder = async (ordNumber: string) => {
    setLoading(true);
    try {
      const orderData = await getOrderByNumber(ordNumber);
      if (orderData) {
        const allowed = verifyOrderAccess(orderData);
        setOrder(orderData);
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const inputClean = cleanPhoneNumber(guestPhoneInput);
    const orderClean = cleanPhoneNumber(order.customerPhone);

    if (inputClean && inputClean === orderClean) {
      setPhoneVerified(true);
      setGuestPhoneVerificationNeeded(false);
    } else {
      alert('Phone number does not match this order. Please enter the phone number provided during checkout.');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderNumber) {
      loadOrder(searchOrderNumber);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'confirmed':
        return <FiCheckCircle className="w-5 h-5 text-[#1e6b47]" />;
      case 'processing':
        return <FiPackage className="w-5 h-5 text-[#013428]" />;
      case 'shipped':
        return <FiTruck className="w-5 h-5 text-[#6b1d30]" />;
      case 'delivered':
        return <FiCheckCircle className="w-5 h-5 text-[#1e6b47]" />;
      case 'cancelled':
        return <FiXCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FiClock className="w-5 h-5 text-amber-600" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#e6f4ea] text-[#1e6b47] border border-[#a8dab5]';
      case 'processing':
        return 'bg-[#bdeddb] text-[#002018] border border-[#a1d0bf]';
      case 'shipped':
        return 'bg-[#ffdead] text-[#4e1220] border border-[#dca84e]/40';
      case 'delivered':
        return 'bg-[#e6f4ea] text-[#1e6b47] border border-[#a8dab5]';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="text-xs uppercase tracking-widest text-[#6b1d30] font-bold">
          Live Status Verification
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#013428] font-medium tracking-tight mt-1">
          Track Your Gajray Order
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          Enter your order number below to check crafting, confirmation, and nationwide shipping status.
        </p>
      </div>

      {!order && (
        <div className="max-w-md mx-auto mb-10">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl border border-[#eae8e5] shadow-xs">
            <input
              type="text"
              placeholder="Order number (e.g., 1001)"
              list="fz-saved-orders"
              value={searchOrderNumber}
              onChange={(e) => setSearchOrderNumber(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#013428] bg-[#fbf9f6] text-gray-900 text-sm"
            />
            <datalist id="fz-saved-orders">
              {savedOrderNumbers.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <button
              type="submit"
              className="bg-[#013428] hover:bg-[#1e4b3e] text-white px-7 py-3 rounded-xl font-semibold text-sm transition-all shadow-xs w-full sm:w-auto"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#013428]"></div>
          <p className="text-xs text-gray-500 mt-3 font-medium">Looking up order records...</p>
        </div>
      ) : order && authRequired ? (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xs border border-[#eae8e5] p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-[#ffdead] text-[#4e1220] rounded-full flex items-center justify-center mx-auto text-xl">
            <FiLock />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#013428]">Account Sign-In Required</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Order #{order.orderNumber} is linked to a registered customer account. Sign in to view order details.
          </p>
          <Link
            href={`/login`}
            className="inline-block w-full py-3 px-4 bg-[#013428] hover:bg-[#1e4b3e] text-white font-bold rounded-full shadow-xs transition-colors text-sm"
          >
            Sign In to View Order
          </Link>
        </div>
      ) : order && accessDenied ? (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xs border border-red-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl">
            <FiShield />
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            This order does not belong to your account. Customers can only view orders placed under their own account.
          </p>
          <Link
            href="/account"
            className="inline-block w-full py-3 px-4 bg-[#013428] hover:bg-[#1e4b3e] text-white font-bold rounded-full shadow-xs transition-colors text-sm"
          >
            Go to My Orders
          </Link>
        </div>
      ) : order && guestPhoneVerificationNeeded ? (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xs border border-[#eae8e5] p-8 space-y-5">
          <div className="w-14 h-14 bg-[#013428]/10 text-[#013428] rounded-full flex items-center justify-center mx-auto text-xl">
            <FiShield />
          </div>
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold text-[#013428]">Customer Verification</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Please enter the 11-digit phone number used for Order #{order.orderNumber} to unlock delivery details.
            </p>
          </div>
          <form onSubmit={handlePhoneVerifySubmit} className="space-y-4">
            <input
              type="tel"
              required
              placeholder="e.g. 03001234567"
              value={guestPhoneInput}
              onChange={(e) => setGuestPhoneInput(e.target.value)}
              className="w-full px-4 py-3 border border-[#eae8e5] rounded-xl focus:ring-2 focus:ring-[#013428] bg-[#fbf9f6] text-gray-900 text-sm"
            />
            <button
              type="submit"
              className="w-full py-3.5 bg-[#013428] hover:bg-[#1e4b3e] text-white font-bold rounded-full transition-all shadow-xs text-sm"
            >
              Verify &amp; View Order
            </button>
          </form>
        </div>
      ) : order ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl shadow-xs border border-[#eae8e5] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 pb-6 border-b border-[#eae8e5]">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#6b1d30] font-bold">
                  Order Details
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#013428] mt-0.5">
                  Order #{order.orderNumber}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Placed on {order.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)} w-fit`}>
                {getStatusIcon(order.status)}
                <span>{order.status}</span>
              </div>
            </div>

            {/* Order Confirmation Call Reminder */}
            {order.status === 'processing' && (
              <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-[#e6f4ea] via-emerald-50 to-[#e6f4ea] border border-[#a8dab5] rounded-2xl">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#013428] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <FiPhoneCall className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#002018]">Order Confirmation in Progress</h4>
                    <p className="text-xs sm:text-sm text-[#013428] mt-0.5">
                      Kindly keep your phone active ({order.customerPhone}), our atelier team will call to confirm your delivery details.
                    </p>
                    {order.preferredCallTime && (
                      <p className="text-xs text-[#1e6b47] font-semibold mt-1">
                        Preferred contact window: <span className="capitalize">{order.preferredCallTime}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Reason Alert for Customer */}
            {order.status === 'cancelled' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <FiXCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Order Cancellation Details</h4>
                    <p className="text-xs sm:text-sm text-red-700 mt-1">
                      Reason: <span className="font-semibold">{order.cancellationReason || 'Cancelled by store admin or customer request'}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-serif text-lg font-bold text-[#013428] mb-4">Ordered Floral Pieces</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-[#fbf9f6] border border-[#eae8e5]">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                        <Image
                          src={item.image || 'https://via.placeholder.com/100x100?text=Flower'}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#013428]">{item.productName}</h4>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                    <p className="font-serif font-bold text-sm text-[#013428]">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#eae8e5] pt-5 mt-6 flex justify-between items-baseline">
              <span className="font-serif text-lg font-bold text-gray-900">Total Payable (COD)</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#013428]">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xs border border-[#eae8e5] p-6 sm:p-8 space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#013428] border-b border-[#eae8e5] pb-3">
              Delivery Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-700">
              <div>
                <p><strong>Recipient Name:</strong> {order.customerName}</p>
                <p className="mt-1.5"><strong>Phone Number:</strong> {order.customerPhone}</p>
                {order.customerEmail && !order.customerEmail.includes('@phone.') && (
                  <p className="mt-1"><strong>Email:</strong> {order.customerEmail}</p>
                )}
                <p className="mt-1"><strong>Address:</strong> {order.customerAddress}</p>
              </div>

              <div className="space-y-2">
                {order.preferredCallTime && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                    <span className="font-bold text-blue-900 block">📞 Preferred Call Time:</span>
                    <span className="text-blue-800">{order.preferredCallTime}</span>
                  </div>
                )}
                {order.specialRequest && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                    <span className="font-bold text-amber-900 block">📝 Special Request:</span>
                    <span className="text-amber-800">{order.specialRequest}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PWA Install Button - Using Component */}
          <PWAInstallButton
            variant="prominent"
            className="mt-6"
            title="Install app to track your order"
            description="Get faster access to order status updates on your phone."
            buttonText="Install App"
          />
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No order found. Please check your order number and try again.</p>
        </div>
      )}
    </div>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    }>
      <OrderStatusContent />
    </Suspense>
  );
}

