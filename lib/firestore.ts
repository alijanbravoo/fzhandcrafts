import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc,
  setDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy,
  runTransaction,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { cleanPhoneNumber } from './utils';

// Product types
export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  youtubeVideoUrl?: string; // Optional YouTube video link
  inStock: boolean;
  createdAt?: Timestamp;
}

// Order types
export interface Order {
  id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  cancellationReason?: string;
  confirmationCallStatus?: 'pending' | 'picked_confirmed' | 'picked_cancelled' | 'not_picked' | 'hung_up' | string;
  specialRequest?: string;
  preferredCallTime?: string;
  userId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Review types
export interface Review {
  id?: string;
  productId: string;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt?: Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

// Products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(query(productsRef, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products. Please check your internet connection and try again.');
  }
};

export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    if (!id) {
      throw new Error('Product ID is required');
    }
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Failed to fetch product. Please try again.');
  }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('category', '==', category), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<string> => {
  const productsRef = collection(db, 'products');
  const docRef = await addDoc(productsRef, {
    ...product,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<void> => {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const docRef = doc(db, 'products', id);
  await deleteDoc(docRef);
};

// Orders
export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (!order.customerName || !order.items.length) {
      throw new Error('Invalid order data. Please fill in all required fields.');
    }
    const now = Timestamp.now();
    const docRef = doc(db, 'orders', order.orderNumber);
    await setDoc(docRef, {
      ...order,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order. Please check your connection and try again.');
  }
};

export const getOrders = async (): Promise<Order[]> => {
  const ordersRef = collection(db, 'orders');
  const snapshot = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const getOrder = async (id: string): Promise<Order | null> => {
  const docRef = doc(db, 'orders', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Order;
  }
  return null;
};

export const getOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
  const docRef = doc(db, 'orders', orderNumber);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Order;
};

export const updateOrderStatus = async (
  id: string, 
  status: Order['status'],
  cancellationReason?: string
): Promise<void> => {
  const docRef = doc(db, 'orders', id);
  const updateData: Record<string, any> = {
    status,
    updatedAt: Timestamp.now(),
  };
  if (status === 'cancelled' && cancellationReason) {
    updateData.cancellationReason = cancellationReason;
  }
  await updateDoc(docRef, updateData);
};

export const updateOrderCallStatus = async (
  id: string, 
  confirmationCallStatus: string
): Promise<void> => {
  const docRef = doc(db, 'orders', id);
  await updateDoc(docRef, {
    confirmationCallStatus,
    updatedAt: Timestamp.now(),
  });
};

export const getNextOrderNumber = async (): Promise<string> => {
  const counterRef = doc(db, 'counters', 'orders');

  const nextNumber = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);

    if (!snap.exists()) {
      const start = 1000;
      const first = start + 1;
      tx.set(counterRef, { next: first });
      return first;
    }

    const data = snap.data() as { next?: number };
    const currentNext = typeof data.next === 'number' ? data.next : 1001;
    tx.update(counterRef, { next: currentNext + 1 });
    return currentNext;
  });

  return String(nextNumber);
};

// Categories
export const getCategories = async (): Promise<string[]> => {
  const products = await getProducts();
  const categories = new Set(products.map(p => p.category));
  return Array.from(categories).sort();
};

// Settings
export interface Settings {
  homepageCoverPhoto?: string;
  homepageCoverPhotoLink?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  facebookLabel?: string;
  instagramUrl?: string;
  instagramLabel?: string;
  twitterUrl?: string;
  twitterLabel?: string;
}

export const getSettings = async (): Promise<Settings> => {
  try {
    const settingsRef = doc(db, 'settings', 'general');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      return settingsSnap.data() as Settings;
    }
    return {};
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
};

export const updateSettings = async (settings: Partial<Settings>): Promise<void> => {
  const settingsRef = doc(db, 'settings', 'general');
  const settingsSnap = await getDoc(settingsRef);

  const cleanedSettings = Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value !== undefined)
  ) as Partial<Settings>;

  if (settingsSnap.exists()) {
    await updateDoc(settingsRef, cleanedSettings);
  } else {
    await setDoc(settingsRef, cleanedSettings);
  }
};

// Reviews
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('productId', '==', productId));
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
    return reviews.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const docRef = await addDoc(reviewsRef, {
      ...review,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding review:', error);
    throw new Error('Failed to submit review. Please try again.');
  }
};

// Customer Orders Lookup
export const getCustomerOrders = async (params: {
  userId?: string;
  email?: string;
  phone?: string;
}): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')));
    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    
    const targetUserId = params.userId;
    const targetEmail = params.email ? params.email.toLowerCase().trim() : '';
    const targetPhone = params.phone ? cleanPhoneNumber(params.phone) : '';

    return all.filter(order => {
      if (targetUserId && order.userId === targetUserId) return true;
      if (targetEmail && order.customerEmail && order.customerEmail.toLowerCase().trim() === targetEmail) return true;
      if (targetPhone && order.customerPhone && cleanPhoneNumber(order.customerPhone) === targetPhone) return true;
      return false;
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
};


