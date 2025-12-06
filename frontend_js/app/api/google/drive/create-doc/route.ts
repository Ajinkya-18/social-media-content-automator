import { NextResponse } from 'next/server';
import { getAuthClient } from '../../../../../lib/google';
import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, folderId } = await request.json();

    // @ts-ignore
    const auth = await getAuthClient(session.accessToken);
    const drive = google.drive({ version: 'v3', auth });

    // Create Metadata
    const fileMetadata: any = {
      name: title || 'Untitled Script',
      mimeType: 'application/vnd.google-apps.document',
    };

    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    // Create File
    // For Google Docs, we can't just upload "text" content in the create body easily via simple upload if we want a formatted doc.
    // However, for simple text, we can use media upload with text/plain and convert it.
    
    const media = {
      mimeType: 'text/plain',
      body: content || '',
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    return NextResponse.json({ 
        success: true, 
        fileId: file.data.id, 
        link: file.data.webViewLink 
    });

  } catch (error: any) {
    console.error('Create Doc Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Document' }, { status: 500 });
  }
}
