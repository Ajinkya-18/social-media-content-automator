import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthClient } from '../../../../../lib/google';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth"; 

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // @ts-ignore
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { item, folderId } = await request.json();
    // @ts-ignore
    const auth = await getAuthClient(session.accessToken);
    
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Find or Create "Nocturnal Content Planner" spreadsheet
    let spreadsheetId;
    let query = "name = 'Nocturnal Content Planner' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
    if (folderId) {
        query += ` and '${folderId}' in parents`;
    }

    const fileList = await drive.files.list({
      q: query,
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
      
      // Move to folder if specified
      if (folderId) {
          // Retrieve the existing parents to remove
          const file = await drive.files.get({
            fileId: spreadsheetId,
            fields: 'parents'
          });
          const previousParents = file.data.parents?.join(',') || '';
          
          await drive.files.update({
              fileId: spreadsheetId,
              addParents: folderId,
              removeParents: previousParents,
              fields: 'id, parents'
          });
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
    // 1.5 Ensure "Planner" sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties'
    });
    
    const sheetExists = spreadsheet.data.sheets?.some(
        s => s.properties?.title === 'Planner'
    );
    
    if (!sheetExists) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: { title: 'Planner' }
                        }
                    },
                    // Add headers to the new sheet
                    {
                        appendCells: {
                            sheetId: undefined, // Need specific ID? No, appendCells needs sheetId. 
                            // Easier to use values.append after creation.
                            // But wait, addSheet returns the properties including ID.
                            // Let's just create the sheet, then use values.append for headers.
                        }
                    }
                ]
            }
        });
        
        // Add headers separately to be safe/simple
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Planner!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [['ID', 'Date', 'Platform', 'Topic', 'Prompt', 'Status']]
            }
        });
    }

    // 2. Append the new item
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
    const fs = require('fs');
    try {
        const msg = error instanceof Error ? error.message : String(error);
        fs.appendFileSync('error.log', `${new Date().toISOString()} - Sheets Write Error: ${msg}\n`);
    } catch (e) {
        console.error('Failed to write to error log', e);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
