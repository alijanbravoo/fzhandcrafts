'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCurrency, cleanWhatsAppNumber } from '@/lib/utils';
import { getSettings } from '@/lib/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { trackHybridEvent } from '@/lib/fpixel';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, getTotal } = useCart();
  const router = useRouter();
  const [whatsappNumber, setWhatsappNumber] = useState('923001234567');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        if (settings.whatsappNumber) {
          setWhatsappNumber(cleanWhatsAppNumber(settings.whatsappNumber));
        } else if (settings.contactPhone) {
          setWhatsappNumber(cleanWhatsAppNumber(settings.contactPhone));
        }
      } catch (err) {
        console.warn('Could not load WhatsApp number:', err);
      }
    };
    loadSettings();
  }, []);

  const handleWhatsAppCheckout = () => {
    if (cartItems.length === 0) return;

    // Track Contact event via Meta Pixel & CAPI
    trackHybridEvent({
      eventName: 'Contact',
      eventId: `cart_whatsapp_${Date.now()}`,
      customData: {
        currency: 'PKR',
        value: getTotal(),
        num_items: cartItems.length,
      },
    });

    let itemsList = cartItems
      .map(
        (item, idx) =>
          `${idx + 1}. *${item.name}* (Qty: ${item.quantity}) - ${formatCurrency(
            item.price * item.quantity
          )}`
      )
      .join('\n');

    const message = `Hi FZhandcrafts! 🌸\nI would like to place an order from my cart:\n\n${itemsList}\n\n*Total Amount:* ${formatCurrency(
      getTotal()
    )}\n*Shipping:* Free\n\nPlease let me know how to proceed!`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Your Cart</h1>
          <p className="text-gray-600 mb-8">Your cart is empty.</p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">Your Cart</h1>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div className="md:col-span-2 space-y-3 sm:space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <div className="relative w-full sm:w-24 md:w-32 h-32 sm:h-24 md:h-32 flex-shrink-0">
                <Image
                  src={item.image || 'https://via.placeholder.com/200x200?text=Flower'}
                  alt={item.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                <p className="text-primary-600 font-bold mb-4">
                  {formatCurrency(item.price)}
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-2 hover:bg-gray-50"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-2 hover:bg-gray-50"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-20 md:top-24 space-y-4">
            <h2 className="text-2xl font-bold">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(getTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(getTotal())}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Currency: PKR (Pakistani Rupee)</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={handleWhatsAppCheckout}
                className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3 px-6 rounded-lg font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <FaWhatsapp className="w-5 h-5 text-white" />
                <span>Order Cart on WhatsApp</span>
              </button>
            </div>

            <Link
              href="/products"
              className="block text-center pt-2 text-sm text-gray-600 hover:text-primary-600"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
