'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCategories, getProductsByCategory } from '@/lib/firestore';
import { Product } from '@/lib/firestore';
import ProductCard from '@/components/ProductCard';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      if (selectedCategory) {
        try {
          const prods = await getProductsByCategory(selectedCategory);
          setProducts(prods);
        } catch (error) {
          console.error('Error loading products:', error);
        }
      } else {
        setProducts([]);
      }
    };
    loadProducts();
  }, [selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Categories</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedCategory === category
                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                <h3 className="font-semibold text-lg">{category}</h3>
              </button>
            ))}
          </div>

          {selectedCategory && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Products in {selectedCategory}
              </h2>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No products found in this category.</p>
                </div>
              )}
            </div>
          )}

          {!selectedCategory && (
            <div className="text-center py-12 text-gray-500">
              <p>Select a category to view products.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}







