import { NextResponse } from 'next/server';
import { getAuthClient } from '../../../../lib/google';
import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    const auth = await getAuthClient(session.accessToken);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      pageSize: 20,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size)',
      q: "mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet'",
    });

    const files = response.data.files?.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      modified: file.modifiedTime,
      size: file.size ? parseInt(file.size) : 0,
    })) || [];

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Drive API error:', error);
    return NextResponse.json({ error: 'Failed to fetch Drive files' }, { status: 500 });
  }
}
