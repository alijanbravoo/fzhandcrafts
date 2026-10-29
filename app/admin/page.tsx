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
import { FiPackage, FiDollarSign, FiUsers } from 'react-icons/fi';
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
          <div className="bg-white shadow">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="py-4">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-16 lg:pt-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider break-words">
                    Total Revenue
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-primary-600 mt-1 sm:mt-2 truncate" title={formatCurrency(totalRevenue)}>
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <FiDollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 opacity-40 shrink-0" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider break-words">
                    Total Orders
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-blue-600 mt-1 sm:mt-2 truncate">
                    {totalOrders}
                  </p>
                </div>
                <FiPackage className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 opacity-40 shrink-0" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 min-w-0 sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider break-words">
                    Pending Orders
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-yellow-600 mt-1 sm:mt-2 truncate">
                    {pendingOrders}
                  </p>
                </div>
                <FiUsers className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 opacity-40 shrink-0" />
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Recent Orders</h2>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : recentOrders.length > 0 ? (
              <>
                <div className="p-4 space-y-4 md:hidden">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Order</p>
                          <p className="text-lg font-bold">#{order.orderNumber}</p>
                          <p className="text-sm text-gray-700 mt-1">{order.customerName}</p>
                          <p className="text-sm text-gray-500">{order.customerEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="font-semibold">{formatCurrency(order.total)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {order.createdAt.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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

                        <Link
                          href={`/admin/orders/view?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/orders/view?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-gray-500">{order.customerEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt.toDate().toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No orders yet.</p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}



