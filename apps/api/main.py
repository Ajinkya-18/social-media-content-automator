from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from docx import Document
import io
import os
from groq import Groq
from dotenv import load_dotenv
import base64
import re
from auth import router as auth_router
from analytics import router as analytics_router
from webhooks import router as webhooks_router
from video import router as video_router
import json


load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")

client = Groq(
    api_key=groq_api_key,
)

app = FastAPI(title="AfterGlow - Studio")

origins = [
    "http://localhost:3000",  # Localhost testing
    "http://127.0.0.1:3000",  # Localhost testing (alternative)
    "https://social-media-content-automator.vercel.app",  # <--- YOUR VERCEL DOMAIN
    # Add any custom domains if you have them
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(webhooks_router)
app.include_router(video_router)

@app.get("/")
def read_root():
    return {"status": "AfterGlow API is running"}

class DriveScriptRequest(BaseModel):
    token: str
    content: str
    file_name: str = "AfterGlow_Script.docx"

class GenerateRequest(BaseModel):
    prompt: str
    tone: str = "professional"


@app.post("/api/generate-script")
async def generate_script(req: GenerateRequest):
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional scriptwriter. Generate a clear, formatted script based on the user's request."
                },
                {
                    "role": "user",
                    "content": f"Write a script for: {req.prompt}. Keep the tone {req.tone}.",
                }
            ],
            model="llama-3.3-70b-versatile",
        )

        generated_text = chat_completion.choices[0].message.content

        return {"script": generated_text}
        

    except Exception as e:
        print(f"Groq Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")
        
@app.post("/save-script")
async def save_script(request: DriveScriptRequest):
    try:
        file_stream = io.BytesIO(request.content.encode('utf-8'))
        
        creds = Credentials(token=request.token)
        service = build('drive', 'v3', credentials=creds)

        file_metadata = {
            'name': request.file_name,
            'mimeType': 'application/vnd.google-apps.document'
        }

        media = MediaIoBaseUpload(
            file_stream,
            mimetype='application/vnd.google-apps.document',
            resumable=True
        )

        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()

        return {
            "status": "success",
            "file_id": file.get('id'),
            "link": file.get('webViewLink')
        }

    except Exception as e:
        print(f"Error uploading to Drive: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class DriveImageRequest(BaseModel):
    token: str
    image_data: str
    file_name: str = "AfterGlow_Visual.webp"

def sanitize_filename(name:str) -> str:
    # Keep only alphanumeric, dashes, underscores, and spaces
    name = re.sub(r'[^\w\s-]', '', name)
    # Replace spaces with underscores for cleaner URLs
    name = re.sub(r'\s+', "_", name)

    return name

@app.post("/save-image")
async def save_image(request: DriveImageRequest):
    try:
        safe_name = sanitize_filename(request.file_name)

        if not safe_name.endswith('.webp'):
            safe_name += ".webp"


        if "base64," in request.image_data:
            header, encoded = request.image_data.split("base64,", 1)
        
        else:
            encoded = request.image_data

        image_bytes = base64.b64decode(encoded)
        file_stream = io.BytesIO(image_bytes)

        creds = Credentials(token=request.token)
        service = build('drive', 'v3', credentials=creds)

        file_metadata = {
            'name': safe_name,
            'mimeType': 'image/webp'
        }

        media = MediaIoBaseUpload(
            file_stream,
            mimetype='image/webp',
            resumable=True
        )

        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()

        return {
            "status": "success",
            "file_id": file.get('id'),
            "link": file.get('webViewLink')
        }

    except Exception as e:
        print(f"Image Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_def():
    return {
        "status": "active",
        "system": "Studio - FlowState v1.0",
        "motto": "Our creativity awakens when the world sleeps."
    }

class RepurposeRequest(BaseModel):
    script: str
    tone: str = "engaging"

@app.post("/api/repurpose")
async def repurpose_content(req: RepurposeRequest):
    try:
        system_prompt = """
        You are an expert Social Media Manager. 
        Analyze the provided video script and repurpose it into three distinct formats.
        
        Output MUST be valid JSON with the following structure:
        {
            "twitter": "A thread of 3-5 tweets. Separate tweets with double newlines.",
            "linkedin": "A professional, storytelling-style post with bullet points.",
            "instagram": "A catchy caption with emojis and 5-7 hashtags."
        }
        Do not add any text outside the JSON object.
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Script: {req.script}\n\nTone: {req.tone}",
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )

        content = chat_completion.choices[0].message.content

        parsed_content = json.loads(content)
        
        return parsed_content

    except Exception as e:
        print(f"Repurposer Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Processing Failed: {str(e)}")


