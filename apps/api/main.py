from fastapi import FastAPI, HTTPException, UploadFile, File
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
from auth import router as auth_router, SCOPES
from analytics import router as analytics_router
from webhooks import router as webhooks_router
from video import router as video_router
import json
import replicate
from supabase import create_client, Client
from vault import router as vault_router
import time
from huggingface_hub import InferenceClient
from auth import LINKEDIN_SCOPES
from google import genai
from google.genai import types
import requests


load_dotenv()

google_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

CREDIT_COSTS = {
    "script": 10,
    "repurpose": 5,
    "image": 15,
    "video": 20
}

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

SCOPES = [
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.file",
    "openid"
]

groq_api_key = os.getenv("GROQ_API_KEY")

groq_client = Groq(
    api_key=groq_api_key,
)

hf_client = InferenceClient(
    provider="auto",
    api_key=os.getenv("HF_TOKEN"),
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
app.include_router(vault_router)

@app.get("/")
def read_root():
    return {"status": "AfterGlow API is running"}

class DriveScriptRequest(BaseModel):
    email: str
    content: str
    file_name: str = "AfterGlow_Script.docx"

class GenerateScriptRequest(BaseModel):
    email: str
    prompt: str
    tone: str = "professional"

@app.post("/api/generate-script")
async def generate_script(req: GenerateScriptRequest):
    try:
        tier = await process_credits(req.email, CREDIT_COSTS["script"])

        model_name = "llama-3.1-8b-instant"

        if tier == "standard": model_name = "llama-3.3-70b-versatile"
        if tier == "pro": model_name = "gemini-3-flash-preview"

        content = ""
        print(f"Generating script using {model_name} for {tier} user...")

        if "gemini" in model_name:
            response = google_client.models.generate_content(
                model=model_name,
                contents={'text': f"You are a pro scriptwriter. Write a script for: {req.prompt}. Tone: {req.tone}."},
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    top_p=0.95,
                    top_k=40,
                )
            )

            content = response.text

        else:
            chat = groq_client.chat.completions.create(
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
                model=model_name,
            )

            content = chat.choices[0].message.content

        if req.email:
            supabase.table("assets").insert({
                "user_email": req.email,
                "asset_type": "script",
                "content": content,
                "metadata": {"model": model_name, "cost": CREDIT_COSTS["script"]}
            }).execute()

        return {"script": content}

    except HTTPException as he:
        raise he

    except Exception as e:
        # Refund on failure (Optional but recommended)
        # For simplicity, we skip refund logic here, but in prod you should add it.
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")
        
