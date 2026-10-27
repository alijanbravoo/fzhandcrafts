'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/firestore';
import { formatCurrency, normalizeImageUrl } from '@/lib/utils';
import { FaStar } from 'react-icons/fa';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = normalizeImageUrl(product.images?.[0]) || 'https://via.placeholder.com/400x400?text=Flower';

  return (
    <Link
      href={`/product?id=${product.id}`}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="relative h-64 w-full overflow-hidden bg-gray-50">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {!product.inStock && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
            Out of Stock
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center text-amber-400 text-xs gap-1">
              <FaStar className="w-3 h-3" />
              <span className="text-gray-500 font-medium">5.0</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
            {product.name}
          </h3>
          <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="text-xl font-black text-primary-600">
            {formatCurrency(product.price)}
          </span>
          <span className="text-xs font-bold text-gray-700 bg-gray-100 group-hover:bg-primary-50 group-hover:text-primary-600 px-3 py-1.5 rounded-lg transition-colors">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
