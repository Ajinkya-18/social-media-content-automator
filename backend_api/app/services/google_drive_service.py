from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io
import base64

def get_creds(access_token):
    """Reconstructs Google Credentials from the access token."""
    return Credentials(token=access_token)

async def list_drive_files(access_token: str, folder_id: str = None, mime_type: str = None):
    """
    Lists files/folders from Google Drive.
    """
    creds = get_creds(access_token)
    service = build('drive', 'v3', credentials=creds)

    query = "trashed = false"
    
    if folder_id:
        query += f" and '{folder_id}' in parents"
    else:
        # If no folder_id and no specific mime_type filter implying search, default to root or show shared drives?
        # Standard behavior: show root if nothing specified
        if not mime_type: 
             query += " and 'root' in parents"
    
    if mime_type == 'folder':
        query += " and mimeType = 'application/vnd.google-apps.folder'"
    elif mime_type == 'sheet':
        query += " and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.folder')" 

    results = service.files().list(
        q=query,
        pageSize=50,
        fields="nextPageToken, files(id, name, mimeType, iconLink)",
        orderBy="folder, name"
    ).execute()

    return results.get('files', [])

async def upload_file_to_drive(access_token: str, file_name: str, content: str, mime_type: str, folder_id: str):
    """
    Uploads a file (text or image) to Google Drive.
    For images, content is expected to be a base64 string.
    """
    creds = get_creds(access_token)
    service = build('drive', 'v3', credentials=creds)

    file_metadata = {
        'name': file_name,
        'parents': [folder_id]
    }

    if mime_type.startswith('image/'):
        # Decode base64 image
        # Remove header if present (e.g., "data:image/png;base64,")
        if "base64," in content:
            content = content.split("base64,")[1]
        
        try:
            file_data = base64.b64decode(content)
        except Exception as e:
            # If decoration fails, maybe it wasn't base64 or was corrupted
            raise ValueError(f"Invalid base64 content: {e}")

        media = MediaIoBaseUpload(io.BytesIO(file_data), mimetype=mime_type)
    else:
        # Text/Markdown
        media = MediaIoBaseUpload(io.BytesIO(content.encode('utf-8')), mimetype=mime_type)

    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, webViewLink'
    ).execute()

    return {"id": file.get('id'), "url": file.get('webViewLink')}

async def append_row_to_sheet(access_token: str, spreadsheet_id: str, row_data: list):
    """
    Appends a row of data to a Google Sheet.
    """
    creds = get_creds(access_token)
    service = build('sheets', 'v4', credentials=creds)

    range_name = 'Sheet1!A1' # Default to appending to the first sheet
    body = {
        'values': [row_data]
    }

    result = service.spreadsheets().values().append(
        spreadsheetId=spreadsheet_id,
        range=range_name,
        valueInputOption='USER_ENTERED',
        body=body
    ).execute()

    return {"updates": result.get('updates')}
