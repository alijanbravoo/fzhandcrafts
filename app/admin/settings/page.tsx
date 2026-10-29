'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getSettings, 
  updateSettings, 
  getAdminAccounts, 
  addAdminAccount, 
  removeAdminAccount, 
  AdminAccount 
} from '@/lib/firestore';
import { SUPER_ADMIN_EMAIL, getCurrentUser } from '@/lib/auth';
import AdminProtected from '@/components/AdminProtected';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';
import { FiShield, FiUserPlus, FiTrash2, FiUserCheck, FiLock } from 'react-icons/fi';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  
  // Admin accounts state
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [deletingAdminEmail, setDeletingAdminEmail] = useState<string | null>(null);

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
    loadAdmins();
    getCurrentUser().then(user => {
      if (user?.email) {
        setCurrentUserEmail(user.email.toLowerCase().trim());
      }
    });
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

  const loadAdmins = async () => {
    try {
      const data = await getAdminAccounts();
      setAdmins(data);
    } catch (err) {
      console.error('Error loading admin accounts:', err);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newAdminEmail.toLowerCase().trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Please enter a valid Gmail address');
      return;
    }

    if (cleanEmail === SUPER_ADMIN_EMAIL) {
      toast.error(`${SUPER_ADMIN_EMAIL} is already the permanent Super Admin.`);
      return;
    }

    if (admins.some(a => a.email.toLowerCase() === cleanEmail)) {
      toast.error('This email is already an authorized administrator.');
      return;
    }

    setAddingAdmin(true);
    try {
      await addAdminAccount(cleanEmail, currentUserEmail || 'admin');
      toast.success(`Admin access granted to ${cleanEmail}`);
      setNewAdminEmail('');
      await loadAdmins();
    } catch (err: any) {
      console.error('Error adding admin:', err);
      toast.error(err?.message || 'Failed to grant admin access');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (emailToRemove: string) => {
    const clean = emailToRemove.toLowerCase().trim();
    if (clean === SUPER_ADMIN_EMAIL) {
      toast.error('Security Protected: The Super Admin cannot be removed.');
      return;
    }

    if (!confirm(`Are you sure you want to revoke admin access for ${clean}? They will no longer be able to log into the admin dashboard.`)) {
      return;
    }

    setDeletingAdminEmail(clean);
    try {
      await removeAdminAccount(clean);
      toast.success(`Revoked admin access for ${clean}`);
      await loadAdmins();
    } catch (err: any) {
      console.error('Error removing admin:', err);
      toast.error(err?.message || 'Failed to revoke admin');
    } finally {
      setDeletingAdminEmail(null);
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

            {/* Administrators Management Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-2">
                    <FiShield className="w-5 h-5 text-primary-600" />
                    <h2 className="text-xl font-bold text-gray-900">Admin Team &amp; Access Controls</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Manage authorized Gmail accounts that can log into the Admin Dashboard.
                  </p>
                </div>
              </div>

              {/* Add Admin Form */}
              <form onSubmit={handleAddAdmin} className="mt-6">
                <label htmlFor="newAdminEmail" className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-2">
                  Add New Authorized Admin (Gmail Address)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      id="newAdminEmail"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="e.g. colleague@gmail.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingAdmin || !newAdminEmail.trim()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
                  >
                    <FiUserPlus className="w-4 h-4" />
                    <span>{addingAdmin ? 'Granting Access...' : 'Authorize Admin'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Authorized accounts must sign in using the Google (Gmail) button on the Admin Login page.
                </p>
              </form>

              {/* List of Admins */}
              <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-gray-600 tracking-wider">Authorized Administrators</span>
                  <span className="text-xs font-semibold text-gray-500">{1 + admins.length} total</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {/* Permanent Super Admin */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                        👑
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm font-mono">{SUPER_ADMIN_EMAIL}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                            Super Admin
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">Permanent account • Cannot be removed or modified</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold self-start sm:self-auto">
                      <FiLock className="w-3.5 h-3.5" />
                      <span>Permanent Access</span>
                    </div>
                  </div>

                  {/* Other Authorized Admins */}
                  {admins.filter(a => a.email.toLowerCase() !== SUPER_ADMIN_EMAIL).map((admin) => (
                    <div key={admin.email} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">
                          <FiUserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm font-mono">{admin.email}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              Admin
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Added by {admin.addedBy || 'Super Admin'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(admin.email)}
                        disabled={deletingAdminEmail === admin.email}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors self-start sm:self-auto"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        <span>{deletingAdminEmail === admin.email ? 'Revoking...' : 'Revoke Access'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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



