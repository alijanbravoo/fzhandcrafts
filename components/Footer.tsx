'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiFacebook, FiInstagram, FiTwitter, FiMail, FiPhone } from 'react-icons/fi';
import { getSettings } from '@/lib/firestore';

export default function Footer() {
  const [contactEmail, setContactEmail] = useState('info@flowershop.com');
  const [contactPhone, setContactPhone] = useState('+92 300 1234567');
  const [facebookUrl, setFacebookUrl] = useState<string>('');
  const [facebookLabel, setFacebookLabel] = useState<string>('');
  const [instagramUrl, setInstagramUrl] = useState<string>('');
  const [instagramLabel, setInstagramLabel] = useState<string>('');
  const [twitterUrl, setTwitterUrl] = useState<string>('');
  const [twitterLabel, setTwitterLabel] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await getSettings();
        if (settings.contactEmail) setContactEmail(settings.contactEmail);
        if (settings.contactPhone) setContactPhone(settings.contactPhone);
        if (settings.facebookUrl) setFacebookUrl(settings.facebookUrl);
        if (settings.facebookLabel) setFacebookLabel(settings.facebookLabel);
        if (settings.instagramUrl) setInstagramUrl(settings.instagramUrl);
        if (settings.instagramLabel) setInstagramLabel(settings.instagramLabel);
        if (settings.twitterUrl) setTwitterUrl(settings.twitterUrl);
        if (settings.twitterLabel) setTwitterLabel(settings.twitterLabel);
      } catch {
      }
    };
    load();
  }, []);

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">🌸 FZhandcrafts</h3>
            <p className="text-gray-400">
              Beautiful artificial flowers, bouquets and fancy gajray for every occasion.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/products" className="hover:text-white">Products</Link></li>
              <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/order-status" className="hover:text-white">Order Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <FiMail className="w-4 h-4" />
                <span>{contactEmail}</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiPhone className="w-4 h-4" />
                <span>{contactPhone}</span>
              </li>
            </ul>
            <div className="space-y-2 mt-4">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-white inline-flex items-center gap-2"
                >
                  <FiFacebook className="w-5 h-5" />
                  <span className="text-sm">{facebookLabel || 'Facebook'}</span>
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-white inline-flex items-center gap-2"
                >
                  <FiInstagram className="w-5 h-5" />
                  <span className="text-sm">{instagramLabel || 'Instagram'}</span>
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-white inline-flex items-center gap-2"
                >
                  <FiTwitter className="w-5 h-5" />
                  <span className="text-sm">{twitterLabel || 'X'}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} FZhandcrafts. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}



