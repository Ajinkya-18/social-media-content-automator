import { NextResponse } from 'next/server';

export async function GET() {
  // Return an empty array for now as we don't have a real local planner yet
  return NextResponse.json([]);
}
