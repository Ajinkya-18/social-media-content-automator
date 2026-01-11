import os
import replicate
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv


load_dotenv()

router = APIRouter()

supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

VIDEO_COST = 10

class VideoRequest(BaseModel):
    email: str
    prompt: str

@router.post("/video/generate")
async def generate_video(payload: VideoRequest):
    try: 
        res = supabase.table("profiles").select("*")\
            .eq("user_email", payload.email).execute()

        if not res.data:
            raise HTTPException(404, "user not found. Please visit Pricing page to initialize.")

        profile = res.data[0]
        credits = profile["credits_balance"]
        tier = profile["subscription_tier"]

        if credits < VIDEO_COST:
            raise HTTPException(402, "Insufficient credits. Please top up.")

        num_frames = 48 if tier == 'pro' else 24

        print(f"Generating video for {payload.email} ({tier} tier)...")

        output = replicate.run(
            "cerspense/zeroscope_v2_576w:9f747673056b9c949518d5ebb7e891eb23395c819e3fe00805181e4b5340f16f",
            input={
                "prompt": payload.prompt,
                "num_frames": num_frames,
                "width": 576,
                "height": 320,
                "fps": 24
            }
        )

        video_url = output[0] if isinstance(output, list) else output

        new_balance = credits - VIDEO_COST

        supabase.table("profiles").update({"credits_balance": new_balance})\
            .eq("user_email", payload.email).execute()

        return {
            "video_url": video_url,
            "credits_remaining": new_balance,
            "message": "Video generation successful"
        }

    except replicate.exceptions.ReplicateError as e:
        print(f"Replicate Error: {e}")
        raise HTTPException(502, "AI Service Error. Credits were not deducted.")

    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(500, str(e))



