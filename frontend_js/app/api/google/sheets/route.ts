import { NextResponse } from 'next/server';
import { getAuthClient } from '../../../../lib/google';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spreadsheetId = searchParams.get('spreadsheetId');
  const range = searchParams.get('range') || 'Sheet1!A1:E10';

  if (!spreadsheetId) {
    return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return NextResponse.json({ values: response.data.values });
  } catch (error: any) {
    console.error('Sheets API error:', error);
    // Log error to file for debugging
    const fs = require('fs');
    fs.appendFileSync('error.log', `${new Date().toISOString()} - Sheets API Error: ${JSON.stringify(error.message || error)}\n`);
    return NextResponse.json({ error: 'Failed to fetch Sheet data' }, { status: 500 });
  }
}
