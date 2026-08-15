import { NextResponse } from 'next/server';
import { getPublicVapidKey } from '@/lib/web-push';

export async function GET() {
  const publicKey = getPublicVapidKey();
  return NextResponse.json({ publicKey });
}
