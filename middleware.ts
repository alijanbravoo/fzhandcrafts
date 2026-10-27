import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname !== '/admin/login') {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('fz_admin_access')?.value;
  if (cookie === '1') {
    return NextResponse.next();
  }

  const key = searchParams.get('key');
  const expected = process.env.ADMIN_ACCESS_KEY;

  if (expected && key && key === expected) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('key');

    const res = NextResponse.redirect(url);
    res.cookies.set('fz_admin_access', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/admin/login'],
};
