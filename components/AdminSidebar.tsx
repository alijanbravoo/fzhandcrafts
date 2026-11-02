'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  FiHome, 
  FiShoppingBag, 
  FiPackage, 
  FiUsers, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiExternalLink
} from 'react-icons/fi';
import { useState } from 'react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: FiHome },
    { href: '/admin/products', label: 'Products', icon: FiShoppingBag },
    { href: '/admin/orders', label: 'Orders', icon: FiPackage },
    { href: '/admin/customers', label: 'Customers', icon: FiUsers },
    { href: '/admin/settings', label: 'Settings', icon: FiSettings },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Admin Menu Floating Button (Safely below the 64px website top bar at top-[76px]) */}
      <div className="lg:hidden fixed top-[76px] left-4 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Admin Navigation Menu"
          className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-gray-300/80 text-gray-800 hover:bg-gray-100 flex items-center gap-2 text-xs font-bold transition-all active:scale-95"
        >
          {isMobileMenuOpen ? (
            <>
              <FiX className="w-4 h-4 text-gray-600" />
              <span>Close</span>
            </>
          ) : (
            <>
              <FiMenu className="w-4 h-4 text-[#013428]" />
              <span className="text-gray-900">Admin Menu</span>
            </>
          )}
        </button>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:shadow-md lg:z-30
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#6b1d30] block">Management</span>
              <h1 className="text-xl font-serif font-bold text-[#013428]">FZ Admin Portal</h1>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-xs font-semibold
                    ${active
                      ? 'bg-[#013428] text-white shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-gray-100">
              <Link
                href="/"
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <FiExternalLink className="w-4 h-4 shrink-0" />
                <span>Visit Storefront</span>
              </Link>
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
