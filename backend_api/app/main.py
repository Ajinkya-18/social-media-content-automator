from fastapi import FastAPI, HTTPException, Header, Depends, Security, Response
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from app.services.llm_engine import generate_script_stream
from app.services.image_engine import generate_image
from app.services.google_drive_service import list_drive_files, upload_file_to_drive, append_row_to_sheet, create_drive_folder
from google.auth.exceptions import RefreshError
from app.utils import create_docx, create_markdown
from fastapi.responses import StreamingResponse
import os
import aiohttp
import io

app = FastAPI(title="Nocturnal Brain")

# Security
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    env_api_key = os.environ.get("BACKEND_API_KEY")
    if env_api_key: # Only check if set
        if api_key_header == env_api_key:
            return api_key_header
        else:
            print(f"Auth Failed: Received {api_key_header[:4]}... Expected {env_api_key[:4]}...")
            raise HTTPException(status_code=403, detail="Could not validate credentials")
    return api_key_header

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---

class DriveCreateFolderRequest(BaseModel):
    name: str
    parentId: Optional[str] = None

class TextRequest(BaseModel):
    topic: str
    platform: str
    tone: str
    plan:str = "free"

class ImageRequest(BaseModel):
    prompt: str
    aspect_ratio:str = "1:1"
    plan:str = "free"

class DriveListRequest(BaseModel):
    folderId: Optional[str] = None
    mimeType: Optional[str] = None

class DriveUploadRequest(BaseModel):
    fileName: str
    content: str
    mimeType: str
    folderId: str

class SheetAppendRequest(BaseModel):
    spreadsheetId: str
    rowData: list

class DownloadScriptRequest(BaseModel):
    content: str
    format: str # "docx" or "md"
    filename: str = "script"

class DownloadImageRequest(BaseModel):
    url: str
    filename: str = "image.png"

# --- Endpoints ---

@app.on_event("startup")
async def startup_event():
    print("Startup: Checking Environment Variables...")
    keys = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GEMINI_API_KEY", "HF_TOKEN", "BACKEND_API_KEY"]
    for key in keys:
        val = os.environ.get(key)
        if val:
            masked = val[:4] + "*" * (len(val)-4) if len(val) > 4 else "****"
            print(f"{key}: {masked}")
        else:
            print(f"{key}: NOT SET")

@app.get("/health")
def health_check():
    return {"status": "operational", "system": "Nocturnal AI"}

@app.post("/google/create-folder")
async def create_folder_endpoint(req: DriveCreateFolderRequest, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or Missing Authorization header")
    
    token = authorization.split(" ")[1]
    try:
        result = await create_drive_folder(token, req.name, req.parentId)
        return result
    except RefreshError:
        raise HTTPException(status_code=401, detail="Google Token Expired")
    except Exception as e:
        print(f"Create Folder Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/text")
async def generate_text_endpoint(req: TextRequest, api_key: str = Depends(get_api_key)):
    return StreamingResponse(
        generate_script_stream(req.topic, req.platform, req.tone, req.plan),
        media_type="text/event-stream"
    )

@app.post("/generate/image")
async def generate_image_endpoint(req: ImageRequest, api_key: str = Depends(get_api_key)):
    try:
        image_url = await generate_image(req.prompt, req.aspect_ratio, req.plan)
        return {"url": image_url}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="image generation failed. Please try again.")

@app.post("/google/list")
async def list_files_endpoint(req: DriveListRequest, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or Missing Authorization header")
    
    token = authorization.split(" ")[1]
    try:
        files = await list_drive_files(token, req.folderId, req.mimeType)
        return {"files": files}
    except RefreshError:
        raise HTTPException(status_code=401, detail="Google Token Expired")
    except Exception as e:
        print(f"Drive List Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/google/upload")
async def upload_file_endpoint(req: DriveUploadRequest, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    token = authorization.split(" ")[1]
    try:
        result = await upload_file_to_drive(token, req.fileName, req.content, req.mimeType, req.folderId)
        return result
    except Exception as e:
        print(f"Drive Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/google/sheet/append")
async def append_sheet_endpoint(req: SheetAppendRequest, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    token = authorization.split(" ")[1]
    try:
        result = await append_row_to_sheet(token, req.spreadsheetId, req.rowData)
        return result
    except Exception as e:
        print(f"Sheet Append Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/download/script")
async def download_script_endpoint(req: DownloadScriptRequest):
    try:
        if req.format == "docx":
            file_stream = create_docx(req.content)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            extension = "docx"
        elif req.format == "md":
            file_stream = create_markdown(req.content)
            media_type = "text/markdown"
            extension = "md"
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'docx' or 'md'.")
        
        filename = f"{req.filename}.{extension}"
        
        # Helper to yield chunks from BytesIO
        def iterfile():
            yield file_stream.read()

        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        
        return StreamingResponse(iterfile(), media_type=media_type, headers=headers)

    except Exception as e:
        print(f"Download Script Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/download/image")
async def download_image_endpoint(req: DownloadImageRequest):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(req.url) as response:
                if response.status != 200:
                    raise HTTPException(status_code=500, detail="Failed to fetch image.")
                
                content = await response.read()
                
        return Response(content=content, media_type="image/png", headers={
            "Content-Disposition": f'attachment; filename="{req.filename}"'
        })
    except Exception as e:
        print(f"Download Image Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
