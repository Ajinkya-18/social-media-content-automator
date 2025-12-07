import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable static optimization

const API_URL = process.env.NODE_ENV === "development"
  ? "http://127.0.0.1:8000"
  : "https://social-media-content-automator.onrender.com";

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const endpoint = path.join('/');
    const url = `${API_URL}/${endpoint}`;

    const body = await request.json();
    
    // Inject API Key from server-side env
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.BACKEND_API_KEY) {
      headers['X-API-Key'] = process.env.BACKEND_API_KEY;
    }

    // Forward Authorization Header (Critical for Google Drive)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    // Proxy the response back (supports streams)
    return new NextResponse(res.body, {
        status: res.status,
        headers: {
            'Content-Type': res.headers.get('Content-Type') || 'application/json',
        }
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
  }
}
