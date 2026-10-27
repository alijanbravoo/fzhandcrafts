'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getProduct, getSettings } from '@/lib/firestore';
import { Product } from '@/lib/firestore';
import { formatCurrency, cleanWhatsAppNumber, normalizeImageUrl } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import toast from 'react-hot-toast';
import { FiShoppingCart } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import ProductReviews from '@/components/ProductReviews';

export default function ProductClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  const productId = useMemo(() => searchParams.get('id'), [searchParams]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [whatsappNumber, setWhatsappNumber] = useState('923001234567');

  useEffect(() => {
    const loadProductAndSettings = async () => {
      if (!productId) {
        toast.error('Product not found');
        router.push('/products');
        return;
      }

      try {
        const [productData, settings] = await Promise.all([
          getProduct(productId),
          getSettings(),
        ]);

        if (productData) {
          setProduct(productData);
        } else {
          toast.error('Product not found');
          router.push('/products');
        }

        if (settings.whatsappNumber) {
          setWhatsappNumber(cleanWhatsAppNumber(settings.whatsappNumber));
        } else if (settings.contactPhone) {
          setWhatsappNumber(cleanWhatsAppNumber(settings.contactPhone));
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('Error loading product');
      } finally {
        setLoading(false);
      }
    };

    loadProductAndSettings();
  }, [productId, router]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        productId: product.id!,
        name: product.name,
        price: product.price,
        quantity,
        image: normalizeImageUrl(product.images[0]) || '',
      });
      toast.success('Added to cart!');
    }
  };

  const handleOrderNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const message = `Hi FZhandcrafts! 🌸\nI would like to order:\n\n*Product:* ${product.name}\n*Price:* ${formatCurrency(product.price)}\n*Quantity:* ${quantity}\n*Total:* ${formatCurrency(product.price * quantity)}\n\n*Product Link:* ${currentUrl}`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
        <div>
          {product.images && product.images.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              className="rounded-lg shadow-sm overflow-hidden"
            >
              {product.images.map((image, index) => {
                const normalized = normalizeImageUrl(image) || 'https://via.placeholder.com/600x600?text=Flower';
                return (
                  <SwiperSlide key={index}>
                    <div className="relative h-72 sm:h-96 w-full">
                      <Image
                        src={normalized}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          ) : (
            <div className="relative h-72 sm:h-96 w-full bg-gray-200 rounded-lg">
              <Image
                src="https://via.placeholder.com/600x600?text=Flower"
                alt={product.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-gray-900">{product.name}</h1>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
              {product.category}
            </span>
            <a 
              href="#reviews-section" 
              className="text-sm text-primary-600 hover:underline font-medium"
            >
              View Reviews & Ratings ↓
            </a>
          </div>

          <p className="text-2xl sm:text-3xl font-bold text-primary-600 mb-4 sm:mb-6">
            {formatCurrency(product.price)}
          </p>

          <p className="text-gray-700 mb-6 sm:mb-8 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>

          {product.youtubeVideoUrl && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Product Video</h3>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={product.youtubeVideoUrl.replace('watch?v=', 'embed/').split('&')[0]}
                  title="Product Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
              >
                -
              </button>
              <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleOrderNow}
              className="w-full bg-primary-600 text-white py-3.5 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm flex items-center justify-center"
            >
              Order Now
            </button>

            {/* Quick Order on WhatsApp Button */}
            <button
              onClick={handleWhatsAppOrder}
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 px-6 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <FaWhatsapp className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
              <span>Order via WhatsApp</span>
            </button>

            <button
              onClick={handleAddToCart}
              className="w-full border-2 border-primary-600 text-primary-600 py-3.5 px-6 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center"
            >
              <FiShoppingCart className="mr-2 w-5 h-5" />
              Add to Cart
            </button>
          </div>

          {!product.inStock && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium">This product is currently out of stock.</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <ProductReviews productId={product.id!} productName={product.name} />
    </div>
  );
}
