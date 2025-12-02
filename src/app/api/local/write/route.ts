import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { filename, content, directory } = await request.json();

    if (!filename || !content) {
      return NextResponse.json({ error: 'Filename and content are required' }, { status: 400 });
    }

    // Default to 'content' directory if not specified
    const targetDir = directory 
      ? path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory)
      : path.join(process.cwd(), 'content');
    
    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Sanitize filename but allow spaces and common characters
    const safeFilename = filename.replace(/[^a-z0-9\.\-_\s\(\)]/gi, '_');
    const filePath = path.join(targetDir, safeFilename);

    fs.writeFileSync(filePath, content, 'utf-8');

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Write file error:', error);
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}
