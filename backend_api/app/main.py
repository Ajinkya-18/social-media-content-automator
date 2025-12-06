from fastapi import FastAPI, HTTPException, Header, Depends, Security
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.llm_engine import generate_script_stream
from app.services.image_engine import generate_image
from fastapi.responses import StreamingResponse
import os

app = FastAPI(title="Nocturnal Brain")

# Security
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if os.environ.get("backend_api_key"): # Only check if set
        if api_key_header == os.environ.get("backend_api_key"):
            return api_key_header
        else:
            raise HTTPException(status_code=403, detail="Could not validate credentials")
    return api_key_header

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    topic: str
    platform: str
    tone: str
    plan:str = "free"

class ImageRequest(BaseModel):
    prompt: str
    aspect_ratio:str = "1:1"
    plan:str = "free"

@app.get("/health")
def health_check():
    return {"status": "operational", "system": "Nocturnal AI"}

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
        print(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail="image generation failed. Please try again.")

