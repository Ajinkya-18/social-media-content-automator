import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const contentDir = path.join(process.cwd(), 'content');
    
    // Ensure directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir);
    }

    const files = fs.readdirSync(contentDir).map(file => {
      const stats = fs.statSync(path.join(contentDir, file));
      return {
        id: file, // Use filename as ID for local files
        name: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      };
    });

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
