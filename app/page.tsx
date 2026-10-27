'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProducts, getSettings } from '@/lib/firestore';
import { Product } from '@/lib/firestore';
import { formatCurrency } from '@/lib/utils';
import { FiArrowRight } from 'react-icons/fi';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import PWAInstallButton from '@/components/PWAInstallButton';
import toast from 'react-hot-toast';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverPhotoLink, setCoverPhotoLink] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [products, settings] = await Promise.all([
          getProducts(),
          getSettings(),
        ]);
        setFeaturedProducts(products.slice(0, 6));
        setCoverPhoto(settings.homepageCoverPhoto || null);
        setCoverPhotoLink(settings.homepageCoverPhotoLink || null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
        console.error('Error loading data:', err);
        setError(errorMessage);
        toast.error('Unable to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className={`relative text-white py-12 sm:py-16 md:py-20 ${coverPhoto ? '' : 'bg-gradient-to-r from-pink-500 to-rose-500'}`}>
        {coverPhoto && (
          <div className="absolute inset-0 z-0">
            {coverPhotoLink ? (
              <Link href={coverPhotoLink} className="block h-full w-full">
                <Image
                  src={coverPhoto}
                  alt="FZhandcrafts"
                  fill
                  className="object-cover cursor-pointer"
                  priority
                />
              </Link>
            ) : (
              <Image
                src={coverPhoto}
                alt="FZhandcrafts"
                fill
                className="object-cover"
                priority
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            FZhandcrafts
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 px-4" style={{ color: coverPhoto ? '#fff' : '#fce7f3' }}>
            Beautiful artificial flowers, bouquets and fancy gajray for every occasion
          </p>
          <Link
            href="/products"
            className="inline-flex items-center bg-white text-pink-600 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors text-sm sm:text-base mb-4"
          >
            Shop Now <FiArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          
          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" className="mt-4" />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Featured Products</h2>
          {error && (
            <div className="mb-6">
              <ErrorDisplay error={error} onDismiss={() => setError(null)} />
            </div>
          )}
          {loading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" text="Loading products..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product?id=${product.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-64 w-full">
                    <Image
                      src={product.images[0] || 'https://via.placeholder.com/400x400?text=Flower'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-sm text-gray-500">{product.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!loading && featuredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No products available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* PWA Install Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PWAInstallButton variant="default" />
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose Us?</h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span>Beautiful artificial flowers and bouquets</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span>Elegant fancy gajray for special occasions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span>Fast and reliable delivery</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span>Handcrafted with care and attention to detail</span>
                </li>
              </ul>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1563241521-5eda3f5b8e84?w=800"
                alt="FZhandcrafts"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


