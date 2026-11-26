import { Suspense } from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import ProductClient from './ProductClient';
import { fetchServerProduct } from '@/lib/serverProduct';
import { normalizeImageUrl } from '@/lib/utils';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedSearchParams = await props.searchParams;
  const id = typeof resolvedSearchParams.id === 'string' ? resolvedSearchParams.id : '';

  if (!id) {
    return {
      title: 'Product - FZhandcrafts',
      description: 'Handcrafted artificial velvet gajray and luxury floral jewelry.',
    };
  }

  const product = await fetchServerProduct(id);
  if (!product) {
    return {
      title: 'Handcrafted Floral Gajray - FZhandcrafts',
      description: 'Discover handcrafted artificial velvet floral jewelry and bridal accessories.',
    };
  }

  const primaryImage = product.images?.[0] ? normalizeImageUrl(product.images[0]) : 'https://fz-flower.shop/icon.svg';
  const priceFormatted = `Rs. ${product.price.toLocaleString('en-PK')}`;
  const title = `${product.name} — ${priceFormatted} | FZhandcrafts`;
  const description = product.description
    ? `${product.description.slice(0, 160)}... Cash on Delivery across Pakistan.`
    : `Order ${product.name} at ${priceFormatted}. 2-3 Days Fast Courier Delivery all across Pakistan.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://fz-flower.shop/product?id=${encodeURIComponent(id)}`,
      siteName: 'FZhandcrafts',
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [primaryImage],
    },
  };
}

// Visual placeholder skeleton rendered instantaneously on the first byte
// Prevents blank space on slow mobile 4G / Instagram browser while client bundle hydrates
function ProductPageSkeleton() {
  return (
    <div className="bg-[#fbf9f6] text-[#1b1c1a] min-h-screen pb-32 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Gallery Image Skeleton */}
          <div className="space-y-4">
            <div className="w-full aspect-square bg-gray-200 rounded-3xl"></div>
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
              <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
              <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-8 w-3/4 bg-gray-200 rounded-lg"></div>
              <div className="h-5 w-1/3 bg-gray-200 rounded"></div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-3">
              <div className="h-9 w-40 bg-gray-200 rounded"></div>
              <div className="h-4 w-60 bg-gray-200 rounded"></div>
            </div>

            {/* Bundle Tiers Skeleton */}
            <div className="space-y-3">
              <div className="h-16 w-full bg-white rounded-2xl border border-gray-100"></div>
              <div className="h-16 w-full bg-white rounded-2xl border border-gray-100"></div>
            </div>

            {/* CTA Button Skeleton */}
            <div className="h-14 w-full bg-emerald-950/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ProductPage(props: Props) {
  const resolvedSearchParams = await props.searchParams;
  const id = typeof resolvedSearchParams.id === 'string' ? resolvedSearchParams.id : '';
  const initialProduct = id ? await fetchServerProduct(id) : null;

  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductClient initialProduct={initialProduct} />
    </Suspense>
  );
}
