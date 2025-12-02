from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.llm_service import generate_text_stream
from app.services.image_service import generate_image
from app.core.config import settings

router = APIRouter()

# --- Dependencies ---
async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return x_api_key

# --- Models ---
class TextGenerationRequest(BaseModel):
    prompt: str
    platform: str
    tone: str

class ImageGenerationRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "1:1"

# --- Routes ---

@router.post("/generate/text")
async def generate_text(request: TextGenerationRequest, api_key: str = Depends(verify_api_key)):
    """
    Streams generated text token-by-token.
    """
    return StreamingResponse(
        generate_text_stream(request.prompt, request.platform, request.tone),
        media_type="text/event-stream"
    )

@router.post("/generate/image")
async def generate_image_route(request: ImageGenerationRequest, api_key: str = Depends(verify_api_key)):
    """
    Generates an image and returns the URL.
    """
    image_url = generate_image(request.prompt, request.aspect_ratio)
    return {"url": image_url}
