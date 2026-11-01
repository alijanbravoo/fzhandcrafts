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
  let pixelId =
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    '';
  let hasToken = Boolean(process.env.FACEBOOK_CAPI_ACCESS_TOKEN);
  let testEventCode = process.env.FACEBOOK_TEST_EVENT_CODE || '';
  let tokenSource = hasToken ? 'environment_variable' : null;

  if (!hasToken || !pixelId) {
    try {
      const { getSettings } = await import('@/lib/firestore');
      const settings = await getSettings();
      if (!pixelId && settings.metaPixelId) pixelId = settings.metaPixelId;
      if (!hasToken && settings.metaCapiAccessToken) {
        hasToken = true;
        tokenSource = 'firestore_settings';
      }
      if (!testEventCode && settings.metaTestEventCode) testEventCode = settings.metaTestEventCode;
    } catch (e) {
      // ignore
    }
  }

  if (!pixelId) pixelId = '1145868156876626';

  return NextResponse.json({
    status: 'ok',
    configured: Boolean(pixelId && hasToken),
    pixelIdConfigured: Boolean(pixelId),
    pixelIdMasked: pixelId ? `${pixelId.slice(0, 4)}...${pixelId.slice(-4)}` : null,
    accessTokenConfigured: hasToken,
    tokenSource,
    testEventCodeConfigured: Boolean(testEventCode),
    testEventCode: testEventCode || null,
    diagnostic: hasToken
      ? `Meta Conversions API is CONFIGURED and active (via ${tokenSource}). Server events are sending to Meta Pixel ${pixelId}.`
      : 'ACTION REQUIRED: Meta CAPI Access Token is missing. You can paste it into Admin Settings (/admin/settings) or add FACEBOOK_CAPI_ACCESS_TOKEN in Vercel.',
  });
}
