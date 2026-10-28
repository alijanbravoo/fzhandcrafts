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

    const result = await sendCapiEvent({
      eventName: body.eventName,
      eventId: body.eventId,
      sourceUrl: body.sourceUrl || referer,
      clientIp,
      userAgent,
      userData: body.userData || {},
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
