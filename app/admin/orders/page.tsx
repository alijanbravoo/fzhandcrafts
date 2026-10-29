'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getOrders, updateOrderStatus, updateOrderCallStatus, Order } from '@/lib/firestore';
import { formatCurrency, formatPakistaniPhone, cleanPhoneNumber } from '@/lib/utils';
import AdminProtected from '@/components/AdminProtected';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';
import { 
  FiSearch, 
  FiDownload, 
  FiCalendar, 
  FiPhoneCall, 
  FiAlertCircle, 
  FiFilter, 
  FiX, 
  FiCheck,
  FiExternalLink
} from 'react-icons/fi';

const CALL_STATUS_OPTIONS = [
  { value: 'pending', label: '⏳ Pending Call', badge: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'picked_confirmed', label: '✅ Picked - order confirmed', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'picked_cancelled', label: '❌ Picked - order Cancelled', badge: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'not_picked', label: '📞 Not picked', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'hung_up', label: '📴 Hung up', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
];

const PRESET_CANCEL_REASONS = [
  'Customer requested cancellation',
  'Call not picked after multiple attempts',
  'Customer hung up on confirmation call',
  'Fake or invalid contact details',
  'Out of stock / Material unavailable',
  'Customer changed delivery address/date out of service area',
  'Other (Custom Reason)',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [callFilter, setCallFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await getOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = order.orderNumber.toLowerCase().includes(q);
        const matchName = order.customerName.toLowerCase().includes(q);
        const matchPhone = cleanPhoneNumber(order.customerPhone).includes(cleanPhoneNumber(q));
        if (!matchNum && !matchName && !matchPhone) return false;
      }

      // Status
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Call status
      if (callFilter !== 'all') {
        const currentCall = order.confirmationCallStatus || 'pending';
        if (currentCall !== callFilter) return false;
      }

      // Date Range
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : null;
      if (orderDate) {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, callFilter, startDate, endDate]);

  // Update Call Status
  const handleCallStatusChange = async (orderId: string, orderNumber: string, newCallStatus: string) => {
    try {
      await updateOrderCallStatus(orderNumber, newCallStatus);
      setOrders((prev) =>
        prev.map((o) => (o.orderNumber === orderNumber ? { ...o, confirmationCallStatus: newCallStatus } : o))
      );
      toast.success(`Call status updated for #${orderNumber}`);
    } catch (err) {
      console.error('Error updating call status:', err);
      toast.error('Failed to update call status');
    }
  };

  // Update Order Status (handles cancel flow)
  const handleOrderStatusChange = async (order: Order, newStatus: Order['status']) => {
    if (newStatus === 'cancelled') {
      setCancellingOrder(order);
      setSelectedReason(PRESET_CANCEL_REASONS[0]);
      setCustomReason('');
      return;
    }

    try {
      await updateOrderStatus(order.orderNumber, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.orderNumber === order.orderNumber ? { ...o, status: newStatus } : o))
      );
      toast.success(`Order #${order.orderNumber} status changed to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update order status');
    }
  };

  // Confirm Cancellation with Reason
  const submitCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;

    const finalReason = selectedReason === 'Other (Custom Reason)'
      ? (customReason.trim() || 'Order cancelled by store')
      : selectedReason;

    setSubmittingCancel(true);
    try {
      await updateOrderStatus(cancellingOrder.orderNumber, 'cancelled', finalReason);
      setOrders((prev) =>
        prev.map((o) =>
          o.orderNumber === cancellingOrder.orderNumber
            ? { ...o, status: 'cancelled', cancellationReason: finalReason }
            : o
        )
      );
      toast.success(`Order #${cancellingOrder.orderNumber} cancelled`);
      setCancellingOrder(null);
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error('Failed to cancel order');
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Export to CSV
  const downloadOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone Number',
      'Email',
      'Delivery Address',
      'Items Summary',
      'Total Amount (PKR)',
      'Order Status',
      'Confirmation Call Status',
      'Cancellation Reason',
      'Special Request',
      'Preferred Call Time'
    ];

    const rows = filteredOrders.map((o) => {
      const dateStr = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : '';
      const itemsStr = o.items.map((i) => `${i.productName} (x${i.quantity})`).join('; ');

      return [
        `"${o.orderNumber}"`,
        `"${dateStr}"`,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        `"${(o.customerEmail || '').replace(/"/g, '""')}"`,
        `"${(o.customerAddress || '').replace(/"/g, '""')}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        o.total || 0,
        `"${o.status}"`,
        `"${o.confirmationCallStatus || 'pending'}"`,
        `"${(o.cancellationReason || '').replace(/"/g, '""')}"`,
        `"${(o.specialRequest || '').replace(/"/g, '""')}"`,
        `"${o.preferredCallTime || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders CSV downloaded successfully');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCallFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 flex w-full max-w-full overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 w-full max-w-full min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-16 lg:pt-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 mb-6 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Orders Management</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Confirmation calls, status updates, date filters, and cancellation logging
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={downloadOrdersCSV}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search query */}
                <div className="md:col-span-2 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Order #, Customer Name, or Phone..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white text-gray-900"
                  />
                  <FiSearch className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 text-sm font-medium"
                  >
                    <option value="all">All Order Statuses</option>
                    <option value="processing">Processing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Call Filter */}
                <div>
                  <select
                    value={callFilter}
                    onChange={(e) => setCallFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 text-sm font-medium"
                  >
                    <option value="all">All Call Statuses</option>
                    <option value="pending">⏳ Pending Call</option>
                    <option value="picked_confirmed">✅ Picked - Confirmed</option>
                    <option value="picked_cancelled">❌ Picked - Cancelled</option>
                    <option value="not_picked">📞 Not Picked</option>
                    <option value="hung_up">📴 Hung Up</option>
                  </select>
                </div>
              </div>

              {/* Date Filter Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-gray-100 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <FiCalendar className="w-4 h-4 text-primary-600" /> Filter by Date:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">From:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 w-full sm:w-auto"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">To:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 w-full sm:w-auto"
                      />
                    </div>
                  </div>
                </div>

                {(searchQuery || statusFilter !== 'all' || callFilter !== 'all' || startDate || endDate) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 self-start sm:self-auto"
                  >
                    <FiX className="w-3.5 h-3.5" /> Clear All Filters
                  </button>
                )}
              </div>
            </div>

            {/* Orders Table */}
            {loading ? (
              <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-sm">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-500 font-medium">No orders match your filter criteria.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-full">
                <div className="overflow-x-auto w-full">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-5 py-3.5">Order #</th>
                        <th className="px-5 py-3.5">Customer & Phone</th>
                        <th className="px-5 py-3.5">Call Confirmation (Admin Only)</th>
                        <th className="px-5 py-3.5">Special Request & Slot</th>
                        <th className="px-5 py-3.5">Amount</th>
                        <th className="px-5 py-3.5">Order Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((order) => {
                        const callStatus = order.confirmationCallStatus || 'pending';
                        const currentCallOption = CALL_STATUS_OPTIONS.find((c) => c.value === callStatus) || CALL_STATUS_OPTIONS[0];

                        return (
                          <tr key={order.id || order.orderNumber} className="hover:bg-gray-50 transition-colors">
                            {/* Order # and Date */}
                            <td className="px-5 py-4 align-top whitespace-nowrap">
                              <Link
                                href={`/admin/orders/view?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                                className="font-extrabold text-primary-600 hover:text-primary-800 text-base block"
                              >
                                #{order.orderNumber}
                              </Link>
                              <span className="text-xs text-gray-400 block mt-0.5">
                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : ''}
                              </span>
                            </td>

                            {/* Customer */}
                            <td className="px-5 py-4 align-top min-w-[180px]">
                              <div className="font-semibold text-gray-900">{order.customerName}</div>
                              <div className="text-xs font-mono text-gray-600 mt-0.5">
                                {formatPakistaniPhone(order.customerPhone)}
                              </div>
                              <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                                {order.customerAddress}
                              </div>
                            </td>

                            {/* Order Confirmation Call (Admin only column) */}
                            <td className="px-5 py-4 align-top min-w-[200px]">
                              <div className="space-y-1.5">
                                <select
                                  value={callStatus}
                                  onChange={(e) => handleCallStatusChange(order.id || '', order.orderNumber, e.target.value)}
                                  className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border shadow-sm cursor-pointer focus:ring-2 focus:ring-primary-500 ${currentCallOption.badge}`}
                                >
                                  <option value="pending">⏳ Pending Call</option>
                                  <option value="picked_confirmed">✅ Picked - order confirmed</option>
                                  <option value="picked_cancelled">❌ Picked - order Cancelled</option>
                                  <option value="not_picked">📞 Not picked</option>
                                  <option value="hung_up">📴 Hung up</option>
                                </select>

                                <a
                                  href={`tel:${cleanPhoneNumber(order.customerPhone)}`}
                                  className="text-[11px] text-primary-600 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <FiPhoneCall className="w-3 h-3" /> Call Customer
                                </a>
                              </div>
                            </td>

                            {/* Special Request & Time Slot */}
                            <td className="px-5 py-4 align-top min-w-[180px] max-w-xs">
                              {order.preferredCallTime && (
                                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold rounded mb-1">
                                  ⏰ {order.preferredCallTime}
                                </span>
                              )}
                              {order.specialRequest ? (
                                <p className="text-xs text-gray-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-snug">
                                  📝 <span className="font-medium">{order.specialRequest}</span>
                                </p>
                              ) : (
                                <span className="text-xs text-gray-400 italic">None</span>
                              )}
                            </td>

                            {/* Amount */}
                            <td className="px-5 py-4 align-top whitespace-nowrap">
                              <span className="font-bold text-gray-900 block">{formatCurrency(order.total)}</span>
                              <span className="text-xs text-gray-500">{order.items.length} item(s)</span>
                            </td>

                            {/* Order Status */}
                            <td className="px-5 py-4 align-top min-w-[160px]">
                              <div className="space-y-1">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleOrderStatusChange(order, e.target.value as Order['status'])}
                                  className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border cursor-pointer ${
                                    order.status === 'confirmed'
                                      ? 'bg-green-100 text-green-800 border-green-300'
                                      : order.status === 'processing'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : order.status === 'shipped'
                                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                                      : order.status === 'delivered'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800 border-red-300'
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                  }`}
                                >
                                  <option value="processing">Processing</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>

                                {order.status === 'cancelled' && order.cancellationReason && (
                                  <div className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded border border-red-200 mt-1">
                                    <span className="font-bold">Reason:</span> {order.cancellationReason}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Action */}
                            <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                              <Link
                                href={`/admin/orders/view?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                                className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-800 bg-primary-50 px-2.5 py-1 rounded-lg"
                              >
                                View Details <FiExternalLink className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                  <span>Showing {filteredOrders.length} of {orders.length} orders</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Reason Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5" /> Cancel Order #{cancellingOrder.orderNumber}
              </h3>
              <button
                onClick={() => setCancellingOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitCancellation} className="mt-4 space-y-4">
              <p className="text-xs text-gray-600">
                Please select or enter the reason for cancellation. This reason will be recorded and displayed for both the customer on their tracking page and in the admin panel.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reason for Cancellation
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 bg-white text-gray-900 text-sm font-medium"
                >
                  {PRESET_CANCEL_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {selectedReason === 'Other (Custom Reason)' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Enter Custom Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe specific reason why order was cancelled..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 bg-white text-gray-900 text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Keep Order Active
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminProtected>
  );
}
