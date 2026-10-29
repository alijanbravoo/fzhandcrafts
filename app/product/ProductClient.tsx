'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProduct, getSettings, Product } from '@/lib/firestore';
import { formatCurrency, cleanWhatsAppNumber, normalizeImageUrl } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiChevronLeft, FiChevronRight, FiMaximize2, FiX, FiCheck } from 'react-icons/fi';
import { FaWhatsapp, FaStar } from 'react-icons/fa';
import ProductReviews from '@/components/ProductReviews';
import { trackHybridEvent } from '@/lib/fpixel';

export default function ProductClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  const productId = useMemo(() => searchParams.get('id'), [searchParams]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [whatsappNumber, setWhatsappNumber] = useState('923001234567');
  
  // Gallery state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Bundle selection: 1 (single), 2 (2-pack), 3 (3-pack)
  const [selectedBundleTier, setSelectedBundleTier] = useState<number>(1);

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    spec: true,
    style: false,
    ship: false,
    reviews: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
          trackHybridEvent({
            eventName: 'ViewContent',
            eventId: `view_${productData.id}_${Date.now()}`,
            customData: {
              content_name: productData.name,
              content_ids: [productData.id || ''],
              content_type: 'product',
              value: productData.price,
              currency: 'PKR',
            },
          });
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

  // Image list
  const images = useMemo(() => {
    if (!product || !product.images || product.images.length === 0) {
      return ['https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&auto=format&fit=crop&q=80'];
    }
    return product.images.map((img) => normalizeImageUrl(img));
  }, [product]);

  // Gallery Navigation
  const goToSlide = (idx: number) => {
    const target = Math.max(0, Math.min(idx, images.length - 1));
    setCurrentSlideIndex(target);
    if (viewerRef.current) {
      viewerRef.current.scrollTo({
        left: target * viewerRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleViewerScroll = () => {
    if (viewerRef.current) {
      const width = viewerRef.current.clientWidth;
      if (width > 0) {
        const idx = Math.round(viewerRef.current.scrollLeft / width);
        if (idx !== currentSlideIndex) {
          setCurrentSlideIndex(idx);
        }
      }
    }
  };

  // Pricing calculations
  const basePrice = product?.price || 0;
  const tier2Discount = product?.bundleDiscountTier2 ?? 10; // percent discount
  const tier3Discount = product?.bundleDiscountTier3 ?? 15; // percent discount

  // Price for bundle selection
  const tierPricing = useMemo(() => {
    const tier1Price = basePrice;
    const tier2Price = Math.round(basePrice * 2 * (1 - tier2Discount / 100));
    const tier3Price = Math.round(basePrice * 3 * (1 - tier3Discount / 100));

    return {
      1: { total: tier1Price, perItem: tier1Price, discount: 0 },
      2: { total: tier2Price, perItem: Math.round(tier2Price / 2), discount: tier2Discount },
      3: { total: tier3Price, perItem: Math.round(tier3Price / 3), discount: tier3Discount },
    };
  }, [basePrice, tier2Discount, tier3Discount]);

  const activeBundlePrice = tierPricing[selectedBundleTier as 1 | 2 | 3]?.total || basePrice;
  const currentTotalPrice = activeBundlePrice * quantity;

  // Compare/Original price
  const comparePrice = useMemo(() => {
    if (product?.comparePrice) {
      return product.comparePrice * selectedBundleTier * quantity;
    }
    // Estimated compare price
    return Math.round(currentTotalPrice * 1.3);
  }, [product, selectedBundleTier, quantity, currentTotalPrice]);

  // Cart / Order actions
  const handleAddToCart = () => {
    if (product) {
      const bundleLabel = selectedBundleTier === 1 ? '' : ` (${selectedBundleTier} Pairs Bundle)`;
      addToCart({
        productId: product.id!,
        name: `${product.name}${bundleLabel}`,
        price: activeBundlePrice,
        quantity,
        image: images[0] || '',
      });

      trackHybridEvent({
        eventName: 'AddToCart',
        eventId: `cart_${product.id}_${Date.now()}`,
        customData: {
          content_name: product.name,
          content_ids: [product.id || ''],
          content_type: 'product',
          value: currentTotalPrice,
          currency: 'PKR',
          contents: [
            {
              id: product.id || '',
              quantity,
              item_price: activeBundlePrice,
            },
          ],
        },
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

    trackHybridEvent({
      eventName: 'Contact',
      eventId: `whatsapp_${product.id}_${Date.now()}`,
      customData: {
        content_name: product.name,
        content_ids: [product.id || ''],
        value: currentTotalPrice,
        currency: 'PKR',
      },
    });

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const bundleText = selectedBundleTier === 1 ? '1 Pair' : `${selectedBundleTier} Pairs Bundle`;
    const message = `Hi FZhandcrafts! 🌸\nI would like to order:\n\n*Product:* ${product.name}\n*Bundle:* ${bundleText}\n*Price:* ${formatCurrency(activeBundlePrice)}\n*Quantity:* ${quantity}\n*Total Price:* ${formatCurrency(currentTotalPrice)}\n\n*Product Link:* ${currentUrl}\n\nPlease confirm availability and delivery details. Thank you!`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#013428]"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">Loading FZhandcrafts product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const specs = product.specifications || {};
  const bloomMaterial = specs.bloomMaterial || 'Imported Crush-proof Velvet';
  const glitterFlower = specs.glitterFlower || 'White and gold glitter flower';
  const weightDiameter = specs.weightDiameter || 'Weight 140g, 5in diameter';
  const fastener = specs.fastener || 'Soft silk ribbon';

  return (
    <div className="bg-[#fbf9f6] text-[#1b1c1a] min-h-screen pb-32">
      {/* Breadcrumbs Navigation with Small Light Green In Stock Badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-gray-500">
        <nav aria-label="Breadcrumbs" className="truncate">
          <ol className="inline-flex items-center gap-1.5 truncate">
            <li>
              <Link href="/" className="hover:text-[#013428] transition-colors">
                Home
              </Link>
            </li>
            <li className="opacity-40">/</li>
            <li>
              <Link href="/products" className="hover:text-[#013428] transition-colors">
                {product.category || 'Products'}
              </Link>
            </li>
            <li className="opacity-40">/</li>
            <li className="text-gray-900 font-semibold truncate">{product.name}</li>
          </ol>
        </nav>

        {/* Small Light Green In Stock Badge */}
        <div className="flex items-center gap-1.5 text-[#1e6b47] bg-[#e6f4ea] border border-[#a8dab5] px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34a853]"></span>
          <span>In Stock</span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ============================================================== */}
          {/* LEFT COLUMN: 1:1 ASPECT RATIO PHOTO VIEWER & THUMBNAILS        */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-4 lg:sticky lg:top-20">
            {/* 1:1 Aspect Ratio Main Photo Viewer */}
            <div className="relative w-full aspect-square bg-[#edebe8] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-200 group">
              {/* Scrollable / Swipeable Carousel */}
              <div
                ref={viewerRef}
                onScroll={handleViewerScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="w-full h-full flex-shrink-0 snap-center relative bg-gray-100 cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${product.name} - View ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  </div>
                ))}
              </div>

              {/* Floating Badges */}
              <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-col gap-1.5 items-start pointer-events-none z-10">
                <span className="bg-white/90 backdrop-blur-md text-[#6b1d30] text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1.5 border border-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6b1d30] animate-pulse"></span>
                  Handcrafted
                </span>
                <span className="bg-[#ffdead] text-[#4e1220] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide">
                  Special Edition
                </span>
              </div>

              {/* Counter Pill */}
              <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10">
                <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm border border-white/60">
                  {currentSlideIndex + 1} / {images.length}
                </span>
              </div>

              {/* Minimal Hidden < Button (reveals on hover) */}
              <button
                type="button"
                onClick={() => goToSlide(currentSlideIndex - 1)}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-[#6b1d30] shadow-md flex items-center justify-center opacity-0 group-hover:opacity-90 hover:!opacity-100 transition-all duration-300 z-20"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>

              {/* Minimal Hidden > Button (reveals on hover) */}
              <button
                type="button"
                onClick={() => goToSlide(currentSlideIndex + 1)}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-[#6b1d30] shadow-md flex items-center justify-center opacity-0 group-hover:opacity-90 hover:!opacity-100 transition-all duration-300 z-20"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>

              {/* Zoom Trigger Button */}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Zoom Photo"
                className="absolute bottom-3.5 right-3.5 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all z-10"
              >
                <FiMaximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Strip (Displays all photos small icons) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span className="font-medium tracking-wide">Photo Gallery ({images.length} views)</span>
                <span className="text-[11px]">Swipe or tap thumbnail</span>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    aria-label={`View photo ${idx + 1}`}
                    className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
                      currentSlideIndex === idx
                        ? 'ring-2 ring-[#6b1d30] opacity-100 scale-[1.02]'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: PRODUCT TITLE, PRICING, BUNDLES & ACTIONS       */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">

            {/* Title & Category Header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-[#6b1d30] font-bold">
                  FZhandcrafts Atelier
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                  <FiCheck className="text-[#6b1d30] text-sm" />
                  100% Handmade
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-[#013428] font-medium tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Rating & Social Proof */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 pt-0.5">
                <div className="flex items-center gap-1 text-amber-500">
                  <FaStar className="w-4 h-4 fill-amber-500" />
                  <FaStar className="w-4 h-4 fill-amber-500" />
                  <FaStar className="w-4 h-4 fill-amber-500" />
                  <FaStar className="w-4 h-4 fill-amber-500" />
                  <FaStar className="w-4 h-4 fill-amber-500" />
                  <span className="text-xs font-bold text-gray-900 ml-1">4.9</span>
                </div>
                <a href="#reviews-section" className="text-xs text-gray-500 hover:text-[#013428] font-medium">
                  (1,420 reviews)
                </a>
                <span className="bg-[#bdeddb] text-[#002018] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  🌿 Velvet &amp; Silk Craft
                </span>
              </div>
            </div>

            {/* Mobile-Friendly Non-Distorting Price Box */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Special Offer Price</span>
                <div className="flex flex-wrap items-baseline gap-2 mt-1">
                  <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#013428] leading-none">
                    {formatCurrency(activeBundlePrice)}
                  </span>
                  {comparePrice > activeBundlePrice && (
                    <span className="text-sm sm:text-base text-gray-400 line-through font-medium">
                      {formatCurrency(comparePrice)}
                    </span>
                  )}
                  <span className="bg-[#6b1d30]/10 text-[#6b1d30] text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    23% OFF
                  </span>
                </div>
              </div>

              <div className="flex sm:justify-end">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#1e6b47] font-semibold bg-[#e6f4ea] border border-[#a8dab5] px-3 py-1 rounded-full whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse"></span>
                  In Stock &amp; Ready
                </span>
              </div>
            </div>

            {/* Product Description */}
            <div className="text-sm sm:text-base text-gray-700 leading-relaxed space-y-2 border-l-2 border-[#6b1d30]/30 pl-4 whitespace-pre-line">
              <p>{product.description}</p>
            </div>

            {/* Bundle Quantity Selector */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-gray-900 font-bold">Select Gajray Quantity</span>
                <span className="text-xs text-[#6b1d30] font-bold">Bundle &amp; Save up to 15%</span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {/* 1 Pair */}
                <label
                  onClick={() => setSelectedBundleTier(1)}
                  className={`relative flex flex-col p-2.5 sm:p-3 rounded-xl bg-white cursor-pointer transition-all duration-200 ${
                    selectedBundleTier === 1
                      ? 'border-2 border-[#6b1d30] shadow-sm bg-[#6b1d30]/5'
                      : 'border border-gray-200 hover:border-[#6b1d30]/50'
                  }`}
                >
                  <input type="radio" name="bundle_tier" value="1" checked={selectedBundleTier === 1} readOnly className="hidden" />
                  <span className="text-xs font-bold text-[#013428]">1 Pair</span>
                  <span className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(tierPricing[1].total)}</span>
                  <span className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">{formatCurrency(tierPricing[1].perItem)}/ea</span>
                  {selectedBundleTier === 1 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#6b1d30] text-white flex items-center justify-center">
                      <FiCheck className="text-[10px]" />
                    </span>
                  )}
                </label>

                {/* 2 Pairs */}
                <label
                  onClick={() => setSelectedBundleTier(2)}
                  className={`relative flex flex-col p-2.5 sm:p-3 rounded-xl bg-white cursor-pointer transition-all duration-200 ${
                    selectedBundleTier === 2
                      ? 'border-2 border-[#6b1d30] shadow-sm bg-[#6b1d30]/5'
                      : 'border border-gray-200 hover:border-[#6b1d30]/50'
                  }`}
                >
                  <input type="radio" name="bundle_tier" value="2" checked={selectedBundleTier === 2} readOnly className="hidden" />
                  <span className="absolute -top-2 left-2 bg-[#6b1d30] text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-tight font-bold">
                    POPULAR
                  </span>
                  <span className="text-xs font-bold text-[#013428]">2 Pairs</span>
                  <span className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(tierPricing[2].total)}</span>
                  <span className="text-[10px] sm:text-[11px] text-[#2D5A47] font-medium mt-0.5">{formatCurrency(tierPricing[2].perItem)}/ea</span>
                  <span className="mt-1 bg-[#013428]/10 text-[#013428] text-[9px] font-bold px-1 rounded text-center">
                    SAVE {tier2Discount}%
                  </span>
                  {selectedBundleTier === 2 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#6b1d30] text-white flex items-center justify-center">
                      <FiCheck className="text-[10px]" />
                    </span>
                  )}
                </label>

                {/* 3 Pairs */}
                <label
                  onClick={() => setSelectedBundleTier(3)}
                  className={`relative flex flex-col p-2.5 sm:p-3 rounded-xl bg-white cursor-pointer transition-all duration-200 ${
                    selectedBundleTier === 3
                      ? 'border-2 border-[#6b1d30] shadow-sm bg-[#6b1d30]/5'
                      : 'border border-gray-200 hover:border-[#6b1d30]/50'
                  }`}
                >
                  <input type="radio" name="bundle_tier" value="3" checked={selectedBundleTier === 3} readOnly className="hidden" />
                  <span className="absolute -top-2 left-2 bg-[#dca84e] text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-tight font-bold">
                    BEST VALUE
                  </span>
                  <span className="text-xs font-bold text-[#013428]">3 Pairs</span>
                  <span className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(tierPricing[3].total)}</span>
                  <span className="text-[10px] sm:text-[11px] text-[#2D5A47] font-medium mt-0.5">{formatCurrency(tierPricing[3].perItem)}/ea</span>
                  <span className="mt-1 bg-[#013428]/10 text-[#013428] text-[9px] font-bold px-1 rounded text-center">
                    SAVE {tier3Discount}%
                  </span>
                  {selectedBundleTier === 3 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#6b1d30] text-white flex items-center justify-center">
                      <FiCheck className="text-[10px]" />
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Video preview if available */}
            {product.youtubeVideoUrl && (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-white p-3">
                <h4 className="text-xs font-bold text-gray-800 mb-2">🎥 Product Video Demonstration</h4>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={product.youtubeVideoUrl.replace('watch?v=', 'embed/').split('&')[0]}
                    title="Product Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Quantity Selector & High Conversion Actions */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center justify-between bg-white border border-gray-200 p-2.5 rounded-xl">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider pl-1">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 flex items-center justify-center font-bold text-base transition-colors"
                  >
                    -
                  </button>
                  <span className="text-base font-bold w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 flex items-center justify-center font-bold text-base transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Order Now & WhatsApp (Fixed minimum height 56px, no shrink on mobile) */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={handleOrderNow}
                  className="w-full sm:flex-1 h-14 min-h-[56px] flex-shrink-0 px-6 rounded-full bg-[#013428] hover:bg-[#1e4b3e] text-white font-semibold text-sm sm:text-base shadow-[0_8px_20px_rgba(1,52,40,0.25)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <FiShoppingCart className="w-5 h-5 flex-shrink-0" />
                  <span>Order Now — {formatCurrency(currentTotalPrice)}</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  className="w-full sm:w-auto h-14 min-h-[56px] flex-shrink-0 px-6 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <FaWhatsapp className="w-5 h-5 text-white flex-shrink-0" />
                  <span>Order via WhatsApp</span>
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full h-12 rounded-full border-2 border-[#013428] text-[#013428] hover:bg-[#013428]/5 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <FiShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
            </div>

            {/* Accordions Section */}
            <div className="flex flex-col gap-2.5 pt-2">
              {/* Accordion 1: Specifications */}
              <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleAccordion('spec')}
                  aria-expanded={openAccordions.spec}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left text-sm font-semibold text-[#013428]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[#6b1d30] font-bold">⚙️</span>
                    Product Specifications &amp; Materials
                  </span>
                  <span className={`transform transition-transform text-xs text-gray-500 ${openAccordions.spec ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {openAccordions.spec && (
                  <div className="px-4 pb-4 flex flex-col gap-2.5 text-xs text-gray-700">
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-gray-50">
                      <div>
                        <span className="font-bold text-gray-900 block text-[11px]">Bloom Material</span>
                        <span>{bloomMaterial}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-[11px]">Glitter Flower</span>
                        <span>{glitterFlower}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-[11px]">Weight &amp; Diameter</span>
                        <span>{weightDiameter}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-[11px]">Fastener</span>
                        <span>{fastener}</span>
                      </div>
                    </div>
                    <p className="leading-relaxed text-[11px] text-gray-500">
                      Each piece is lovingly handcrafted at FZhandcrafts with high attention to detail for an authentic festive look.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 2: Styling and Wear Guide */}
              <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleAccordion('style')}
                  aria-expanded={openAccordions.style}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left text-sm font-semibold text-[#013428]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[#6b1d30] font-bold">✨</span>
                    Styling &amp; Wear
                  </span>
                  <span className={`transform transition-transform text-xs text-gray-500 ${openAccordions.style ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {openAccordions.style && (
                  <div className="px-4 pb-4 text-xs text-gray-700">
                    <ul className="flex flex-col gap-2 list-disc pl-4 text-xs leading-relaxed">
                      <li>
                        <strong>Bridal &amp; Wedding Wear:</strong> Tie gently around the wrists as traditional floral gajray for Barat, Walima, Mehndi, and Mayun.
                      </li>
                      <li>
                        <strong>Hair Bun &amp; Chignon:</strong> Wrap around your hair bun or braid to create an elegant bridal hairstyle that stays flawless all day.
                      </li>
                      <li>
                        <strong>Festive Events:</strong> Complements shalwar kameez, sarees, and lehengas with everlasting charm.
                      </li>
                      <li>
                        <strong>Comfortable &amp; Reusable:</strong> Soft silk ribbons make it easy to adjust comfortably without pulling hair or sliding off.
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Accordion 3: Delivery and Packaging */}
              <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleAccordion('ship')}
                  aria-expanded={openAccordions.ship}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left text-sm font-semibold text-[#013428]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[#6b1d30] font-bold">📦</span>
                    Delivery &amp; Packaging
                  </span>
                  <span className={`transform transition-transform text-xs text-gray-500 ${openAccordions.ship ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {openAccordions.ship && (
                  <div className="px-4 pb-4 flex flex-col gap-2 text-xs text-gray-700">
                    <p className="leading-relaxed">
                      Crafting and delivery takes 2-3 working days across Pakistan.
                    </p>
                    <p className="leading-relaxed text-gray-500">
                      Carefully packed in secure protective packaging to ensure your gajray arrive in flawless shape and condition.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Customer Reviews Section */}
        <div id="reviews-section" className="mt-12">
          <ProductReviews productId={product.id!} productName={product.name} />
        </div>
      </div>

      {/* ============================================================== */}
      {/* STICKY BOTTOM ORDER NOW BAR                                    */}
      {/* ============================================================== */}
      <aside className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-8px_30px_rgba(1,52,40,0.1)] py-2 sm:py-3">
        <div className="min-h-[56px] px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col min-w-0 flex-shrink-0">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e6b47] animate-pulse"></span>
              Ready to ship
            </span>
            <span className="font-serif text-lg sm:text-2xl font-bold text-[#013428] leading-tight truncate">
              {formatCurrency(currentTotalPrice)}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md justify-end min-w-0">
            <button
              type="button"
              onClick={handleWhatsAppOrder}
              title="Chat on WhatsApp"
              className="hidden sm:flex h-12 min-h-[48px] flex-shrink-0 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white items-center gap-1.5 text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
            >
              <FaWhatsapp className="w-4 h-4 text-white" />
              <span>WhatsApp</span>
            </button>

            {/* Guaranteed minimum height and flex-shrink-0 on mobile */}
            <button
              type="button"
              onClick={handleOrderNow}
              className="flex-1 sm:flex-initial h-12 min-h-[48px] flex-shrink-0 px-4 sm:px-8 rounded-full bg-[#013428] hover:bg-[#1e4b3e] text-white flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold shadow-[0_8px_20px_rgba(1,52,40,0.25)] hover:scale-[1.01] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <FiShoppingCart className="w-4 h-4 flex-shrink-0" />
              <span>Order Now — {formatCurrency(currentTotalPrice)}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Lightbox / Zoom Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full aspect-square flex items-center justify-center">
            <Image
              src={images[currentSlideIndex]}
              alt="Zoomed product view"
              fill
              className="object-contain rounded-xl"
              sizes="90vw"
            />
          </div>
          <div className="text-white/80 text-xs mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() => goToSlide(currentSlideIndex - 1)}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              &larr; Previous
            </button>
            <span>
              {currentSlideIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => goToSlide(currentSlideIndex + 1)}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
