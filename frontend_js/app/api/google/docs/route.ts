import { NextResponse } from 'next/server';
import { getAuthClient } from '../../../../lib/google';
import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    const auth = await getAuthClient(session.accessToken);
    const docs = google.docs({ version: 'v1', auth });

    const response = await docs.documents.get({
      documentId: fileId,
    });

    // Simple parser to extract text from the doc structure
    let text = '';
    response.data.body?.content?.forEach((element) => {
      if (element.paragraph) {
        element.paragraph.elements?.forEach((el) => {
          if (el.textRun) {
            text += el.textRun.content;
          }
        });
        text += '\n';
      }
    });

    return NextResponse.json({ content: text, title: response.data.title });
  } catch (error) {
    console.error('Docs API error:', error);
    return NextResponse.json({ error: 'Failed to fetch Doc content' }, { status: 500 });
  }
}
