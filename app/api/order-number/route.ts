import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    { error: 'Order number API disabled. Using local order numbers.' },
    { status: 410 }
  );
}
