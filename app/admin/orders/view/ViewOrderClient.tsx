'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';

import AdminProtected from '@/components/AdminProtected';
import AdminSidebar from '@/components/AdminSidebar';
import { getOrderByNumber, updateOrderStatus, updateOrderCallStatus, updateOrderTracking } from '@/lib/firestore';
import type { Order } from '@/lib/firestore';
import { formatCurrency, formatPakistaniPhone, cleanPhoneNumber, normalizeImageUrl } from '@/lib/utils';
import { FiCopy, FiCheck, FiPhone, FiCalendar, FiClock, FiAlertCircle, FiTruck } from 'react-icons/fi';

export default function ViewOrderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderNumber = useMemo(() => searchParams.get('orderNumber') || '', [searchParams]);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingCall, setSavingCall] = useState(false);
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  // Courier Tracking state
  const [courierNameInput, setCourierNameInput] = useState('Trax');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!orderNumber) {
        toast.error('Order number is missing');
        router.push('/admin/orders');
        return;
      }

      setLoading(true);
      try {
        const data = await getOrderByNumber(orderNumber);
        setOrder(data);
        if (data?.cancellationReason) {
          setCancellationReasonInput(data.cancellationReason);
        }
        if (data?.courierName) {
          setCourierNameInput(data.courierName);
        }
        if (data?.courierTrackingNumber) {
          setTrackingNumberInput(data.courierTrackingNumber);
        }
        if (!data) {
          toast.error('Order not found');
        }
      } catch (e) {
        console.error('Error loading order:', e);
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderNumber, router]);

  const handleStatusChange = async (status: Order['status']) => {
    if (!orderNumber) return;

    if (status === 'cancelled') {
      setShowCancelPrompt(true);
      return;
    }

    setSavingStatus(true);
    try {
      await updateOrderStatus(orderNumber, status);
      setOrder((prev) => (prev ? { ...prev, status } : prev));
      toast.success('Order status updated');
    } catch (e) {
      console.error('Error updating status:', e);
      toast.error('Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleConfirmCancelWithReason = async () => {
    if (!orderNumber) return;
    setSavingStatus(true);
    try {
      const reason = cancellationReasonInput.trim() || 'Cancelled by store admin';
      await updateOrderStatus(orderNumber, 'cancelled', reason);
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled', cancellationReason: reason } : prev));
      setShowCancelPrompt(false);
      toast.success('Order marked as cancelled with reason saved');
    } catch (e) {
      console.error('Error cancelling order:', e);
      toast.error('Failed to cancel order');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCallStatusChange = async (callStatus: string) => {
    if (!orderNumber) return;
    setSavingCall(true);
    try {
      await updateOrderCallStatus(orderNumber, callStatus);
      setOrder((prev) => (prev ? { ...prev, confirmationCallStatus: callStatus } : prev));
      toast.success('Confirmation call status updated');
    } catch (e) {
      console.error('Error updating call status:', e);
      toast.error('Failed to update call status');
    } finally {
      setSavingCall(false);
    }
  };

  const handleSaveTracking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumber) return;
    setSavingTracking(true);
    try {
      const courier = courierNameInput.trim() || 'Trax';
      const tracking = trackingNumberInput.trim();
      await updateOrderTracking(orderNumber, tracking, courier);
      setOrder((prev) => (prev ? { ...prev, courierName: courier, courierTrackingNumber: tracking } : prev));
      toast.success('Courier tracking number saved successfully!');
    } catch (err) {
      console.error('Error updating courier tracking:', err);
      toast.error('Failed to save courier tracking number');
    } finally {
      setSavingTracking(false);
    }
  };

  const copyCustomerDetails = () => {
    if (!order) return;
    const slip = `Order #${order.orderNumber}\nCustomer: ${order.customerName}\nPhone: ${formatPakistaniPhone(order.customerPhone)}\nAddress: ${order.customerAddress}\nTotal: ${formatCurrency(order.total)}`;
    navigator.clipboard.writeText(slip);
    setCopied(true);
    toast.success('Copied customer delivery slip to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 flex w-full max-w-full overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 w-full max-w-full min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-20 sm:pt-20 lg:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 break-words">Order #{orderNumber}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={copyCustomerDetails}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                  <span>{copied ? 'Copied Details!' : 'Copy Delivery Slip'}</span>
                </button>
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50 text-gray-700"
                >
                  ← Back to Orders
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#013428]"></div>
              </div>
            ) : !order ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">Order not found.</div>
            ) : (
              <div className="space-y-6">
                {/* Top Status & Customer Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div>
                      <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Customer Details</span>
                      <h2 className="text-xl font-bold text-gray-900 mt-1">{order.customerName}</h2>
                      <p className="text-sm text-gray-700 font-mono mt-1">
                        Phone: {formatPakistaniPhone(order.customerPhone)}{' '}
                        <a
                          href={`tel:${cleanPhoneNumber(order.customerPhone)}`}
                          className="text-primary-600 hover:underline text-xs font-sans font-semibold ml-2"
                        >
                          📞 Call
                        </a>
                      </p>
                      {order.customerEmail && !order.customerEmail.includes('@phone.') && (
                        <p className="text-sm text-gray-600">Email: {order.customerEmail}</p>
                      )}
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-xs font-bold uppercase text-gray-500 block mb-1">Delivery Address</span>
                        <p className="text-sm text-gray-800 leading-relaxed">{order.customerAddress}</p>
                      </div>

                      {/* Special Request */}
                      {order.specialRequest && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <span className="text-xs font-bold uppercase text-amber-800 block mb-1">Customer Special Request / Delivery Date</span>
                          <p className="text-sm text-amber-900 font-medium">{order.specialRequest}</p>
                        </div>
                      )}

                      {/* Preferred Call Time */}
                      {order.preferredCallTime && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                          <FiClock className="w-3.5 h-3.5" />
                          <span>Preferred confirmation call time: <strong className="text-gray-700 capitalize">{order.preferredCallTime}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Order Controls */}
                    <div className="space-y-4">
                      {/* Order Status */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                          Order Status
                        </label>
                        <select
                          value={order.status}
                          disabled={savingStatus}
                          onChange={(e) => handleStatusChange(e.target.value as Order['status'])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm font-semibold"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* Confirmation Call Status (Admin only) */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                          Order Confirmation Call (Admin Only)
                        </label>
                        <select
                          value={order.confirmationCallStatus || 'pending'}
                          disabled={savingCall}
                          onChange={(e) => handleCallStatusChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm font-semibold text-gray-800"
                        >
                          <option value="pending">⏳ Pending Call</option>
                          <option value="picked_confirmed">✅ Picked - order confirmed</option>
                          <option value="picked_cancelled">❌ Picked - order Cancelled</option>
                          <option value="not_picked">📞 Not picked</option>
                          <option value="hung_up">📴 Hung up</option>
                        </select>
                      </div>

                      {/* Courier Tracking Number Field */}
                      <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase text-gray-700 flex items-center gap-1.5">
                            <FiTruck className="w-4 h-4 text-[#013428]" />
                            <span>Courier Tracking Number</span>
                          </label>
                          {order.courierTrackingNumber && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={courierNameInput}
                            onChange={(e) => setCourierNameInput(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs font-semibold sm:w-1/3"
                          >
                            <option value="Trax">Trax</option>
                            <option value="Leopards">Leopards</option>
                            <option value="TCS">TCS</option>
                            <option value="PostEx">PostEx</option>
                            <option value="Call Courier">Call Courier</option>
                            <option value="M&P">M&amp;P</option>
                            <option value="Pakistan Post">Pak Post</option>
                            <option value="Other">Other</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Tracking Number (CN / AWB)"
                            value={trackingNumberInput}
                            onChange={(e) => setTrackingNumberInput(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs font-mono font-medium focus:ring-2 focus:ring-[#013428] focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveTracking()}
                          disabled={savingTracking}
                          className="w-full py-2 px-3 bg-[#013428] hover:bg-[#1e4b3e] text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50"
                        >
                          {savingTracking ? 'Saving...' : 'Save Courier Tracking #'}
                        </button>
                      </div>

                      {/* Cancellation Reason Display/Edit */}
                      {order.status === 'cancelled' && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                          <span className="text-xs font-bold text-red-800 uppercase block mb-1">
                            Reason for Cancellation
                          </span>
                          <p className="text-sm text-red-700 font-medium">
                            {order.cancellationReason || 'No reason specified'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cancellation Prompt Modal */}
                {showCancelPrompt && (
                  <div className="bg-red-50 border border-red-300 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-red-800 mb-2 flex items-center gap-2">
                      <FiAlertCircle className="w-5 h-5" /> Specify Reason for Cancellation
                    </h3>
                    <p className="text-xs text-red-700 mb-3">
                      This reason will be visible to the customer when tracking their order.
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. Call not picked after 3 attempts, Out of stock..."
                      value={cancellationReasonInput}
                      onChange={(e) => setCancellationReasonInput(e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-xl bg-white text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmCancelWithReason}
                        disabled={savingStatus}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                      >
                        Confirm Cancellation
                      </button>
                      <button
                        onClick={() => setShowCancelPrompt(false)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50"
                      >
                        Abort
                      </button>
                    </div>
                  </div>
                )}

                {/* Items Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Ordered Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <Image
                              src={normalizeImageUrl(item.image) || 'https://via.placeholder.com/100x100?text=Flower'}
                              alt={item.productName}
                              fill
                              className="object-cover rounded-xl"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 break-words">{item.productName}</p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="font-bold text-base text-gray-900 sm:text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 mt-6 pt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Total Order Amount</span>
                    <span className="text-2xl font-black text-[#013428]">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
