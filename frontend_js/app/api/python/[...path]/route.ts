import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable static optimization

const API_URL = process.env.NODE_ENV === "development"
  ? "http://127.0.0.1:8000"
  : "https://social-media-content-automator.onrender.com";

async function proxyRequest(request: Request, params: { path: string[] }) {
  try {
    const { path } = params;
    const endpoint = path.join('/');
    const url = `${API_URL}/${endpoint}`;
    const searchParams = new URL(request.url).search;
    const finalUrl = `${url}${searchParams}`; // Append query params for GET

    // Prepare options
    const options: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      // Body is not allowed for GET/HEAD
      body: (request.method !== 'GET' && request.method !== 'HEAD') ? await request.text() : undefined,
    };

    // Headers
    if (process.env.BACKEND_API_KEY) {
      (options.headers as any)['X-API-Key'] = process.env.BACKEND_API_KEY;
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        (options.headers as any)['Authorization'] = authHeader;
    }
    const contentType = request.headers.get('content-type');
    if (contentType) {
        (options.headers as any)['Content-Type'] = contentType;
    }

    const res = await fetch(finalUrl, options);

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

export async function POST(request: Request, props: { params: Promise<{ path: string[] }> }) {
  const { params } = props;
  return proxyRequest(request, await params);
}

export async function GET(request: Request, props: { params: Promise<{ path: string[] }> }) {
  const { params } = props;
  return proxyRequest(request, await params);
}

export async function PUT(request: Request, props: { params: Promise<{ path: string[] }> }) {
  const { params } = props;
  return proxyRequest(request, await params);
}

export async function DELETE(request: Request, props: { params: Promise<{ path: string[] }> }) {
  const { params } = props;
  return proxyRequest(request, await params);
}
