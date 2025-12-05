import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthClient } from '../../../../../lib/google';

export async function POST(request: Request) {
  try {
    const { item } = await request.json();
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Find or Create "Nocturnal Content Planner" spreadsheet
    let spreadsheetId;
    const fileList = await drive.files.list({
      q: "name = 'Nocturnal Content Planner' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
      fields: 'files(id, name)',
    });

    if (fileList.data.files && fileList.data.files.length > 0) {
      spreadsheetId = fileList.data.files[0].id;
    } else {
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title: 'Nocturnal Content Planner' },
          sheets: [{ properties: { title: 'Planner' } }]
        },
      });
      spreadsheetId = spreadsheet.data.spreadsheetId;
      
      if (!spreadsheetId) {
        throw new Error('Failed to retrieve spreadsheet ID');
      }

      // Add headers
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Planner!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['ID', 'Date', 'Platform', 'Topic', 'Prompt', 'Status']]
        }
      });
    }

    if (!spreadsheetId) {
        throw new Error('Failed to retrieve spreadsheet ID');
    }

    // 2. Append the new item
    // We want to check if the ID already exists to update it, but for simplicity in this MVP, 
    // we will just append new rows. A real sync is complex.
    // Let's just append.
    
    const values = [
      [item.id, item.date, item.platform, item.topic, item.prompt, item.status]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Planner!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    return NextResponse.json({ success: true, spreadsheetId });
  } catch (error) {
    console.error('Sheets Write Error:', error);
    return NextResponse.json({ error: 'Failed to write to Google Sheets' }, { status: 500 });
  }
}
