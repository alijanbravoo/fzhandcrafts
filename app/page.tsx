'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProducts, getSettings } from '@/lib/firestore';
import { Product } from '@/lib/firestore';
import { formatCurrency, normalizeImageUrl } from '@/lib/utils';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
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
    <div className="bg-[#fbf9f6] text-[#1b1c1a]">
      {/* Editorial Luxury Hero Section */}
      <section className={`relative text-white py-16 sm:py-24 md:py-28 overflow-hidden ${coverPhoto ? '' : 'bg-gradient-to-br from-[#4e1220] via-[#6b1d30] to-[#013428]'}`}>
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Atelier Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#ffdead]/30 text-[#ffdead] text-xs font-semibold tracking-widest uppercase mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffdead] animate-pulse"></span>
            Traditional Handcrafted Flora
          </span>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-4 sm:mb-6 leading-tight max-w-4xl">
            Everlasting Velvet &amp; Silk Gajray
          </h1>

          <p className="font-sans text-sm sm:text-lg md:text-xl text-[#fbf9f6]/90 max-w-2xl mb-8 leading-relaxed font-light">
            Meticulously handcrafted gajray, luxury floral jewelry, and festive chignon adornments. Stays fresh forever.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#ffdead] text-[#4e1220] hover:bg-[#ffe7c4] px-7 py-3.5 rounded-full font-semibold text-sm sm:text-base shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Explore Collection</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md px-6 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all"
            >
              <span>Custom Bridal Inquiry</span>
            </a>
          </div>

          {/* Quick Perks Strip */}
          <div className="mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 text-xs text-[#ffdead]">
            <span className="flex items-center gap-1.5 font-medium">
              <FiCheck className="text-white" /> 100% Handcrafted in Pakistan
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <FiCheck className="text-white" /> Crush-proof Velvet &amp; Ribbons
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <FiCheck className="text-white" /> 2-3 Days Nationwide Delivery
            </span>
          </div>

          <PWAInstallButton variant="compact" className="mt-6" />
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-12 gap-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#6b1d30] font-bold">
              Atelier Curations
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#013428] font-medium tracking-tight mt-1">
              Featured Floral Creations
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-[#6b1d30] hover:text-[#4e1220] flex items-center gap-1 group"
          >
            <span>View all products</span>
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <LoadingSpinner size="lg" text="Loading handcrafted collection..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredProducts.map((product) => {
              const displayImg = product.images?.[0]
                ? normalizeImageUrl(product.images[0])
                : 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&auto=format&fit=crop&q=80';

              return (
                <Link
                  key={product.id}
                  href={`/product?id=${product.id}`}
                  className="group rounded-2xl sm:rounded-3xl bg-white border border-[#eae8e5] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-square w-full bg-[#f5f3f0] overflow-hidden">
                    <Image
                      src={displayImg}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className="bg-white/90 backdrop-blur-md text-[#6b1d30] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-white/60">
                        Handcrafted
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span className="text-[#6b1d30] font-semibold tracking-wide uppercase text-[11px]">
                          {product.category || 'Gajray'}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <FaStar className="w-3 h-3 fill-amber-500" />
                          <span className="text-gray-900 font-bold text-xs">4.9</span>
                        </div>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#013428] group-hover:text-[#6b1d30] transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#eae8e5] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Price</span>
                        <span className="font-serif text-xl sm:text-2xl font-bold text-[#013428] leading-none">
                          {formatCurrency(product.price)}
                        </span>
                      </div>

                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#013428] text-white group-hover:bg-[#6b1d30] transition-colors shadow-xs">
                        <FiArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && featuredProducts.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="font-serif text-lg">No products available in this showcase yet.</p>
          </div>
        )}
      </section>

      {/* Why Choose FZhandcrafts Feature Grid */}
      <section className="py-16 bg-[#f5f3f0] border-y border-[#eae8e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="space-y-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#6b1d30] font-bold">The FZ Standard</span>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#013428] font-medium tracking-tight mt-1">
                  Why Discerning Patrons Choose FZhandcrafts
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#eae8e5] shadow-xs">
                  <h4 className="font-serif font-bold text-sm text-[#013428]">Everlasting Velvet</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">Imported crush-proof velvet petals designed to remain fresh event after event.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#eae8e5] shadow-xs">
                  <h4 className="font-serif font-bold text-sm text-[#013428]">Glitter Flowers</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">Artisan gold &amp; white glitter floral centerpieces providing radiant festive sparkle.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#eae8e5] shadow-xs">
                  <h4 className="font-serif font-bold text-sm text-[#013428]">Silk Ribbon Comfort</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">Ties softly around wrists or chignon hair buns without snagging or pulling hair.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#eae8e5] shadow-xs">
                  <h4 className="font-serif font-bold text-sm text-[#013428]">Protective Delivery</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">Packed in crush-proof presentation boxes delivered nationwide across Pakistan.</p>
                </div>
              </div>
            </div>

            <div className="relative aspect-square sm:aspect-4/3 rounded-3xl overflow-hidden shadow-lg border border-[#eae8e5]">
              <Image
                src="https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&auto=format&fit=crop&q=80"
                alt="FZhandcrafts Atelier Crafting"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <span className="text-white text-xs sm:text-sm font-medium">Handcrafted with devotion in Pakistan</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
