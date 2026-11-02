'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getOrderByNumber } from '@/lib/firestore';
import { Order } from '@/lib/firestore';
import { formatCurrency, cleanPhoneNumber } from '@/lib/utils';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { 
  FiCheckCircle, 
  FiClock, 
  FiPackage, 
  FiTruck, 
  FiXCircle, 
  FiPhoneCall, 
  FiShield, 
  FiCopy, 
  FiSearch,
  FiPhone,
  FiHash,
  FiArrowRight,
  FiAlertCircle
} from 'react-icons/fi';
import PWAInstallButton from '@/components/PWAInstallButton';

// Strip all non-digits: match numbers only (ignoring spaces, dashes, parentheses)
const digitsOnly = (val: string): string => (val || '').replace(/\D/g, '');

const checkPhonesMatch = (inputPhone: string, orderPhone: string): boolean => {
  const cleanInput = digitsOnly(inputPhone);
  const cleanOrder = digitsOnly(orderPhone);
  if (!cleanInput || !cleanOrder) return false;
  if (cleanInput === cleanOrder) return true;
  // Handle Pakistani country prefix variations (e.g., 923001234567 vs 03001234567)
  return cleanInput.slice(-10) === cleanOrder.slice(-10);
};

function OrderStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('orderNumber');
  const { user, phoneNumber, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search inputs
  const [searchOrderNumber, setSearchOrderNumber] = useState(orderNumberParam || '');
  const [searchPhone, setSearchPhone] = useState('');
  
  // Verification states
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // If a logged-in user visits the generic track order page, take them to My Orders & Account
  useEffect(() => {
    if (!authLoading && user && !orderNumberParam) {
      router.replace('/account');
    }
  }, [user, authLoading, orderNumberParam, router]);

  // Load order if orderNumberParam is in query
  useEffect(() => {
    if (orderNumberParam) {
      loadOrder(orderNumberParam);
    } else {
      setLoading(false);
    }
  }, [orderNumberParam, user]);

  const loadOrder = async (ordNum: string, phoneInputOverride?: string) => {
    const cleanNum = ordNum.trim().replace(/^#/, '');
    if (!cleanNum) {
      toast.error('Please enter an order number');
      setLoading(false);
      return;
    }

    setLoading(true);
    setVerificationError(null);

    try {
      const orderData = await getOrderByNumber(cleanNum);
      if (!orderData) {
        setOrder(null);
        setNeedsPhoneVerification(false);
        setPhoneVerified(false);
        toast.error(`Order #${cleanNum} not found. Please double-check your order number.`);
        setLoading(false);
        return;
      }

      setOrder(orderData);

      // 1. If user is logged in: verify ownership
      if (user) {
        const userPhoneClean = phoneNumber ? digitsOnly(phoneNumber) : '';
        const orderPhoneClean = digitsOnly(orderData.customerPhone);
        const userEmailClean = user.email?.toLowerCase().trim() || '';
        const orderEmailClean = orderData.customerEmail?.toLowerCase().trim() || '';

        const isOwner =
          orderData.userId === user.uid ||
          (userEmailClean && userEmailClean === orderEmailClean) ||
          (userPhoneClean && userPhoneClean.slice(-10) === orderPhoneClean.slice(-10));

        if (isOwner) {
          setPhoneVerified(true);
          setNeedsPhoneVerification(false);
          setLoading(false);
          return;
        }
      }

      // 2. Non-account / Guest user: require phone number match
      const phoneToTest = phoneInputOverride || searchPhone;
      if (phoneToTest.trim()) {
        if (checkPhonesMatch(phoneToTest, orderData.customerPhone)) {
          setPhoneVerified(true);
          setNeedsPhoneVerification(false);
        } else {
          setPhoneVerified(false);
          setNeedsPhoneVerification(true);
          setVerificationError('Phone number does not match this order. Please enter the contact number used during checkout.');
        }
      } else {
        // Need phone verification before showing order details
        setPhoneVerified(false);
        setNeedsPhoneVerification(true);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOrderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }
    loadOrder(searchOrderNumber, searchPhone);
  };

  const handlePhoneVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (!searchPhone.trim()) {
      toast.error('Please enter your contact phone number');
      return;
    }

    if (checkPhonesMatch(searchPhone, order.customerPhone)) {
      setPhoneVerified(true);
      setNeedsPhoneVerification(false);
      setVerificationError(null);
      toast.success('Identity verified! Showing order details.');
    } else {
      setVerificationError('Phone number does not match this order. Please enter the contact number provided during checkout.');
      toast.error('Phone number does not match order.');
    }
  };

  const copyTrackingNumber = () => {
    if (!order?.courierTrackingNumber) return;
    navigator.clipboard.writeText(order.courierTrackingNumber);
    setCopiedTracking(true);
    toast.success('Courier tracking number copied!');
    setTimeout(() => setCopiedTracking(false), 2000);
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
      {/* Header Banner */}
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="text-xs uppercase tracking-widest text-[#6b1d30] font-bold">
          Live Status Verification
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#013428] font-medium tracking-tight mt-1">
          Track Your Gajray Order
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          Enter your order number and phone number to verify and check live crafting, dispatch, and courier tracking details.
        </p>

        {user && (
          <div className="mt-4 inline-flex items-center gap-2 p-2 px-4 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <span>Signed in as <strong>{user.displayName || user.email}</strong>.</span>
            <Link href="/account" className="underline font-bold hover:text-emerald-950">
              View All My Orders →
            </Link>
          </div>
        )}
      </div>

      {/* Guest Search Form (Shown when no order is displayed or to search a different order) */}
      {(!order || needsPhoneVerification) && (
        <div className="max-w-lg mx-auto mb-10">
          <form 
            onSubmit={needsPhoneVerification && order ? handlePhoneVerifySubmit : handleSearchSubmit} 
            className="bg-white p-6 sm:p-8 rounded-3xl border border-[#eae8e5] shadow-xs space-y-4"
          >
            <div className="text-center pb-2 border-b border-[#eae8e5]">
              <div className="w-12 h-12 rounded-2xl bg-[#013428]/10 text-[#013428] flex items-center justify-center mx-auto mb-2 text-xl">
                <FiShield />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#013428]">
                {needsPhoneVerification && order ? `Verify Phone for Order #${order.orderNumber}` : 'Look Up Your Order'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                For customer privacy, phone number verification is required.
              </p>
            </div>

            {verificationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2">
                <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{verificationError}</span>
              </div>
            )}

            {/* Order Number Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Order Number
              </label>
              <div className="relative">
                <FiHash className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 1001"
                  value={searchOrderNumber}
                  onChange={(e) => setSearchOrderNumber(e.target.value)}
                  disabled={!!(needsPhoneVerification && order)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#013428] bg-[#fbf9f6] text-gray-900 text-sm font-mono font-medium disabled:opacity-75 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contact Phone Number (Used at Checkout)
              </label>
              <div className="relative">
                <FiPhone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0300-1234567 or 03001234567"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#013428] bg-[#fbf9f6] text-gray-900 text-sm font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Spaces and dashes are automatically ignored. Only numbers are verified.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#013428] hover:bg-[#1e4b3e] text-white rounded-full font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>{needsPhoneVerification && order ? 'Verify Phone & View Order' : 'Track Order Status'}</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {needsPhoneVerification && order && (
              <button
                type="button"
                onClick={() => {
                  setOrder(null);
                  setNeedsPhoneVerification(false);
                  setSearchOrderNumber('');
                  setSearchPhone('');
                  setVerificationError(null);
                }}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-800 py-1"
              >
                ← Search a different order number
              </button>
            )}
          </form>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#013428]"></div>
          <p className="text-xs text-gray-500 mt-3 font-medium">Looking up order details...</p>
        </div>
      )}

      {/* Verified Order Details (Only visible when phoneVerified === true) */}
      {!loading && order && phoneVerified && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Order Header Card */}
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
                  Placed on {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent'}
                </p>
              </div>
              <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)} w-fit`}>
                {getStatusIcon(order.status)}
                <span>{order.status}</span>
              </div>
            </div>

            {/* Courier Tracking Banner (Adjustment 4) */}
            {order.courierTrackingNumber && (
              <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-purple-50 via-purple-50/60 to-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FiTruck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
                      Courier Dispatch Tracking
                    </span>
                    <p className="text-base font-bold text-purple-950 font-mono mt-0.5">
                      {order.courierName ? `${order.courierName}: ` : ''}{order.courierTrackingNumber}
                    </p>
                    <p className="text-[11px] text-purple-800 mt-0.5">
                      Your parcel has been booked for nationwide express delivery.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyTrackingNumber}
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-full text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
                >
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>{copiedTracking ? 'Copied Tracking #' : 'Copy Tracking #'}</span>
                </button>
              </div>
            )}

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
                      Kindly keep your phone active ({order.customerPhone}), our team will call to confirm your delivery address.
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

            {/* Cancellation Reason Alert */}
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

            {/* Ordered Items List */}
            <div>
              <h3 className="font-serif text-lg font-bold text-[#013428] mb-4">Ordered Floral Pieces</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-[#fbf9f6] border border-[#eae8e5]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                        <Image
                          src={item.image || 'https://via.placeholder.com/100x100?text=Flower'}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-sm text-[#013428] truncate">{item.productName}</h4>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                    <p className="font-serif font-bold text-sm text-[#013428] shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Payable */}
            <div className="border-t border-[#eae8e5] pt-5 mt-6 flex justify-between items-baseline">
              <span className="font-serif text-lg font-bold text-gray-900">Total Payable (COD)</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#013428]">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>

          {/* Delivery Information Card */}
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
                    <span className="text-blue-800 capitalize">{order.preferredCallTime}</span>
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

          {/* Action Bar */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                setOrder(null);
                setPhoneVerified(false);
                setNeedsPhoneVerification(false);
                setSearchOrderNumber('');
                setSearchPhone('');
              }}
              className="text-xs font-semibold text-[#013428] hover:underline"
            >
              ← Track Another Order
            </button>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton
            variant="prominent"
            className="mt-6"
            title="Install app to track your order"
            description="Get faster access to order status updates on your phone."
            buttonText="Install App"
          />
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
