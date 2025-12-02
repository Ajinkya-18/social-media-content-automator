import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PLANNER_FILE = path.join(process.cwd(), 'content', 'planner.json');

// Helper to ensure file exists
const ensureFile = () => {
  const dir = path.dirname(PLANNER_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PLANNER_FILE)) {
    fs.writeFileSync(PLANNER_FILE, JSON.stringify([]), 'utf-8');
  }
};

export async function GET() {
  try {
    ensureFile();
    const data = fs.readFileSync(PLANNER_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Planner Read Error:', error);
    return NextResponse.json({ error: 'Failed to read planner' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureFile();
    const newItem = await request.json();
    
    const data = JSON.parse(fs.readFileSync(PLANNER_FILE, 'utf-8'));
    
    // If newItem is an array, replace/update multiple. If object, append.
    // For simplicity, let's assume we are sending the WHOLE updated list or a single item to append.
    // Let's support appending a single item for now, or updating if ID exists.
    
    const index = data.findIndex((item: any) => item.id === newItem.id);
    if (index >= 0) {
      data[index] = { ...data[index], ...newItem };
    } else {
      data.push(newItem);
    }

    fs.writeFileSync(PLANNER_FILE, JSON.stringify(data, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Planner Write Error:', error);
    return NextResponse.json({ error: 'Failed to save planner' }, { status: 500 });
  }
}
