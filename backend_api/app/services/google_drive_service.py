from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
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
        # Default to root if browsing top level
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
    }
    if folder_id:
        file_metadata['parents'] = [folder_id]
    
    if mime_type == 'application/vnd.google-apps.document':
        # Conversion case: Creating a Google Doc from text
        file_metadata['mimeType'] = mime_type
        upload_mime_type = 'text/plain'
    else:
        upload_mime_type = mime_type

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
        media = MediaIoBaseUpload(io.BytesIO(content.encode('utf-8')), mimetype=upload_mime_type)

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

    # dynamic sheet name resolution
    spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    try:
        sheet_title = spreadsheet['sheets'][0]['properties']['title']
        # Handle special characters in sheet title by quoting it if necessary, 
        # but the API handles loose matching often. Safe practice is single quotes.
        # However, the API expects 'Sheet Name'!A1
        range_name = f"'{sheet_title}'!A1"
    except (KeyError, IndexError):
        range_name = 'Sheet1!A1' # Fallback

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

async def create_drive_folder(access_token: str, name: str, parent_id: str = None):
    """
    Creates a new folder in Google Drive.
    """
    creds = get_creds(access_token)
    service = build('drive', 'v3', credentials=creds)

    file_metadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder'
    }

    if parent_id:
        file_metadata['parents'] = [parent_id]

    file = service.files().create(body=file_metadata, fields='id').execute()
    return {"id": file.get('id')}

async def read_file_from_drive(access_token: str, file_id: str):
    """
    Reads a file from Google Drive.
    If it's a Google Doc, exports it as text.
    If it's a regular file (text), downloads the content.
    If it's an image, downloads and returns base64.
    """
    creds = get_creds(access_token)
    service = build('drive', 'v3', credentials=creds)

    # First get metadata to check mimeType
    file_metadata = service.files().get(fileId=file_id, fields="mimeType, name").execute()
    mime_type = file_metadata.get('mimeType')
    name = file_metadata.get('name')

    if mime_type == 'application/vnd.google-apps.document':
        # Export Google Doc as plain text
        request = service.files().export_media(fileId=file_id, mimeType='text/plain')
        is_binary = False
    else:
        # Download regular file
        request = service.files().get_media(fileId=file_id)
        # Check if it's an image
        if mime_type and mime_type.startswith('image/'):
            is_binary = True
        else:
            is_binary = False

    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()

    file_content = fh.getvalue()
    
    if is_binary:
        # Return base64 for images
        b64_content = base64.b64encode(file_content).decode('utf-8')
        return {
            "content": b64_content, 
            "name": name, 
            "mimeType": mime_type,
            "isBinary": True
        }
    else:
        # Return text
        try:
            text_content = file_content.decode('utf-8')
        except UnicodeDecodeError:
            # Fallback for non-utf8 text or actually binary files misidentified
            text_content = str(file_content) 
            
        return {
            "content": text_content, 
            "name": name, 
            "mimeType": mime_type,
            "isBinary": False
        }

async def read_sheet_values(access_token: str, spreadsheet_id: str, range_name: str = None):
    """
    Reads values from a Google Sheet.
    If range_name is None, attempts to read the first sheet.
    """
    creds = get_creds(access_token)
    service = build('sheets', 'v4', credentials=creds)

    # If no range provided, default to 'Sheet1' or first sheet
    if not range_name:
        spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        try:
            sheet_title = spreadsheet['sheets'][0]['properties']['title']
            range_name = f"'{sheet_title}'!A:E" # Read columns A to E (Date, Platform, Topic, Prompt, Status)
        except (KeyError, IndexError):
            range_name = 'Sheet1!A:E'

    result = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id, range=range_name).execute()
    
    rows = result.get('values', [])
    return {"rows": rows}
