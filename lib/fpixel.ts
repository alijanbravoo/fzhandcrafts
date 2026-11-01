// lib/fpixel.ts

// Supports both NEXT_PUBLIC_FACEBOOK_PIXEL_ID and NEXT_PUBLIC_META_PIXEL_ID
export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  '';

/**
 * Read cookie by name in browser
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : undefined;
}

/**
 * Get or construct Meta click ID (_fbc) from cookie or url query parameter
 */
export function getFbc(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const existingCookie = getCookie('_fbc');
  if (existingCookie) return existingCookie;

  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      // Standard Meta format: fb.subdomainIndex.creationTime.fbclid
      return `fb.1.${Date.now()}.${fbclid}`;
    }
  } catch (e) {
    // Ignore URL parse error
  }
  return undefined;
}

/**
 * Get test_event_code dynamically from URL or sessionStorage for live testing in Events Manager
 */
export function getTestEventCode(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('test_event_code');
    if (codeFromUrl) {
      sessionStorage.setItem('meta_test_event_code', codeFromUrl);
      return codeFromUrl;
    }
    return sessionStorage.getItem('meta_test_event_code') || undefined;
  } catch (e) {
    return undefined;
  }
}

// Track PageView in browser
export const pageview = () => {
  if (typeof window !== 'undefined' && (window as any).fbq && FB_PIXEL_ID) {
    (window as any).fbq('track', 'PageView');
  }
};

// Track standard/custom events in browser with optional eventID for CAPI deduplication
export const event = (
  name: string,
  options: Record<string, any> = {},
  eventId?: string
) => {
  if (typeof window !== 'undefined' && (window as any).fbq && FB_PIXEL_ID) {
    if (eventId) {
      (window as any).fbq('track', name, options, { eventID: eventId });
    } else {
      (window as any).fbq('track', name, options);
    }
  }
};

/**
 * Dispatch an event to both the browser Pixel AND the server-side Conversions API (CAPI)
 * with the exact same eventId, fbp, and fbc so Meta can deduplicate them accurately.
 */
export async function trackHybridEvent({
  eventName,
  eventId,
  userData = {},
  customData = {},
}: {
  eventName: string;
  eventId: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    externalId?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: Record<string, any>;
}) {
  // 1. Browser Pixel Track with matching eventID
  try {
    event(eventName, customData, eventId);
  } catch (err) {
    console.warn('[Pixel] Error tracking client event:', err);
  }

  // 2. Extract _fbp, _fbc cookies and test_event_code for server deduplication & testing
  const fbp = userData.fbp || getCookie('_fbp');
  const fbc = userData.fbc || getFbc();
  const testEventCode = getTestEventCode();

  // 3. Server CAPI Track (with keepalive to prevent browser navigation from aborting the request)
  try {
    const res = await fetch('/api/fb-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId,
        testEventCode,
        userData: {
          ...userData,
          fbp,
          fbc,
        },
        customData,
        sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[CAPI] Error forwarding event to server:', err);
  }
}
