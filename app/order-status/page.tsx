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
        return <FiCheckCircle className="w-6 h-6 text-green-600" />;
      case 'processing':
        return <FiPackage className="w-6 h-6 text-blue-600" />;
      case 'shipped':
        return <FiTruck className="w-6 h-6 text-purple-600" />;
      case 'delivered':
        return <FiCheckCircle className="w-6 h-6 text-green-600" />;
      case 'cancelled':
        return <FiXCircle className="w-6 h-6 text-red-600" />;
      default:
        return <FiClock className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center">Order Tracking</h1>

      {!order && (
        <div className="max-w-md mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter order number (e.g., 1001)"
              list="fz-saved-orders"
              value={searchOrderNumber}
              onChange={(e) => setSearchOrderNumber(e.target.value)}
              className="flex-1 px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
            />
            <datalist id="fz-saved-orders">
              {savedOrderNumbers.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors w-full sm:w-auto"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : order && authRequired ? (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <FiLock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Account Sign-In Required</h2>
          <p className="text-sm text-gray-600">
            Order #{order.orderNumber} is linked to a registered customer account. To protect customer privacy, you must sign in with that account to view order details.
          </p>
          <Link
            href={`/login`}
            className="inline-block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            Sign In to View Order
          </Link>
        </div>
      ) : order && accessDenied ? (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md border border-red-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <FiShield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-600">
            This order does not belong to your account. Customers can only view orders placed under their own account.
          </p>
          <Link
            href="/account"
            className="inline-block w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-colors"
          >
            Go to My Orders
          </Link>
        </div>
      ) : order && guestPhoneVerificationNeeded ? (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-8 space-y-5">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <FiShield className="w-7 h-7" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Customer Verification</h2>
            <p className="text-xs text-gray-500 mt-1">
              For customer privacy, please enter the phone number used when placing Order #{order.orderNumber} to unlock delivery details.
            </p>
          </div>
          <form onSubmit={handlePhoneVerifySubmit} className="space-y-4">
            <input
              type="tel"
              required
              placeholder="e.g. 03001234567"
              value={guestPhoneInput}
              onChange={(e) => setGuestPhoneInput(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow"
            >
              Verify & View Order
            </button>
          </form>
        </div>
      ) : order ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Order #{order.orderNumber}</h2>
                <p className="text-gray-600">
                  Placed on {order.createdAt.toDate().toLocaleDateString()}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(order.status)} w-fit`}>
                {getStatusIcon(order.status)}
                <span className="font-semibold capitalize">{order.status}</span>
              </div>
            </div>

            {/* Order Confirmation Call Reminder */}
            {order.status === 'processing' && (
              <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <FiPhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Order Confirmation in Progress</h4>
                    <p className="text-sm text-emerald-800 mt-0.5">
                      Kindly keep your phone number active ({order.customerPhone}), we&apos;ll call you to confirm your order.
                    </p>
                    {order.preferredCallTime && (
                      <p className="text-xs text-emerald-700 font-medium mt-1">
                        Preferred contact time: <span className="font-semibold capitalize">{order.preferredCallTime}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Reason Alert for Customer */}
            {order.status === 'cancelled' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <FiXCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Order Cancellation Details</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Reason: <span className="font-semibold">{order.cancellationReason || 'Cancelled by store admin or customer request'}</span>
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      If you have questions regarding this cancellation, please contact our support team via WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                      <Image
                        src={item.image || 'https://via.placeholder.com/100x100?text=Flower'}
                        alt={item.productName}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{item.productName}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold whitespace-nowrap">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg sm:text-xl font-bold">Total</span>
                <span className="text-xl sm:text-2xl font-bold text-primary-600">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Delivery & Confirmation Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p><strong>Name:</strong> {order.customerName}</p>
                <p className="mt-1"><strong>Phone:</strong> {order.customerPhone}</p>
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

