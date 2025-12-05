import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', 'attachment; filename="generated-image.jpg"');
    headers.set('Content-Length', arrayBuffer.byteLength.toString());

    return new NextResponse(arrayBuffer, { headers });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch image' }, { status: 500 });
  }
}
