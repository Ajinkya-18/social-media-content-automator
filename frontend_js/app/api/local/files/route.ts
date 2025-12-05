import { NextResponse } from 'next/server';

export async function GET() {
  // Return an empty file list for now
  return NextResponse.json({ files: [] });
}
