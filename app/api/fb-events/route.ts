// app/api/fb-events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendCapiEvent } from '@/lib/facebookCapi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.eventName || !body.eventId) {
      return NextResponse.json(
        { error: 'Missing required fields (eventName, eventId)' },
        { status: 400 }
      );
    }

    // Extract client IP address for accurate Meta event matching
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';

    // Extract _fbp and _fbc cookies from payload or request cookies for deduplication
    const fbp = body.userData?.fbp || req.cookies.get('_fbp')?.value;
    const fbc = body.userData?.fbc || req.cookies.get('_fbc')?.value;

    const result = await sendCapiEvent({
      eventName: body.eventName,
      eventId: body.eventId,
      testEventCode: body.testEventCode,
      sourceUrl: body.sourceUrl || referer,
      clientIp,
      userAgent,
      userData: {
        ...(body.userData || {}),
        fbp,
        fbc,
      },
      customData: body.customData || {},
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in /api/fb-events handler:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Diagnostic GET endpoint to verify Meta CAPI credentials and configuration
 */
export async function GET() {
  const pixelId =
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    '';
  const hasToken = Boolean(process.env.FACEBOOK_CAPI_ACCESS_TOKEN);
  const testEventCode = process.env.FACEBOOK_TEST_EVENT_CODE || '';

  return NextResponse.json({
    status: 'ok',
    configured: Boolean(pixelId && hasToken),
    pixelIdConfigured: Boolean(pixelId),
    pixelIdMasked: pixelId ? `${pixelId.slice(0, 4)}...${pixelId.slice(-4)}` : null,
    accessTokenConfigured: hasToken,
    testEventCodeConfigured: Boolean(testEventCode),
    diagnostic: hasToken
      ? 'Meta Conversions API is configured and ready to send server events.'
      : 'ACTION REQUIRED: FACEBOOK_CAPI_ACCESS_TOKEN is missing in Vercel environment variables. Server events cannot be sent until this token is added.',
  });
}
