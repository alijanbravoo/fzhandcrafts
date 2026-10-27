'use client';

import { useEffect, useState, useMemo } from 'react';
import { getOrders, Order } from '@/lib/firestore';
import { formatCurrency, formatPakistaniPhone, cleanPhoneNumber, isPhoneAccountEmail } from '@/lib/utils';
import AdminProtected from '@/components/AdminProtected';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';
import { 
  FiSearch, 
  FiCopy, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiShoppingBag, 
  FiDownload, 
  FiCheck 
} from 'react-icons/fi';

interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  orderNumbers: string[];
  lastOrderDate: Date | null;
}

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders for customers list');
    } finally {
      setLoading(false);
    }
  };

  // Group orders into unique customers
  const customers: CustomerSummary[] = useMemo(() => {
    const customerMap = new Map<string, CustomerSummary>();

    orders.forEach((order) => {
      // Key primarily on phone number (or email/name if phone absent)
      const cleanedPhone = cleanPhoneNumber(order.customerPhone);
      const key = cleanedPhone || (order.customerEmail ? order.customerEmail.toLowerCase().trim() : order.customerName.toLowerCase().trim());

      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : null;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key,
          name: order.customerName,
          phone: order.customerPhone,
          email: isPhoneAccountEmail(order.customerEmail) ? '' : order.customerEmail,
          address: order.customerAddress,
          orderCount: 1,
          totalSpent: order.total || 0,
          orderNumbers: [order.orderNumber],
          lastOrderDate: orderDate,
        });
      } else {
        const existing = customerMap.get(key)!;
        existing.orderCount += 1;
        existing.totalSpent += (order.total || 0);
        if (!existing.orderNumbers.includes(order.orderNumber)) {
          existing.orderNumbers.push(order.orderNumber);
        }
        // Update to latest address and name if more recent
        if (orderDate && (!existing.lastOrderDate || orderDate > existing.lastOrderDate)) {
          existing.lastOrderDate = orderDate;
          existing.address = order.customerAddress || existing.address;
          existing.name = order.customerName || existing.name;
        }
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => {
      const timeA = a.lastOrderDate ? a.lastOrderDate.getTime() : 0;
      const timeB = b.lastOrderDate ? b.lastOrderDate.getTime() : 0;
      return timeB - timeA;
    });
  }, [orders]);

  // Search filtering
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase().trim();

    return customers.filter((customer) => {
      const matchName = customer.name.toLowerCase().includes(query);
      const matchPhone = cleanPhoneNumber(customer.phone).includes(cleanPhoneNumber(query));
      const matchEmail = customer.email.toLowerCase().includes(query);
      const matchOrderNum = customer.orderNumbers.some((num) => num.toLowerCase().includes(query));

      return matchName || matchPhone || matchEmail || matchOrderNum;
    });
  }, [customers, searchQuery]);

  const copyToClipboard = (text: string, label: string, keyId: string) => {
    if (!text) {
      toast.error(`No ${label.toLowerCase()} available to copy`);
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const copyFullCustomerSlip = (c: CustomerSummary) => {
    const slip = `Name: ${c.name}\nPhone: ${formatPakistaniPhone(c.phone)}\nAddress: ${c.address}\nOrder(s): #${c.orderNumbers.join(', #')}`;
    copyToClipboard(slip, 'Customer Delivery Details', `slip-${c.id}`);
  };

  // Download Customers CSV
  const downloadCustomersCSV = () => {
    if (filteredCustomers.length === 0) {
      toast.error('No customers to export');
      return;
    }

    const headers = ['Customer Name', 'Phone Number', 'Email', 'Delivery Address', 'Total Orders', 'Total Spent (PKR)', 'Order Numbers', 'Last Order Date'];
    const rows = filteredCustomers.map((c) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.orderCount,
      c.totalSpent,
      `"${c.orderNumbers.join(', ')}"`,
      `"${c.lastOrderDate ? c.lastOrderDate.toLocaleDateString() : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customers CSV downloaded successfully');
  };

  const totalCustomerSpend = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4 border-b border-gray-200 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Customer Management</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage all client records, copy contact details, and track customer lifetime value
                </p>
              </div>

              <button
                onClick={downloadCustomersCSV}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors"
              >
                <FiDownload className="w-4 h-4 text-gray-500" />
                <span>Export Customers CSV</span>
              </button>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Total Unique Customers</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{customers.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Total Orders Placed</span>
                <p className="text-2xl font-black text-primary-600 mt-1">{orders.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Total Customer Revenue</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalCustomerSpend)}</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers by Name, Phone Number, or Order # (e.g. 03001234567 or 1002)..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 text-sm shadow-sm"
                />
                <FiSearch className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Customers Table */}
            {loading ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-sm">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900">No Customers Found</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery ? `No results match "${searchQuery}"` : 'No customer orders have been placed yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Customer & Contact</th>
                        <th className="px-6 py-3.5">Delivery Address</th>
                        <th className="px-6 py-3.5">Orders & Spend</th>
                        <th className="px-6 py-3.5">Order Numbers</th>
                        <th className="px-6 py-3.5 text-right">Quick Copy Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                          {/* Name & Contact */}
                          <td className="px-6 py-4 align-top">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-base">{customer.name}</span>
                                  <button
                                    onClick={() => copyToClipboard(customer.name, 'Name', `name-${customer.id}`)}
                                    title="Copy Name"
                                    className="text-gray-400 hover:text-primary-600"
                                  >
                                    {copiedKey === `name-${customer.id}` ? (
                                      <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <FiCopy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                                  <FiPhone className="w-3 h-3 text-gray-400" />
                                  <span>{formatPakistaniPhone(customer.phone)}</span>
                                  <button
                                    onClick={() => copyToClipboard(cleanPhoneNumber(customer.phone), 'Phone Number', `phone-${customer.id}`)}
                                    title="Copy Phone Number"
                                    className="text-gray-400 hover:text-primary-600 ml-1"
                                  >
                                    {copiedKey === `phone-${customer.id}` ? (
                                      <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <FiCopy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                {customer.email && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <FiMail className="w-3 h-3 text-gray-400" />
                                    <span>{customer.email}</span>
                                    <button
                                      onClick={() => copyToClipboard(customer.email, 'Email', `email-${customer.id}`)}
                                      title="Copy Email"
                                      className="text-gray-400 hover:text-primary-600 ml-1"
                                    >
                                      {copiedKey === `email-${customer.id}` ? (
                                        <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <FiCopy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Address */}
                          <td className="px-6 py-4 align-top max-w-xs">
                            <div className="text-xs text-gray-700 leading-relaxed group relative">
                              <p className="line-clamp-2">{customer.address || 'No address recorded'}</p>
                              {customer.address && (
                                <button
                                  onClick={() => copyToClipboard(customer.address, 'Address', `addr-${customer.id}`)}
                                  className="inline-flex items-center gap-1 text-[11px] text-primary-600 hover:underline mt-1 font-semibold"
                                >
                                  {copiedKey === `addr-${customer.id}` ? (
                                    <>
                                      <FiCheck className="w-3 h-3 text-emerald-600" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <FiCopy className="w-3 h-3" /> Copy Address
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Orders & Total Spent */}
                          <td className="px-6 py-4 align-top whitespace-nowrap">
                            <div>
                              <span className="font-bold text-gray-900 block">
                                {formatCurrency(customer.totalSpent)}
                              </span>
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium mt-0.5">
                                {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                              </span>
                              {customer.lastOrderDate && (
                                <span className="block text-[11px] text-gray-400 mt-1">
                                  Last: {customer.lastOrderDate.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Order Numbers */}
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {customer.orderNumbers.map((num) => (
                                <a
                                  key={num}
                                  href={`/admin/orders/view?id=${num}`}
                                  className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold px-2 py-0.5 rounded transition-colors"
                                >
                                  #{num}
                                </a>
                              ))}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-6 py-4 align-top text-right whitespace-nowrap">
                            <div className="flex flex-col items-end gap-1.5">
                              <button
                                onClick={() => copyFullCustomerSlip(customer)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                              >
                                {copiedKey === `slip-${customer.id}` ? (
                                  <>
                                    <FiCheck className="w-3.5 h-3.5 text-emerald-400" /> Copied Slip!
                                  </>
                                ) : (
                                  <>
                                    <FiCopy className="w-3.5 h-3.5" /> Copy Full Slip
                                  </>
                                )}
                              </button>
                              <a
                                href={`https://wa.me/92${cleanPhoneNumber(customer.phone).replace(/^0/, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-emerald-600 hover:underline"
                              >
                                💬 Open WhatsApp
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                  <span>Showing {filteredCustomers.length} of {customers.length} total customers</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
