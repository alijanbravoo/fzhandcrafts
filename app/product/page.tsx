import { Suspense } from 'react';

import ProductClient from './ProductClient';

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      }
    >
      <ProductClient />
    </Suspense>
  );
}
