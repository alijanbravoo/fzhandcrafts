export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Simple order number generator - easy to remember (e.g., 1001, 1002, 1003)
let orderCounter = 0;

export const generateOrderNumber = (): string => {
  // Get or initialize counter from localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('fz_order_counter');
    if (stored) {
      orderCounter = parseInt(stored, 10);
    } else {
      // Start from 1000 for easy to remember numbers
      orderCounter = 1000;
    }
  } else {
    orderCounter = 1000;
  }
  
  orderCounter += 1;
  
  // Save counter back to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('fz_order_counter', orderCounter.toString());
  }
  
  return orderCounter.toString();
};

// Clean all non-digit characters from phone number
export const cleanPhoneNumber = (phone: string): string => {
  return (phone || '').replace(/\D/g, '');
};

// Validate Pakistani phone number (must be 11 digits and start with 03)
export const validatePakistaniPhone = (
  phone: string
): { isValid: boolean; cleaned: string; error?: string } => {
  const cleaned = cleanPhoneNumber(phone);
  
  if (!cleaned) {
    return { isValid: false, cleaned: '', error: 'Phone number is required' };
  }
  
  if (!cleaned.startsWith('03')) {
    return {
      isValid: false,
      cleaned,
      error: 'Phone number must start with 03 (e.g. 03001234567)',
    };
  }
  
  if (cleaned.length !== 11) {
    return {
      isValid: false,
      cleaned,
      error: `Phone number must be exactly 11 digits (currently ${cleaned.length} digits)`,
    };
  }
  
  return { isValid: true, cleaned };
};

// Format phone number nicely for display (e.g. 0300 1234567)
export const formatPakistaniPhone = (phone: string): string => {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  return phone;
};

// Virtual email domain for phone-number based guest & phone accounts
export const PHONE_AUTH_DOMAIN = 'phone.fzhandcrafts.com';

export const phoneToEmail = (phone: string): string => {
  const cleaned = cleanPhoneNumber(phone);
  return `${cleaned}@${PHONE_AUTH_DOMAIN}`;
};

export const isPhoneAccountEmail = (email?: string | null): boolean => {
  return !!(email && email.endsWith(`@${PHONE_AUTH_DOMAIN}`));
};

export const extractPhoneFromEmail = (email?: string | null): string => {
  if (!email || !isPhoneAccountEmail(email)) return '';
  return email.split('@')[0];
};

// Format phone for international WhatsApp link (e.g. 923001234567)
export const cleanWhatsAppNumber = (phone: string): string => {
  const digits = cleanPhoneNumber(phone);
  if (digits.startsWith('92')) {
    return digits;
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return '92' + digits.slice(1);
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return '92' + digits;
  }
  return digits;
};

// Normalize image URLs (converts Google Drive sharing links, Dropbox, etc. into direct embeddable image links)
export const normalizeImageUrl = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = url.trim();

  // Google Drive: extract file ID
  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const driveFileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const matchFile = trimmed.match(driveFileRegex);
  if (matchFile && matchFile[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or /uc?id=FILE_ID
  const driveIdRegex = /drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/;
  const matchId = trimmed.match(driveIdRegex);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }

  // Dropbox: replace dl=0 with raw=1
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('dl=0', 'raw=1');
  }

  return trimmed;
};



