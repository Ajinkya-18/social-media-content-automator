import { NextResponse } from 'next/server';
import { getAuthClient } from '../../../../../lib/google';
import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageBase64, filename, folderId } = await request.json();

    if (!imageBase64) {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // @ts-ignore
    const auth = await getAuthClient(session.accessToken);
    const drive = google.drive({ version: 'v3', auth });

    // Decode Base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const stream = Readable.from(buffer);

    const fileMetadata: any = {
      name: filename || `generated-image-${Date.now()}.png`,
      // parents: folderId ? [folderId] : [], // Error if parent not set?
    };
    
    if (folderId) {
        fileMetadata.parents = [folderId];
    }

    const media = {
      mimeType: 'image/png',
      body: stream,
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
    console.error('Image Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
  }
}
