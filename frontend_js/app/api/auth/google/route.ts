import { NextResponse } from 'next/server';
import { getAuthClient, getAuthUrl } from '../../../../lib/google';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const oAuth2Client = await getAuthClient();
    
    // Check if we already have a token
    const TOKEN_PATH = path.join(process.cwd(), 'token.json');
    if (fs.existsSync(TOKEN_PATH)) {
      return NextResponse.json({ authenticated: true });
    }

    const authUrl = getAuthUrl(oAuth2Client);
    return NextResponse.json({ authenticated: false, authUrl });
  } catch (error) {
    console.error('Auth check failed:', error);
    return NextResponse.json({ error: 'Failed to check auth status' }, { status: 500 });
  }
}
