import { NextResponse } from 'next/server';
import { getAuthClient } from '../../../../../lib/google';
import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";

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
      fields: 'files(id, name)',
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    });

    return NextResponse.json({ folders: response.data.files });
  } catch (error) {
    console.error('Drive API error:', error);
    return NextResponse.json({ error: 'Failed to fetch Drive folders' }, { status: 500 });
  }
}
