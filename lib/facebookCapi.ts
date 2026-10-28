// lib/facebookCapi.ts
import crypto from 'crypto';

const PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  '';

const ACCESS_TOKEN = process.env.FACEBOOK_CAPI_ACCESS_TOKEN || '';
const TEST_EVENT_CODE = process.env.FACEBOOK_TEST_EVENT_CODE || '';

/**
 * SHA-256 hash a value normalized according to Meta specifications:
 * Lowercase, trimmed, UTF-8.
 */
export function hashData(val?: string): string | undefined {
  if (!val) return undefined;
  const cleaned = val.trim().toLowerCase();
  if (!cleaned) return undefined;
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

/**
 * Format Pakistani phone number to standard E.164 without leading '+' or spaces
 * Meta standard format: country code + national number (e.g., 923001234567)
 */
export function formatPhoneForMeta(phone?: string): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;

  // Pakistani local phone e.g. 03001234567 -> 923001234567
  if (digits.startsWith('03')) {
    digits = '92' + digits.slice(1);
  } else if (digits.startsWith('923')) {
    // already 92...
  }

  return hashData(digits);
}

export interface CapiEventPayload {
  eventName: string;
  eventId: string; // Crucial for deduplication with browser pixel
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
  };
  customData?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_category?: string;
    content_type?: string;
    content_ids?: string[];
    contents?: Array<{ id: string; quantity: number; item_price: number }>;
    num_items?: number;
    order_id?: string;
  };
}

/**
 * Sends a server-side event to Meta Conversions API
 */
export async function sendCapiEvent(payload: CapiEventPayload) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    // Graceful skip if credentials are not configured yet
    return {
      success: false,
      skipped: true,
      message: 'Meta Pixel ID or CAPI Access Token not configured yet.',
    };
  }

  const eventTime = Math.floor(Date.now() / 1000);

  const userDataPayload: Record<string, any> = {
    client_ip_address: payload.clientIp || undefined,
    client_user_agent: payload.userAgent || undefined,
  };

  const hashedEmail = hashData(payload.userData.email);
  if (hashedEmail) userDataPayload.em = [hashedEmail];

  const hashedPhone = formatPhoneForMeta(payload.userData.phone);
  if (hashedPhone) userDataPayload.ph = [hashedPhone];

  const hashedFirstName = hashData(payload.userData.firstName);
  if (hashedFirstName) userDataPayload.fn = [hashedFirstName];

  const hashedLastName = hashData(payload.userData.lastName);
  if (hashedLastName) userDataPayload.ln = [hashedLastName];

  const hashedCity = hashData(payload.userData.city);
  if (hashedCity) userDataPayload.ct = [hashedCity];

  const eventData: Record<string, any> = {
    event_name: payload.eventName,
    event_time: eventTime,
    event_id: payload.eventId,
    action_source: 'website',
    event_source_url: payload.sourceUrl || undefined,
    user_data: userDataPayload,
  };

  if (payload.customData) {
    eventData.custom_data = payload.customData;
  }

  const requestBody: Record<string, any> = {
    data: [eventData],
  };

  if (TEST_EVENT_CODE) {
    requestBody.test_event_code = TEST_EVENT_CODE;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    return {
      success: response.ok,
      result,
    };
  } catch (error: any) {
    console.error('[Meta CAPI Error]:', error);
    return {
      success: false,
      error: error.message || error,
    };
  }
}