@app.post("/save-script")
async def save_script(request: DriveScriptRequest):
    try:
        creds = get_google_creds(request.email)

        service = build('drive', 'v3', credentials=creds)

        safe_name = sanitize_filename(request.file_name)

        if not safe_name.endswith('.docx'):
            safe_name += ".docx"

        file_stream = io.BytesIO(request.content.encode('utf-8'))

        file_metadata = {
            'name': safe_name,
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
    email: str
    image_data: str
    file_name: str = "AfterGlow_Visual.webp"

def sanitize_filename(name:str) -> str:
    # Keep only alphanumeric, dashes, underscores, and spaces
    name = re.sub(r'[^\w\s-]', '', name)
    # Replace spaces with underscores for cleaner URLs
    name = re.sub(r'\s+', "_", name)

    return name

def get_google_creds(email:str):
    response = supabase.table("social_tokens")\
        .select("access_token, refresh_token")\
            .eq("user_email", email).execute()

    if not response.data:
        raise HTTPException(401, "Google account not connected. Please connect Youtube in dashboard.")

    token_data = response.data[0]

    return Credentials(
        token=token_data['access_token'],
        refresh_token=token_data['refresh_token'],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES
    )

@app.post("/save-image")
async def save_image(request: DriveImageRequest):
    try:
        creds = get_google_creds(email=request.email)
        service = build('drive', 'v3', credentials=creds)

        safe_name = sanitize_filename(request.file_name)

        if not safe_name.endswith('.webp'):
            safe_name += ".webp"

        if "base64," in request.image_data:
            header, encoded = request.image_data.split("base64,", 1)
        
        else:
            encoded = request.image_data

        image_bytes = base64.b64decode(encoded)
        file_stream = io.BytesIO(image_bytes)

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
    email: str
    script: str
    tone: str = "engaging"

@app.post("/api/repurpose")
async def repurpose_content(req: RepurposeRequest):
    try:
        tier = await process_credits(req.email, CREDIT_COSTS["repurpose"])

        model_name = "llama-3.1-8b-instant"

        if tier == "standard": 
            model_name = "llama-3.3-70b-versatile"

        if tier == "pro": 
            model_name = "gemini-3-flash-preview"
        
        content = ""
        system_prompt = "You are an expert Social Media Manager. Return JSON only: {\"twitter\": \"...\", \"linkedin\": \"...\", \"instagram\": \"...\"}"

        if "gemini" in model_name:
            response = google_client.models.generate_content(
                model=model_name,
                contents={'text': f"{system_prompt}\n\nTask: Repurpose this script:\n{req.script}\n\nTone: {req.tone}"},
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
            content = response.text

        else:
            chat = groq_client.chat.completions.create(
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
                model=model_name,
                response_format={"type": "json_object"}
            )

            content = chat.choices[0].message.content

        parsed = json.loads(content)

        if req.email:
            supabase.table("assets").insert({
                "user_email": req.email,
                "asset_type": "social_mix",
                "content": content,
                "metadata": {"source_length": len(req.script), "tone": req.tone}
            }).execute()
        
        return parsed

    except HTTPException as he:
        raise he

    except Exception as e:
        print(f"Repurposer Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Processing Failed: {str(e)}")

@app.post("/api/parse-document")
async def parse_document(file:UploadFile=File(...)):
    try:
        content = ""
        filename = file.filename.lower()

        file_bytes = await file.read()
        file_stream = io.BytesIO(file_bytes)

        if filename.endswith('.docx'):
            doc = Document(file_stream)

            content = "\n\n".join([para.text for para in doc.paragraphs if para.text.strip()])

        elif filename.endswith('.txt') or filename.endswith('.md'):
            content = file_bytes.decode('utf-8')

        else:
            raise HTTPException(400, "Unsupported file format. Please upload .docx, .txt, or .md file type.")

        if not content.strip():
            raise HTTPException(400, "The document appears to be empty.")
        
        return {"status": "success", "content": content}

    except Exception as e:
        print(f"Parse Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")

class ImageRequest(BaseModel):
    email: str
    prompt: str
    aspect_ratio: str = "16:9"

@app.post("/api/generate-image")
async def generate_image(payload: ImageRequest):
    try:
        tier = await process_credits(payload.email, CREDIT_COSTS["image"])

        # 2. Select Model
        # Free: Flux Schnell (HF)
        # Standard: Playground v2.5 (HF) - Better artistic control
        # Pro: Stable Diffusion 3.5 Large (HF) - Top tier
        
        if tier == "pro":
            print(f"Generating image via Google Imagen 3 for {tier} user...")
            model_id = "imagen-4.0-generate-001"

            response = google_client.models.generate_images(
                model=model_id,
                prompt=payload.prompt,
                config=types.GenerateImagesConfig(
                    aspect_ratio=payload.aspect_ratio,
                    number_of_images=1,
                    image_size="2K"
                )
            )

            img_bytes = response.generated_images[0].image.image_bytes

        else:
            model_id = "black-forest-labs/flux.1-schnell"

            if tier == "standard": 
                model_id = "stabilityai/stable-diffusion-xl-base-1.0"

            print(f"Generating image via {model_id} for {tier} user...")

            width, height = 1024, 576
            if payload.aspect_ratio == "1:1": width, height = 1024, 1024
            if payload.aspect_ratio == "9:16": width, height = 576, 1024

            image = hf_client.text_to_image(
                payload.prompt,
                model=model_id,
                width=width,
                height=height
            )

            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format="PNG")
            img_bytes = img_byte_arr.getvalue()

        safe_email = re.sub(r'[^a-zA-Z0-9]', '_', payload.email)
        filename = f"{safe_email}_{int(time.time())}.png"
        bucket_name = "generated_images"

        print(f"Uploading {filename} to Supabase Storage...")

        supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=img_bytes,
            file_options={"content-type": "image/png"}
        )

        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)

        if payload.email:
            supabase.table("assets").insert({
                "user_email": payload.email,
                "asset_type": "image",
                "content": public_url,
                "metadata": {
                    "prompt": payload.prompt,
                    "aspect_ratio": payload.aspect_ratio,
                    "model": model_id,
                    "filename": filename
                }
            }).execute()

        return {"imageUrl": public_url}

    except HTTPException as he:
        raise he
    
    except Exception as e:
        print(f"Image Gen Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class NicheRequest(BaseModel):
    email: str
    niche: str

class IdeaRequest(BaseModel):
    email: str

@app.post("/api/trends/set-niche")
async def set_niche(req: NicheRequest):
    try:
        supabase.table("profiles").update({"niche": req.niche})\
            .eq("user_email", req.email).execute()
        
        return {"status": "success", "niche": req.niche}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trends/generate")
async def generate_trends(req: IdeaRequest):
    try:
        res = supabase.table("profiles").select("niche")\
            .eq("user_email", req.email).execute()

        if not res.data:
            raise HTTPException(404, "User profile not found.")

        niche = res.data[0]['niche'] or "General Content"

        system_prompt = f"""
        You are a Viral Content Strategist. Generate 3 trending video ideas for the niche: '{niche}'.
        
        Return ONLY valid JSON in this format:
        [
          {{
            "title": "Hooky Video Title",
            "angle": "Why this works (1 sentence)",
            "type": "Educational" | "Entertainment" | "Story"
          }}
        ]
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Give me 3 viral ideas now."}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )

        content = chat_completion.choices[0].message.content

        try:
            parsed = json.loads(content)

            if isinstance(parsed, dict) and "ideas" in parsed:
                return parsed["ideas"]
            
            if isinstance(parsed, dict):
                return list(parsed.values())[0]
            
            return parsed

        except:
            return []

    except Exception as e:
        print(f"Trend Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class LinkedInPostRequest(BaseModel):
    linkedin_id: str
    author_urn: str
    text: str

@app.post("/api/linkedin/post")
async def post_to_linkedin(payload: LinkedInPostRequest):
    try:
        res = supabase.table("social_tokens").select("access_token")\
            .eq("user_email", f"linkedin_{payload.linkedin_id}")\
                .execute()
            
        if not res.data:
            raise HTTPException(401, "LinkedIn not connected")
        
        token = res.data[0]['access_token']

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }

        target_urn = payload.author_urn if payload.author_urn else f"urn:li:person:{payload.linkedin_id}"

        post_data = {
            "author": target_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": payload.text
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        response = requests.post(
            "https://api.linkedin.com/v2/ugcPosts",
            headers=headers,
            json=post_data
        )

        if response.status_code != 201:
            raise HTTPException(400, f"LinkedIn Error: {response.text}")

        return {"status": "success", "post_id": response.json().get("id")}

    except Exception as e:
        print(f"Posting Error: {e}")
        raise HTTPException(500, str(e))

@app.get("/api/linkedin/companies")
async def get_linkedin_companies(linkedin_id: str):
    try:
        res = supabase.table("social_tokens").select("access_token")\
            .eq("user_email", f"linkedin_{linkedin_id}").execute()

        if not res.data:
            raise HTTPException(401, "LinkedIn not connected")

        token = res.data[0]['access_token']

        url_list = "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED"

        headers = {
            "Authorization": f"Bearer {token}",
            "X-Restli-Protocol-Version": "2.0.0"
        }

        response = requests.get(url_list, headers=headers)

        if response.status_code != 200:
            return {
                "companies": []
            }

        data = response.json()
        companies = []

        for item in data.get('elements', []):
            org_urn = item.get('organizationalTarget')
            org_id = org_urn.split(":")[-1]

            try:
                org_url = f"https://api.linkedin.com/v2/organizations/{org_id}"
                org_res = requests.get(org_url, headers=headers)

                if org_res.status_code == 200:
                    org_data = org_res.json()

                    name = org_data.get("localizedName", f"Company {org_id}")
                    companies.append({"id": org_urn, "name": name})
                else:
                    companies.append({"id": org_urn, "name": f"Company {org_id} (No Access)"})
            
            except Exception as e:
                print(f"Failed to fetch name for {org_id}: {e}")
                companies.append({"id": org_urn, "name": f"Company {org_id}"})

        return {"companies": companies}

    except Exception as e:
        print(f"Company Fetch Error: {e}")

        return {"companies": []}

async def process_credits(email: str, cost: int):
    res = supabase.table("profiles").select("credits_balance, subscription_tier")\
        .eq("user_email", email).execute()

    if not res.data:
        supabase.table("profiles").insert({"user_email": email, "credits_balance": 50, "subscription_tier": "free"}).execute()
        return "free"

    profile = res.data[0]

    if profile['credits_balance'] < cost:
        raise HTTPException(402, detail=f"Insufficient credits. Need {cost}, have {profile['credits_balance']}.")

    new_balance = profile['credits_balance'] - cost
    supabase.table("profiles").update({"credits_balance": new_balance})\
        .eq("user_email", email).execute()

    return profile['subscription_tier']

