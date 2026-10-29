'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addProduct } from '@/lib/firestore';
import { normalizeImageUrl } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import AdminProtected from '@/components/AdminProtected';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [detailedError, setDetailedError] = useState<{
    message: string;
    code: string;
    authStatus: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    bundleDiscountTier2: '10',
    bundleDiscountTier3: '15',
    category: '',
    images: [''],
    youtubeVideoUrl: '',
    inStock: true,
    bloomMaterial: 'Imported Crush-proof Velvet',
    glitterFlower: 'White and gold glitter flower',
    weightDiameter: 'Weight 140g, 5in diameter',
    fastener: 'Soft silk ribbon',
  });

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    // Auto normalize if user pasted a Google Drive link or other cloud link
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
    setLoading(true);
    setDetailedError(null);

    try {
      const images = formData.images
        .map(img => normalizeImageUrl(img).trim())
        .filter(img => img !== '');

      if (images.length === 0) {
        toast.error('Please add at least one image URL');
        setLoading(false);
        return;
      }

      const productData: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        bundleDiscountTier2: formData.bundleDiscountTier2 ? parseFloat(formData.bundleDiscountTier2) : 10,
        bundleDiscountTier3: formData.bundleDiscountTier3 ? parseFloat(formData.bundleDiscountTier3) : 15,
        category: formData.category,
        images,
        inStock: formData.inStock,
        specifications: {
          bloomMaterial: formData.bloomMaterial,
          glitterFlower: formData.glitterFlower,
          weightDiameter: formData.weightDiameter,
          fastener: formData.fastener,
        },
      };

      if (formData.youtubeVideoUrl && formData.youtubeVideoUrl.trim() !== '') {
        productData.youtubeVideoUrl = formData.youtubeVideoUrl.trim();
      }

      await addProduct(productData);

      toast.success('Product added successfully!');
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Error adding product:', error);
      const authUser = auth.currentUser;
      const errorMsg = error?.message || 'Unknown error occurred';
      const errorCode = error?.code || 'unknown';
      const authInfo = authUser
        ? `Logged in as: ${authUser.email || authUser.phoneNumber || authUser.uid}`
        : 'NOT logged in (Firebase auth.currentUser is null)';

      setDetailedError({
        message: errorMsg,
        code: errorCode,
        authStatus: authInfo,
      });

      toast.error(`Error (${errorCode}): ${errorMsg}`, { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6">Add New Product</h1>

          {detailedError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg text-red-900 shadow-sm">
              <div className="flex items-center font-bold text-red-800 text-lg mb-2">
                <span className="mr-2 text-xl">⚠️</span> Exact Error Details
              </div>
              <div className="space-y-1.5 text-sm">
                <p><strong className="text-gray-900">Message:</strong> {detailedError.message}</p>
                <p><strong className="text-gray-900">Error Code:</strong> <code className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono font-semibold">{detailedError.code}</code></p>
                <p><strong className="text-gray-900">Auth Status:</strong> {detailedError.authStatus}</p>
              </div>
              {detailedError.code === 'permission-denied' && (
                <div className="mt-3 p-3 bg-white border border-red-300 rounded text-xs text-red-900">
                  <strong>💡 Why this occurs:</strong> Firestore rules allow writes only if <code>request.auth != null</code>. If your Auth Status says you are not logged in, please log out and log in again at <a href="/admin/login" className="underline font-bold text-red-700">/admin/login</a>.
                </div>
              )}
            </div>
          )}

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

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (PKR / Rs.) *
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
                <label htmlFor="comparePrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Original / Strike-through Price (PKR / Rs.)
                </label>
                <input
                  type="number"
                  id="comparePrice"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 3200"
                  value={formData.comparePrice}
                  onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-black"
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
                  placeholder="e.g., Gajray, Bouquets, Flowers"
                  className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                />
              </div>
            </div>

            {/* Bundle Tier Discounts */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-bold text-gray-800 mb-2">📦 Bundle Discounts</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    2-Pack / 2 Pairs Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.bundleDiscountTier2}
                    onChange={(e) => setFormData({ ...formData, bundleDiscountTier2: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    3-Pack / 3 Pairs Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.bundleDiscountTier3}
                    onChange={(e) => setFormData({ ...formData, bundleDiscountTier3: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-black"
                  />
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-bold text-gray-800 mb-2">⚙️ Product Specifications</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bloom Material
                  </label>
                  <input
                    type="text"
                    value={formData.bloomMaterial}
                    onChange={(e) => setFormData({ ...formData, bloomMaterial: e.target.value })}
                    placeholder="e.g. Imported Crush-proof Velvet"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Glitter Flower / Hardware
                  </label>
                  <input
                    type="text"
                    value={formData.glitterFlower}
                    onChange={(e) => setFormData({ ...formData, glitterFlower: e.target.value })}
                    placeholder="e.g. White and gold glitter flower"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Weight & Diameter
                  </label>
                  <input
                    type="text"
                    value={formData.weightDiameter}
                    onChange={(e) => setFormData({ ...formData, weightDiameter: e.target.value })}
                    placeholder="e.g. Weight 140g, 5in diameter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Fastener
                  </label>
                  <input
                    type="text"
                    value={formData.fastener}
                    onChange={(e) => setFormData({ ...formData, fastener: e.target.value })}
                    placeholder="e.g. Soft silk ribbon"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-black"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product Image URLs *
              </label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-3 space-y-1">
                <p className="font-semibold">💡 Free Image Hosting Options:</p>
                <p>• <strong>Google Drive:</strong> Upload image, set file share to <em>&quot;Anyone with the link can view&quot;</em>, and paste the link here. It is automatically converted into a direct web image!</p>
                <p>• <strong>Other Free Hosts:</strong> Imgur, PostImages, Cloudinary, or Unsplash direct links.</p>
              </div>

              {formData.images.map((image, index) => (
                <div key={index} className="space-y-2 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="Paste image link (e.g. Google Drive sharing link, Imgur, or direct URL)"
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

                  {/* Live preview */}
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
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Product...' : 'Add Product'}
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



