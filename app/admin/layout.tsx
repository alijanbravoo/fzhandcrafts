'use client';

import { usePathname } from 'next/navigation';
import AdminProtected from '@/components/AdminProtected';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Do not wrap the login page with AdminProtected to avoid infinite redirect loops
  if (pathname === '/admin/login' || pathname?.startsWith('/admin/login')) {
    return <>{children}</>;
  }

  return <AdminProtected>{children}</AdminProtected>;
}
