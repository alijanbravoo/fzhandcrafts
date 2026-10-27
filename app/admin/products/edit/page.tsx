import { Suspense } from 'react';

import EditProductClient from './EditProductClient';

export default function AdminEditProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <EditProductClient />
    </Suspense>
  );
}
