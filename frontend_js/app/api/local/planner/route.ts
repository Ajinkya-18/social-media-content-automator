import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the path to your local storage file
const PLANNER_FILE = path.join(process.cwd(), 'content', 'planner.json');

// Helper to ensure directory exists
const ensureDirectoryExistence = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

export async function GET() {
  try {
    if (!fs.existsSync(PLANNER_FILE)) {
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(PLANNER_FILE, 'utf8');
    const items = JSON.parse(data);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error reading planner file:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// --- THIS WAS MISSING ---
export async function POST(req: Request) {
  try {
    const newItem = await req.json();
    
    // 1. Read existing data
    let items = [];
    if (fs.existsSync(PLANNER_FILE)) {
      const fileData = fs.readFileSync(PLANNER_FILE, 'utf8');
      try {
        items = JSON.parse(fileData);
      } catch (e) {
        items = []; // Handle corrupt file
      }
    } else {
        // Ensure folder exists if this is the first save
        ensureDirectoryExistence(PLANNER_FILE);
    }

    // 2. Add/Update logic
    // If an item with this ID exists, update it. Otherwise, append.
    const existingIndex = items.findIndex((i: any) => i.id === newItem.id);
    
    if (existingIndex > -1) {
        items[existingIndex] = newItem;
    } else {
        items.push(newItem);
    }

    // 3. Write back to disk
    fs.writeFileSync(PLANNER_FILE, JSON.stringify(items, null, 2), 'utf8');

    return NextResponse.json({ success: true, item: newItem });
    
  } catch (error) {
    console.error('Error saving to planner:', error);
    return NextResponse.json(
        { error: 'Failed to save planner item' }, 
        { status: 500 }
    );
  }
}