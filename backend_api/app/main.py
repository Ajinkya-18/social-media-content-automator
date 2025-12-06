from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.llm_engine import generate_script_stream
from app.services.image_engine import generate_image
from fastapi.responses import StreamingResponse

app = FastAPI(title="Nocturnal Brain")

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
async def generate_text_endpoint(req: TextRequest):
    return StreamingResponse(
        generate_script_stream(req.topic, req.platform, req.tone, req.plan),
        media_type="text/event-stream"
    )

@app.post("/generate/image")
async def generate_image_endpoint(req: ImageRequest):
    try:
        image_url = await generate_image(req.prompt, req.aspect_ratio, req.plan)
        return {"url": image_url}
    
    except Exception as e:
        print(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail="image generation failed. Please try again.")

