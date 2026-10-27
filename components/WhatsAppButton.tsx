'use client';

import { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { getSettings } from '@/lib/firestore';
import { cleanWhatsAppNumber } from '@/lib/utils';

interface WhatsAppButtonProps {
  customMessage?: string;
  phoneNumber?: string;
}

export default function WhatsAppButton({ customMessage, phoneNumber }: WhatsAppButtonProps) {
  const [waNumber, setWaNumber] = useState<string>('923001234567');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (phoneNumber) {
      setWaNumber(cleanWhatsAppNumber(phoneNumber));
      return;
    }

    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        if (settings.whatsappNumber) {
          setWaNumber(cleanWhatsAppNumber(settings.whatsappNumber));
        } else if (settings.contactPhone) {
          setWaNumber(cleanWhatsAppNumber(settings.contactPhone));
        }
      } catch (err) {
        console.warn('Could not load WhatsApp number from settings:', err);
      }
    };

    loadSettings();
  }, [phoneNumber]);

  const defaultText = customMessage || 'Hi FZhandcrafts! 🌸 I am browsing your website and have a question.';
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultText)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center group">
      {/* Tooltip */}
      <div 
        className={`mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 pointer-events-none ${
          showTooltip ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 hidden md:block group-hover:opacity-100 group-hover:translate-x-0'
        }`}
      >
        Chat on WhatsApp
      </div>

      {/* Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with FZhandcrafts on WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95"
      >
        {/* Animated Ping Ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none"></span>

        <FaWhatsapp className="w-8 h-8 relative z-10" />
      </a>
    </div>
  );
}
