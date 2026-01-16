import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import Client, create_client


load_dotenv()

router = APIRouter()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

class AssetRequest(BaseModel):
    email: str
    asset_type: str
    content: str
    metadata: dict = {}

@router.post("/vault/save")
async def save_asset(payload: AssetRequest):
    try:
        data = {
            "user_email": payload.email,
            "asset_type": payload.asset_type,
            "content": payload.content,
            "metadata": payload.metadata
        }

        res = supabase.table("assets").insert(data).execute()

        return {"status": "success", "asset_id": res.data[0]['id']}

    except Exception as e:
        print(f"Vault Save Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vault/list")
async def list_assets(email: str, asset_type: str = "all"):
    try:
        query = supabase.table("assets").select("*")\
            .eq("user_email", email).order("created_at", desc=True)

        if asset_type != "all":
            query = query.eq("asset_type", asset_type)

        res = query.execute()
        
        return res.data

    except Exception as e:
        print(f"Vault Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/vault/delete")
async def delete_asset(asset_id: str):
    try:
        supabase.table("assets").delete().eq("id", asset_id).execute()
        
        return {"status": "deleted"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


