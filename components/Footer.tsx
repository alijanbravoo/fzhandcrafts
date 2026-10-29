'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiFacebook, FiInstagram, FiTwitter, FiMail, FiPhone } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { getSettings } from '@/lib/firestore';

export default function Footer() {
  const [contactEmail, setContactEmail] = useState('info@fzhandcrafts.com');
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
    <footer className="bg-[#4e1220] text-[#fbf9f6] border-t border-[#ffdead]/20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-1.5 group inline-flex">
              <span className="font-serif text-2xl tracking-tight text-[#ffdead] font-semibold leading-none">
                FZhandcrafts
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffdead]"></span>
            </Link>
            <p className="text-xs text-[#fbf9f6]/80 leading-relaxed font-light">
              Artisan handcrafted artificial velvet gajray, luxury floral jewelry, and festive chignon adornments. Stays fresh forever.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#ffdead]">
              <span>🇵🇰 Delivered across Pakistan</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-[#ffdead] uppercase mb-4">
              Explore Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-[#fbf9f6]/80">
              <li><Link href="/" className="hover:text-[#ffdead] transition-colors">Home Atelier</Link></li>
              <li><Link href="/products" className="hover:text-[#ffdead] transition-colors">All Floral Gajray</Link></li>
              <li><Link href="/categories" className="hover:text-[#ffdead] transition-colors">Wedding &amp; Festive Tiers</Link></li>
              <li><Link href="/about" className="hover:text-[#ffdead] transition-colors">About Our Craft</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-[#ffdead] uppercase mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-[#fbf9f6]/80">
              <li><Link href="/contact" className="hover:text-[#ffdead] transition-colors">Contact Atelier</Link></li>
              <li><Link href="/order-status" className="hover:text-[#ffdead] transition-colors">Live Order Tracker</Link></li>
              <li><Link href="/cart" className="hover:text-[#ffdead] transition-colors">Shopping Bag</Link></li>
              <li>
                <a
                  href={`https://wa.me/${contactPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ffdead] transition-colors inline-flex items-center gap-1.5 text-[#25D366]"
                >
                  <FaWhatsapp className="w-3.5 h-3.5" />
                  <span>WhatsApp Concierge</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-[#ffdead] uppercase mb-4">
              Contact &amp; Support
            </h4>
            <ul className="space-y-2.5 text-xs text-[#fbf9f6]/80">
              <li className="flex items-center space-x-2">
                <FiMail className="w-4 h-4 text-[#ffdead]" />
                <span>{contactEmail}</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiPhone className="w-4 h-4 text-[#ffdead]" />
                <span>{contactPhone}</span>
              </li>
            </ul>

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ffdead] hover:text-[#4e1220] flex items-center justify-center transition-all text-[#fbf9f6]"
                  title="Facebook"
                >
                  <FiFacebook className="w-4 h-4" />
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ffdead] hover:text-[#4e1220] flex items-center justify-center transition-all text-[#fbf9f6]"
                  title="Instagram"
                >
                  <FiInstagram className="w-4 h-4" />
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ffdead] hover:text-[#4e1220] flex items-center justify-center transition-all text-[#fbf9f6]"
                  title="Twitter / X"
                >
                  <FiTwitter className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#fbf9f6]/60 gap-3">
          <p>&copy; {new Date().getFullYear()} FZhandcrafts. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Handcrafted with <span className="text-[#ffdead]">♥</span> in Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
