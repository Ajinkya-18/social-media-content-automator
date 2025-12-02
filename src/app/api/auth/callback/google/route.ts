import { NextResponse } from 'next/server';
import { getAuthClient, saveToken } from '@/lib/google';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const oAuth2Client = await getAuthClient();
    await saveToken(oAuth2Client, code);
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error saving token:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
