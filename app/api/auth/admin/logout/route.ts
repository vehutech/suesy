import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin', request.url));
  
  // Clear the admin cookie
  response.cookies.delete('admin_token');
  
  return response;
}