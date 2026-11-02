'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { FiShoppingCart, FiMenu, FiX, FiUser, FiPackage, FiLogOut, FiExternalLink, FiShield } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { cartItems } = useCart();
  const { user, displayName, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'All Gajray' },
    { href: '/categories', label: 'Collections' },
    // If logged in, route to my orders and account page; otherwise to track order page
    { href: user ? '/account' : '/order-status', label: 'Track Order' },
    { href: '/about', label: 'Our Story' },
    { href: '/contact', label: 'Contact' },
  ];

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#6b1d30] text-[#fbf9f6] sticky top-0 z-50 shadow-[0_4px_20px_rgba(78,18,32,0.25)] border-b border-[#ffdead]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Brand Emblem */}
          <Link href="/" className="flex items-center gap-1.5 group min-w-0 max-w-[60%] sm:max-w-none">
            <span className="font-serif text-[20px] sm:text-2xl tracking-tight text-[#ffdead] font-semibold leading-none group-hover:brightness-110 transition-all truncate">
              FZhandcrafts
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffdead] shrink-0"></span>
            {isAdminPage && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#ffdead]/20 text-[#ffdead] border border-[#ffdead]/30 hidden xs:inline-flex items-center gap-1">
                <FiShield className="w-3 h-3" /> Admin
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links (Customer only - hidden on Admin pages) */}
          {!isAdminPage && (
            <div className="hidden md:flex space-x-1 lg:space-x-2 shrink-0">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    pathname === link.href
                      ? 'text-[#4e1220] bg-[#ffdead] shadow-xs'
                      : 'text-[#fbf9f6]/90 hover:text-[#ffdead] hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Admin Header Quick Links (Only on Admin pages) */}
          {isAdminPage && (
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#ffdead] font-medium transition-all flex items-center gap-1.5"
              >
                <span>View Storefront</span>
                <FiExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* WhatsApp Quick Chat (Customer only) */}
            {!isAdminPage && (
              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all text-xs font-semibold"
              >
                <FaWhatsapp className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* User Account Menu (Desktop) */}
            <div className="relative hidden sm:block" ref={userMenuRef}>
              {mounted && user ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 hover:border-[#ffdead] hover:bg-white/10 transition-all text-xs font-semibold text-[#fbf9f6]"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#ffdead] text-[#4e1220] flex items-center justify-center text-[10px] font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate">{displayName}</span>
                  </button>

                  {/* Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 text-gray-800">
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-[#6b1d30]/10 hover:text-[#6b1d30]"
                      >
                        <FiPackage className="w-3.5 h-3.5" /> My Orders &amp; Account
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1"
                      >
                        <FiLogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : !isAdminPage ? (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#fbf9f6] hover:text-[#ffdead] hover:bg-white/10 transition-colors"
                >
                  <FiUser className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              ) : null}
            </div>

            {/* Shopping Cart Button (Customer only) */}
            {!isAdminPage && (
              <Link
                href="/cart"
                className="relative p-2 text-[#fbf9f6] hover:text-[#ffdead] transition-colors rounded-full hover:bg-white/10 shrink-0"
                aria-label="Shopping Cart"
              >
                <FiShoppingCart className="w-5 h-5" />
                {mounted && cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ffdead] text-[#4e1220] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile menu toggle button (CUSTOMER ONLY - STRICTLY REMOVED FROM ADMIN PANEL) */}
            {!isAdminPage && (
              <button
                className="md:hidden p-2 text-[#fbf9f6] hover:text-[#ffdead] rounded-lg shrink-0 flex items-center justify-center"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle Customer Navigation Menu"
              >
                {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
              </button>
            )}

            {/* Mobile View Storefront Link on Admin */}
            {isAdminPage && (
              <Link
                href="/"
                className="sm:hidden px-2.5 py-1 rounded-full bg-white/10 text-[#ffdead] text-[11px] font-semibold flex items-center gap-1"
              >
                <span>Store</span>
                <FiExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Customer Mobile Navigation Drawer (CUSTOMER ONLY - NEVER SHOWN ON ADMIN) */}
        {!isAdminPage && isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  pathname === link.href
                    ? 'text-[#4e1220] bg-[#ffdead]'
                    : 'text-[#fbf9f6] hover:text-[#ffdead] hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-white/10">
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#4e1220] bg-[#ffdead] mb-2"
                  >
                    👤 My Orders &amp; Account ({displayName})
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left block px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-300 hover:bg-white/10"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-center bg-[#ffdead] text-[#4e1220] hover:brightness-105 shadow-sm"
                >
                  Sign In with Google / Phone
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
