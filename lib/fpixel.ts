// lib/fpixel.ts

// Supports both NEXT_PUBLIC_FACEBOOK_PIXEL_ID and NEXT_PUBLIC_META_PIXEL_ID
export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  '';

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
 * with the exact same eventId so Meta can deduplicate them accurately.
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
  };
  customData?: Record<string, any>;
}) {
  // 1. Browser Pixel Track
  try {
    event(eventName, customData, eventId);
  } catch (err) {
    console.warn('[Pixel] Error tracking client event:', err);
  }

  // 2. Server CAPI Track
  try {
    const res = await fetch('/api/fb-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        eventId,
        userData,
        customData,
        sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[CAPI] Error forwarding event to server:', err);
  }
}
