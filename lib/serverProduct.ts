// Helper to fetch server-side product details directly via Firestore REST API
// Used for Next.js generateMetadata and SSR so Meta crawlers, Instagram in-app browsers,
// and visitors immediately get rich Open Graph metadata (title, price, image, description)
export interface ServerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: string;
  images: string[];
  inStock: boolean;
}

export async function fetchServerProduct(id: string): Promise<ServerProduct | null> {
  if (!id) return null;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fzhandcrafts';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 }, // ISR cache for 60 seconds
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const fields = data.fields || {};

    const images: string[] = [];
    if (fields.images?.arrayValue?.values) {
      for (const v of fields.images.arrayValue.values) {
        if (v.stringValue) images.push(v.stringValue);
      }
    }

    const price = fields.price?.integerValue
      ? parseInt(fields.price.integerValue, 10)
      : fields.price?.doubleValue
      ? Math.round(fields.price.doubleValue)
      : 0;

    const comparePrice = fields.comparePrice?.integerValue
      ? parseInt(fields.comparePrice.integerValue, 10)
      : fields.comparePrice?.doubleValue
      ? Math.round(fields.comparePrice.doubleValue)
      : undefined;

    return {
      id,
      name: fields.name?.stringValue || 'Handcrafted Botanical Flora',
      description: fields.description?.stringValue || '',
      price,
      comparePrice,
      category: fields.category?.stringValue || 'Jewelry',
      images,
      inStock: fields.inStock?.booleanValue ?? true,
    };
  } catch (error) {
    console.warn('[fetchServerProduct] Error fetching product via REST:', error);
    return null;
  }
}
