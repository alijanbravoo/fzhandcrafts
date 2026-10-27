'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProduct, updateProduct } from '@/lib/firestore';
import { normalizeImageUrl } from '@/lib/utils';
import AdminProtected from '@/components/AdminProtected';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';

export default function EditProductClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = useMemo(() => searchParams.get('id'), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    images: [''],
    youtubeVideoUrl: '',
    inStock: true,
  });

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        toast.error('Product not found');
        router.push('/admin/products');
        return;
      }

      try {
        const product = await getProduct(productId);
        if (product) {
          setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
            images: product.images.length > 0 ? product.images : [''],
            youtubeVideoUrl: product.youtubeVideoUrl || '',
            inStock: product.inStock,
          });
        } else {
          toast.error('Product not found');
          router.push('/admin/products');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('Error loading product');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = normalizeImageUrl(value);
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const removeImageField = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages.length > 0 ? newImages : [''] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    setSaving(true);

    try {
      const images = formData.images
        .map((img) => normalizeImageUrl(img).trim())
        .filter((img) => img !== '');
      if (images.length === 0) {
        toast.error('Please add at least one image URL');
        return;
      }

      await updateProduct(productId, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        images,
        youtubeVideoUrl: formData.youtubeVideoUrl.trim() || undefined,
        inStock: formData.inStock,
      });

      toast.success('Product updated successfully!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error updating product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminProtected>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminProtected>
    );
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8">Edit Product</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Image URLs *</label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-3 space-y-1">
                  <p className="font-semibold">💡 Google Drive & Free Hosting Support:</p>
                  <p>• <strong>Google Drive:</strong> Paste any share link (ensure <em>&quot;Anyone with the link can view&quot;</em> is enabled). It is automatically converted into a direct web image!</p>
                </div>

                {formData.images.map((image, index) => (
                  <div key={index} className="space-y-2 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        placeholder="Paste image link (Google Drive share link, Imgur, or direct URL)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 text-sm"
                      />
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {image && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-16 h-16 rounded border bg-white overflow-hidden flex-shrink-0 relative">
                          <img
                            src={normalizeImageUrl(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 truncate">
                          Preview: {image.includes('google.com') ? 'Google Drive image connected' : 'Image loaded'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="mt-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold"
                >
                  + Add Another Image
                </button>
              </div>

              <div>
                <label htmlFor="youtubeVideoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube Video Link (Optional)
                </label>
                <input
                  type="url"
                  id="youtubeVideoUrl"
                  value={formData.youtubeVideoUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeVideoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add a YouTube video link to showcase your product (optional)
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">In Stock</span>
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Product'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/products')}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
