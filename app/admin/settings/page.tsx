'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, updateSettings } from '@/lib/firestore';
import AdminProtected from '@/components/AdminProtected';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    homepageCoverPhoto: '',
    homepageCoverPhotoLink: '',
    contactEmail: '',
    contactPhone: '',
    whatsappNumber: '',
    facebookUrl: '',
    facebookLabel: '',
    instagramUrl: '',
    instagramLabel: '',
    twitterUrl: '',
    twitterLabel: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setFormData({
        homepageCoverPhoto: settings.homepageCoverPhoto || '',
        homepageCoverPhotoLink: settings.homepageCoverPhotoLink || '',
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        whatsappNumber: settings.whatsappNumber || '',
        facebookUrl: settings.facebookUrl || '',
        facebookLabel: settings.facebookLabel || '',
        instagramUrl: settings.instagramUrl || '',
        instagramLabel: settings.instagramLabel || '',
        twitterUrl: settings.twitterUrl || '',
        twitterLabel: settings.twitterLabel || '',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateSettings({
        homepageCoverPhoto: formData.homepageCoverPhoto.trim() || undefined,
        homepageCoverPhotoLink: formData.homepageCoverPhotoLink.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        whatsappNumber: formData.whatsappNumber.trim() || undefined,
        facebookUrl: formData.facebookUrl.trim() || undefined,
        facebookLabel: formData.facebookLabel.trim() || undefined,
        instagramUrl: formData.instagramUrl.trim() || undefined,
        instagramLabel: formData.instagramLabel.trim() || undefined,
        twitterUrl: formData.twitterUrl.trim() || undefined,
        twitterLabel: formData.twitterLabel.trim() || undefined,
      });

      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error updating settings');
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
      <div className="min-h-screen bg-gray-50 flex w-full max-w-full overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 w-full max-w-full min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label htmlFor="homepageCoverPhoto" className="block text-sm font-medium text-gray-700 mb-2">
                Homepage Cover Photo URL
              </label>
              <input
                type="url"
                id="homepageCoverPhoto"
                value={formData.homepageCoverPhoto}
                onChange={(e) => setFormData({ ...formData, homepageCoverPhoto: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a cover photo URL for the homepage hero section. Leave empty to use default gradient.
              </p>
              {formData.homepageCoverPhoto && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={formData.homepageCoverPhoto}
                      alt="Cover photo preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="homepageCoverPhotoLink" className="block text-sm font-medium text-gray-700 mb-2">
                Homepage Cover Photo Link (Optional)
              </label>
              <input
                type="url"
                id="homepageCoverPhotoLink"
                value={formData.homepageCoverPhotoLink}
                onChange={(e) => setFormData({ ...formData, homepageCoverPhotoLink: e.target.value })}
                placeholder="https://example.com/page"
                className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a link that users will be redirected to when clicking on the cover photo. Leave empty if no link is needed.
              </p>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Footer Contact Details</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="info@yourstore.com"
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Business WhatsApp Number (for Quick Order & Chat)
                  </label>
                  <input
                    type="text"
                    id="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="03001234567 or 923001234567"
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Customers will use this WhatsApp number for 1-click orders and questions.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    id="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/..."
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                  <label htmlFor="facebookLabel" className="block text-sm font-medium text-gray-700 mb-2 mt-3">
                    Facebook Link Text (Optional)
                  </label>
                  <input
                    type="text"
                    id="facebookLabel"
                    value={formData.facebookLabel}
                    onChange={(e) => setFormData({ ...formData, facebookLabel: e.target.value })}
                    placeholder="FZhandcrafts Facebook"
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                </div>

                <div>
                  <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    id="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                  <label htmlFor="instagramLabel" className="block text-sm font-medium text-gray-700 mb-2 mt-3">
                    Instagram Link Text (Optional)
                  </label>
                  <input
                    type="text"
                    id="instagramLabel"
                    value={formData.instagramLabel}
                    onChange={(e) => setFormData({ ...formData, instagramLabel: e.target.value })}
                    placeholder="FZhandcrafts Instagram"
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                </div>

                <div>
                  <label htmlFor="twitterUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter/X URL
                  </label>
                  <input
                    type="url"
                    id="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                    placeholder="https://x.com/..."
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                  <label htmlFor="twitterLabel" className="block text-sm font-medium text-gray-700 mb-2 mt-3">
                    Twitter/X Link Text (Optional)
                  </label>
                  <input
                    type="text"
                    id="twitterLabel"
                    value={formData.twitterLabel}
                    onChange={(e) => setFormData({ ...formData, twitterLabel: e.target.value })}
                    placeholder="FZhandcrafts X"
                    className="w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-black bg-white text-black"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin')}
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



