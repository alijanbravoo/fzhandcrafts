'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Order, getCustomerOrders } from '@/lib/firestore';
import { formatCurrency, formatPakistaniPhone } from '@/lib/utils';
import { FiPackage, FiLogOut, FiShoppingBag, FiTruck, FiClock, FiCheck } from 'react-icons/fi';

export default function CustomerAccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, displayName, isPhoneUser, phoneNumber, logout } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoadingOrders(true);
        const data = await getCustomerOrders({
          userId: user.uid,
          email: user.email && !isPhoneUser ? user.email : undefined,
          phone: phoneNumber || undefined,
        });

        // Also check if any orders were stored in localStorage for this browser
        if (typeof window !== 'undefined') {
          const localOrders: { orderNumber: string }[] = JSON.parse(
            localStorage.getItem('fz_orders') || '[]'
          );
          // If Firestore returned some, data already contains them; otherwise keep them
        }

        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, isPhoneUser, phoneNumber]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="mt-3 text-gray-500 text-sm">Loading your account...</p>
      </div>
    );
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Account Overview Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-500">
              {isPhoneUser
                ? `Phone Account: ${formatPakistaniPhone(phoneNumber)}`
                : user?.email}
            </p>
            <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
              Verified Customer
            </span>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiPackage className="text-primary-600" /> My Orders ({orders.length})
          </h2>
          <Link
            href="/products"
            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Browse More Products →
          </Link>
        </div>

        {loadingOrders ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm">Fetching your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              You haven&apos;t placed any orders yet, or your orders were placed under a different phone number.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/products"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
              >
                Shop Flowers & Gajray
              </Link>
              <Link
                href="/order-status"
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Track by Order #
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id || order.orderNumber}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                  <div>
                    <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">
                      Order Number
                    </span>
                    <span className="text-xl font-black text-gray-900">#{order.orderNumber}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <Link
                      href={`/order-status?orderNumber=${order.orderNumber}`}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1 rounded-lg"
                    >
                      Live Tracking →
                    </Link>
                  </div>
                </div>

                <div className="py-4 space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-12 h-12 rounded-lg object-cover border"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            Quantity: {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm">
                  <div className="text-xs text-gray-500">
                    Delivery to: {order.customerAddress.slice(0, 35)}...
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 mr-2">Total Paid (COD):</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
