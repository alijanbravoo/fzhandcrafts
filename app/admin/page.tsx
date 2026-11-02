'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getOrders } from '@/lib/firestore';
import { Order } from '@/lib/firestore';
import { formatCurrency } from '@/lib/utils';
import AdminProtected from '@/components/AdminProtected';
import toast from 'react-hot-toast';
import { FiPackage, FiDollarSign, FiUsers, FiArrowRight, FiTruck } from 'react-icons/fi';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const allOrders = await getOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentOrders = orders.slice(0, 5);
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 flex w-full max-w-full overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 w-full max-w-full min-w-0 overflow-x-hidden">
          {/* Top Bar Banner */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 mt-0.5">Overview of store activity, revenue and recent orders</p>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-20 sm:pt-20 lg:pt-8 w-full max-w-full min-w-0">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 w-full min-w-0">
              <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 sm:p-6 min-w-0">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider truncate">
                      Total Revenue
                    </p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#013428] mt-1 sm:mt-2 truncate" title={formatCurrency(totalRevenue)}>
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#013428] flex items-center justify-center shrink-0">
                    <FiDollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 sm:p-6 min-w-0">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider truncate">
                      Total Orders
                    </p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#6b1d30] mt-1 sm:mt-2 truncate">
                      {totalOrders}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#6b1d30] flex items-center justify-center shrink-0">
                    <FiPackage className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 sm:p-6 min-w-0 sm:col-span-2 md:col-span-1">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider truncate">
                      Pending Processing
                    </p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-amber-600 mt-1 sm:mt-2 truncate">
                      {pendingOrders}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FiUsers className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden w-full max-w-full min-w-0">
              <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900">Recent Orders</h2>
                  <p className="text-xs text-gray-500">Latest orders submitted by customers</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs font-semibold text-[#013428] hover:underline flex items-center gap-1"
                >
                  <span>All Orders</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#013428]"></div>
                  <p className="text-xs text-gray-500 mt-2">Loading recent orders...</p>
                </div>
              ) : recentOrders.length > 0 ? (
                <>
                  {/* Mobile Cards (Strictly bounded with min-w-0 to prevent overflow on small screens) */}
                  <div className="p-3.5 sm:p-4 space-y-3 md:hidden w-full max-w-full min-w-0">
                    {recentOrders.map((order) => {
                      const formattedDate = order.createdAt?.toDate 
                        ? order.createdAt.toDate().toLocaleDateString() 
                        : 'Recent';

                      return (
                        <div 
                          key={order.id} 
                          className="bg-gray-50/70 border border-gray-200/90 rounded-2xl p-4 w-full max-w-full min-w-0 shadow-2xs space-y-3 overflow-hidden"
                        >
                          {/* Card Header: Order No & Status Badge */}
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                                Order No.
                              </span>
                              <Link
                                href={`/admin/orders/view?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                                className="text-sm font-mono font-bold text-[#013428] hover:underline truncate block"
                              >
                                #{order.orderNumber}
                              </Link>
                            </div>
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs leading-none font-semibold rounded-full shrink-0 ${
                                order.status === 'processing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'shipped'
                                  ? 'bg-purple-100 text-purple-800'
                                  : order.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          {/* Customer & Total */}
                          <div className="flex items-baseline justify-between gap-3 pt-2.5 border-t border-gray-200/60 min-w-0">
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {order.customerName || 'Customer'}
                              </p>
                              {order.customerEmail && (
                                <p className="text-[11px] text-gray-500 truncate break-all">
                                  {order.customerEmail}
                                </p>
                              )}
                              {order.customerPhone && (
                                <p className="text-[11px] text-gray-500 font-mono">
                                  {order.customerPhone}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Total</span>
                              <span className="text-sm sm:text-base font-bold text-[#013428]">
                                {formatCurrency(order.total)}
                              </span>
                            </div>
                          </div>

                          {/* Courier Tracking Badge if present */}
                          {order.courierTrackingNumber && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-[11px] font-mono">
                              <FiTruck className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{order.courierName || 'Courier'}: {order.courierTrackingNumber}</span>
                            </div>
                          )}

                          {/* Card Footer: Date & CTA */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-gray-200/60 text-xs min-w-0">
                            <span className="text-gray-400 text-[11px] truncate">
                              {formattedDate}
                            </span>
                            <Link
                              href={`/admin/orders/view?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#013428] hover:bg-[#1e4b3e] text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
                            >
                              <span>View Details</span>
                              <FiArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto w-full">
                    <table className="w-full">
                      <thead className="bg-gray-50/80 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3.5 text-left font-semibold">Order</th>
                          <th className="px-6 py-3.5 text-left font-semibold">Customer</th>
                          <th className="px-6 py-3.5 text-left font-semibold">Total</th>
                          <th className="px-6 py-3.5 text-left font-semibold">Status</th>
                          <th className="px-6 py-3.5 text-left font-semibold">Tracking</th>
                          <th className="px-6 py-3.5 text-left font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100 text-sm">
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/admin/orders/view?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                                className="text-[#013428] hover:underline font-mono font-bold"
                              >
                                #{order.orderNumber}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {order.customerName}
                                </div>
                                <div className="text-xs text-gray-500">{order.customerEmail || order.customerPhone}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-[#013428]">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 inline-flex text-xs leading-none font-semibold rounded-full ${
                                  order.status === 'processing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : order.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'shipped'
                                    ? 'bg-purple-100 text-purple-800'
                                    : order.status === 'delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                              {order.courierTrackingNumber ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-gray-800">
                                  <FiTruck className="w-3 h-3 text-gray-500" />
                                  <span>{order.courierTrackingNumber}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                              {order.createdAt?.toDate 
                                ? order.createdAt.toDate().toLocaleDateString() 
                                : 'Recent'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No orders yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
