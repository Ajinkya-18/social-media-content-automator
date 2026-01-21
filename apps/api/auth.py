import os
from google.oauth2.credentials import Credentials
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from supabase import create_client, Client
from dotenv import load_dotenv
import base64
import requests
import secrets
import hashlib
from pydantic import BaseModel
import io
import time
from googleapiclient.http import MediaIoBaseUpload
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import razorpay
from supabase import Client, create_client


os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

load_dotenv()

router = APIRouter()


razorpay_client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))

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

LINKEDIN_SCOPES = [
    "openid", 
    "profile", 
    "email", 
    "w_member_social", 
    "w_organization_social",
    "r_organization_social",
    "r_organization_admin",  # <--- NEW: Required to list companies
    "rw_organization_admin"
    ]

def generate_pkce_pair():
    code_verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b'=').decode('utf-8')

    return code_verifier, code_challenge

def get_google_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        },
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI")

    )

def get_canva_auth_url(code_challenge):
    client_id = os.getenv("CANVA_CLIENT_ID")
    redirect_uri = os.getenv("CANVA_REDIRECT_URI")

    scope = "design:content:read design:content:write design:meta:read profile:read"

    return f"https://www.canva.com/api/oauth/authorize?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&code_challenge={code_challenge}&code_challenge_method=s256"

@router.get("/auth/youtube/login")
async def login_youtube():
    flow = get_google_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )

    return RedirectResponse(authorization_url)

@router.get("/auth/youtube/callback")
async def callback_youtube(request: Request):
    code = request.query_params.get("code")

    if not code:
        raise HTTPException(status_code=400, detail="AUthorization code missing")

    try:
        flow = get_google_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials

        user_info_service = build('oauth2', 'v2', credentials=credentials)
        user_info = user_info_service.userinfo().get().execute()

        user_email = user_info.get('email')

        if not user_email:
            raise HTTPException(status_code=400, detail="Could not retrieve user email")

        print(f"Successfully Authenticated: {user_email}")
        
        data = {
            "user_email": user_email,
            "provider": "youtube",
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
        }

        supabase.table("social_tokens").upsert(data).execute()

        frontend_url = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")
        return RedirectResponse(f"{frontend_url}/dashboard?status=connected&email={user_email}")

    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@router.get("/auth/canva/login")
async def login_canva():
    code_verifier, code_challenge = generate_pkce_pair()
    auth_url = get_canva_auth_url(code_challenge)

    response = RedirectResponse(auth_url)

    response.set_cookie(
        key='canva_code_verifier',
        value=code_verifier,
        httponly=True,
        secure=False,
        max_age=600
    )
    return response

@router.get("/auth/canva/callback")
async def callback_canva(request: Request):
    code = request.query_params.get("code")

    if not code:
        raise HTTPException(status_code=400, detail="Code missing")

    try:
        client_id = os.getenv("CANVA_CLIENT_ID")
        client_secret = os.getenv("CANVA_CLIENT_SECRET")
        redirect_uri = os.getenv("CANVA_REDIRECT_URI")

        credentials = f"{client_id}:{client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()

        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        code_verifier = request.cookies.get("canva_code_verifier")

        if not code_verifier:
            print("⚠️ Cookie missing, checking if we can proceed without PKCE (Likely fail)")
            raise HTTPException(status_code=400, detail="session expired or cookies missing")
        
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "code_verifier": code_verifier
        }

        session = requests.Session()
        retry = Retry(connect=3, backoff_factor=1)
        adapter = HTTPAdapter(max_retries=retry)
        session.mount('https://', adapter)

        print(f"Connecting to Canva API...")
        response = session.post("https://api.canva.com/rest/v1/oauth/token", headers=headers, data=data)
        tokens = response.json()

        if "access_token" not in tokens:
            print(f"❌ Canva Token Error: {tokens}")
            raise HTTPException(status_code=400, detail=f"Failed to retrieve tokens: {tokens}")

        profile_res = session.get(
            "https://api.canva.com/rest/v1/users/me/profile",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )

        profile = profile_res.json()

        canva_user_id = profile.get('team_user', {}).get('id') or profile.get('id') or 'unknown_user'

        db_data = {
            "user_email": f"canva_{canva_user_id}",
            "provider": "canva",
            "access_token": tokens['access_token'],
            "refresh_token": tokens.get('refresh_token'),
        }

        supabase.table("social_tokens").upsert(db_data).execute()
        
        frontend_url = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")
        return RedirectResponse(f"{frontend_url}/studio?status=connected&canva_id={canva_user_id}")

    except Exception as e:
        print(f"Canva Auth Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/canva/designs")
async def get_canva_designs(canva_id: str):
    try:
        response =  supabase.table("social_tokens")\
            .select("access_token, refresh_token")\
            .eq("user_email", f"canva_{canva_id}")\
            .eq("provider", "canva")\
            .execute()

        if not response.data:
            raise HTTPException(status_code=401, detail="User not connected to Canva")
        
        tokens = response.data[0]
        access_token = tokens['access_token']
        refresh_token = tokens['refresh_token']

        url = "https://api.canva.com/rest/v1/designs?sort_by=modified_descending&limit=10"

        canvas_res = requests.get(url, 
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if canvas_res.status_code == 401:
            print("Token Expired. Attempting refresh...")

            new_token = refresh_canva_token(canva_id, refresh_token)

            if new_token:
                canvas_res = requests.get(url, 
                headers={"Authorization": f"Bearer {new_token}"}
                )

            else:
                raise HTTPException(status_code=401, detail="Session expired. Please reconnect Canva.")


        if canvas_res.status_code != 200:
            return {"error": "Failed to fetch from Canva", "details": canva_res.json()}

        return canvas_res.json()


    except Exception as e:
        print(f"Design Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
def refresh_canva_token(canva_user_id: str, refresh_token: str):
    print(f"Refreshing token for {canva_user_id}...")

    client_id = os.getenv("CANVA_CLIENT_ID")
    client_secret = os.getenv("CANVA_CLIENT_SECRET")

    credentials = f"{client_id}:{client_secret}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()

    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }

    try:
        response = requests.post("https://api.canva.com/rest/v1/oauth/token", headers=headers, data=data)
        tokens = response.json()

        if "access_token" not in tokens:
            print(F"Refresh Failed: {tokens}")
            return None

        new_access_token = tokens['access_token']
        new_refresh_token = tokens.get('refresh_token', refresh_token)

        supabase.table("social_tokens").update({
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "updated_at": "now()"
        }).eq("user_email", f"canva_{canva_user_id}").eq("provider", "canva").execute()

        print("Token refreshed and saved.")
        return new_access_token

    except Exception as e:
        print(f"Refresh Logic Error: {e}")
        return None

class CreateDesignRequest(BaseModel):
    canva_id: str
    design_type: str
    title:str

@router.post("/canva/create")
async def create_canva_design(payload: CreateDesignRequest):
    try:
        response = supabase.table("social_tokens")\
            .select("access_token")\
            .eq("user_email", f"canva_{payload.canva_id}")\
            .eq("provider", "canva")\
            .execute()

        if not response.data:
            raise HTTPException(status_code=401, detail="User not connected")
        
        access_token = response.data[0]['access_token']

        api_payload = {
            "title": payload.title,
            "design_type": {}
        }

        if payload.design_type == "presentation":
            api_payload["design_type"] = {"type": "preset", "name": "presentation"}

        elif payload.design_type == "doc":
            api_payload["design_type"] = {"type": "preset", "name": "doc"}
        
        elif payload.design_type == "social":
            api_payload["design_type"] = {"type": "custom", "width": 1080, "height": 1080}

        else:
            api_payload["design_type"] = {"type": "custom", "width": 1920, "height": 1080}


        create_res = requests.post(
            "https://api.canva.com/rest/v1/designs",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json=api_payload
        )

        if create_res.status_code != 200:
            return {"error": "Failed to create design", "details": create_res.json()}

        return create_res.json()
    

    except Exception as e:
        print(f"Create Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/youtube/stats")
async def get_youtube_stats(email: str):
    try: 
        response = supabase.table("social_tokens")\
            .select("access_token, refresh_token")\
            .eq("user_email", email)\
            .eq("provider", "youtube")\
            .execute()

        if not response.data:
            raise HTTPException(status_code=401, detail="User not connected to YouTube")

        token_data = response.data[0]

        creds = Credentials(
            token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=SCOPES
        )

        youtube = build('youtube', 'v3', credentials=creds)

        request = youtube.channels().list(
            part="snippet,statistics",
            mine=True
        )

        response = request.execute()

        if not response.get("items"):
            return {"error": "No channel found"}

        channel = response["items"][0]
        stats = channel["statistics"]
        snippet = channel["snippet"]

        return {
            "channel_name": snippet["title"],
            "custom_url": snippet.get("customUrl", ""),
            "thumbnail": snippet["thumbnails"]["medium"]["url"],
            "subscribers": stats["subscriberCount"],
            "views": stats["viewCount"],
            "video_count": stats["videoCount"]
        }

    except Exception as e:
        print(f"YouTube Stats Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/youtube/videos")
async def get_youtube_videos(email: str):
    try:
        response = supabase.table("social_tokens")\
            .select("access_token, refresh_token")\
            .eq("user_email", email)\
            .eq("provider", "youtube")\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="User not connected to YouTube")

        token_data = response.data[0]
        creds = Credentials(
            token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=SCOPES
        )

        youtube = build('youtube', 'v3', credentials=creds)

        channel_res = youtube.channels().list(part="contentDetails", mine=True).execute()

        if not channel_res.get("items"):
            return []

        uploads_playlist_id = channel_res["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

        videos_res = youtube.playlistItems().list(
            part="snippet,status",
            playlistId=uploads_playlist_id,
            maxResults=5        
        ).execute()

        videos = []

        for item in videos_res.get("items", []):
            snippet = item["snippet"]
            videos.append({
                "id": snippet["resourceId"]["videoId"],
                "title": snippet["title"],
                "thumbnail": snippet["thumbnails"].get("medium", snippet["thumbnails"].get("default"))["url"],
                "published_at": snippet["publishedAt"],
                "status": item["status"]["privacyStatus"]
            })

        return videos
    
    except Exception as e:
        print(f"YouTube Videos Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ThumbnailRequest(BaseModel):
    video_id: str
    canva_design_id: str
    youtube_email: str
    canva_user_id: str

@router.post("/bridge/thumbnail")
async def update_thumbnail(payload: ThumbnailRequest):
    print(f"Starting Bridge: Design {payload.canva_design_id} -> Video {payload.video_id}")

    try:
        c_res = supabase.table("social_tokens").select("access_token")\
            .eq("user_email", f"canva_{payload.canva_user_id}")\
            .execute()

        if not c_res.data:
            raise HTTPException(401, "Canva not connected")

        canva_token = c_res.data[0]['access_token']

        y_res = supabase.table("social_tokens").select("access_token, refresh_token")\
            .eq("user_email", payload.youtube_email).execute()

        if not y_res.data: 
            raise HTTPException(401, "YouTube not connected")
        
        yt_data = y_res.data[0]

        print("Requesting Export from Canva...")

        export_url = "https://api.canva.com/rest/v1/exports"
        export_payload = {
            "design_id": payload.canva_design_id,
            "format": {"type": "jpg", "quality": 100}
        }

        headers = {"Authorization": f"Bearer {canva_token}", "Content-Type": "application/json"}

        init_req = requests.post(export_url, json=export_payload, headers=headers)

        if init_req.status_code != 200:
            return {"error": "Canva Export Failed", "details": init_req.json()}

        job_id = init_req.json()['job']['id']

        download_url = None

        for _ in range(10):
            time.sleep(1)
            status_req = requests.get(f"{export_url}/{job_id}", headers=headers)
            job = status_req.json()['job']
        
            if job['status'] == 'success':
                download_url = job['urls'][0]
                break

            elif job['status'] == 'failed':
                raise HTTPException(500, f"Canva rendering failed: {job.get('error')}")

        if not download_url:
            raise HTTPException(408, "Canva export timed out")

        print("Downloading rendered image...")
        img_response = requests.get(download_url)
        img_bytes = io.BytesIO(img_response.content)

        print("Uploading to YouTube...")

        creds = Credentials(
            token=yt_data['access_token'],
            refresh_token=yt_data['refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=SCOPES
        )

        youtube = build('youtube', 'v3', credentials=creds)

        request = youtube.thumbnails().set(
            videoId=payload.video_id,
            media_body=MediaIoBaseUpload(img_bytes, mimetype='image/jpeg')
        )
        request.execute()

        print("Success! Thumbnail Updated.")
        return {"status": "success", "message": "Thumbnail updated successfully"}

    except Exception as e:
        print(f"Bridge Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class CalendarEvent(BaseModel):
    email: str
    title: str
    description: str
    date: str   # Format YYYY-MM-DD

@router.get("/calendar/events")
async def get_calendar_events(email: str):
    try: 
        response = supabase.table("social_tokens").select("access_token, refresh_token")\
            .eq("user_email", email).execute()

        if not response.data: 
            raise HTTPException(401, "User not connected")
        
        token_data = response.data[0]

        creds = Credentials(
            token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=SCOPES
        )

        service = build('calendar', 'v3', credentials=creds)

        now = datetime.utcnow()
        time_min = (now - timedelta(days=30)).isoformat() + 'Z'
        time_max = (now + timedelta(days=90)).isoformat() + 'Z'

        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            q="AfterGlow",
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        return events_result.get('items', [])

    except Exception as e:
        print(f"Calendar Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calendar/create")
async def create_calendar_event(payload: CalendarEvent):
    try:
        response = supabase.table("social_tokens").select("access_token, refresh_token")\
            .eq("user_email", payload.email).execute()

        if not response.data:
            raise HTTPException(401, "User not connected")
        
        token_data = response.data[0]

        creds = Credentials(
            token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=SCOPES
        )

        service = build('calendar', 'v3', credentials=creds)

        event = {
            'summary': payload.title,
            'description': f"{payload.description}\n\n[Created via AfterGlow]",
            'start': {
                'date': payload.date,
                'timeZone': 'UTC',
            },
            'end': {
                'date': payload.date,
                'timeZone': 'UTC',
            },
        }

        event = service.events().insert(calendarId='primary', body=event).execute()

        return event

    except Exception as e:
        print(f"Calendar Create Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class CheckoutRequest(BaseModel):
    email: str
    plan_type: str

@router.post("/stripe/create-checkout-session")
async def create_checkout_session(payload: CheckoutRequest):
    try:
        res = supabase.table("profiles").select("*")\
            .eq("user_email", payload.email).execute()

        customer_id = None
        if res.data:
            customer_id = res.data[0].get('stripe_customer_id')

        if not customer_id:
            customer = stripe.Customer.create(email=payload.email)
            customer_id = customer.id

            supabase.table("profiles").upsert({
                "user_email": payload.email,
                "stripe_customer_id": customer_id
            }, on_conflict="user_email").execute()

        prices = {
            "starter": "price_1Qr...",  # $15/mo Recurring
            "pro": "price_1Qr...",      # $40/mo Recurring
            "credits_100": "price_1Qr..." # $5 One-time
        }

        selected_price = prices.get(payload.plan_type)
        if not selected_price:
            raise HTTPException(400, "Invalid plan type")
        
        mode = "subscription" if payload.plan_type in ['starter', 'pro'] else "payment"

        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': selected_price,
                'quantity': 1,
            }],
            mode=mode,
            success_url=f"{os.getenv('FRONTEND_URL')}/dashboard?payment=success",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/pricing?payment=cancelled",
            metadata={
                "user_email": payload.email,
                "plan_type": payload.plan_type
            }
        )

        return {"url": checkout_session.url}

    except Exception as e:
        print(f"Stripe Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/credits")
async def get_user_credits(email: str):
    try:
        res = supabase.table("profiles")\
            .select("credits_balance, subscription_tier")\
            .eq("user_email", email).execute()

        if res.data:
            return res.data[0]

        else:
            new_profile = {"user_email": email, "credits_balance": 50, "subscription_tier": "free"}
            supabase.table("profiles").insert(new_profile).execute()

            return new_profile

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class OrderRequest(BaseModel):
    email: str
    plan_type: str

@router.post("/razorpay/create-order")
async def create_razorpay_order(payload: OrderRequest):
    try:
        prices = {
            "starter": 99900, # In Paisa: Rs.999 -> P99900  # 250 credits
            "pro": 249900, # In Paisa: Rs.2499 -> P249900 # 500 credits
            "credits_100": 49900 # In Paisa: Rs.499 -> P49900
        }

        amount = prices.get(payload.plan_type)

        if not amount:
            raise HTTPException(400, "Invalid plan type")

        data = {
            "amount": amount,
            "currency": "INR",
            "receipt": payload.email,
            "notes": {
                "plan_type": payload.plan_type,
                "user_email": payload.email
            }
        }

        order = razorpay_client.order.create(data=data)

        supabase.table("profiles").upsert({
            "user_email": payload.email,
        }, on_conflict="user_email").execute()

        return order
    
    except Exception as e:
        print(f"Razorpay Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/credits")
async def get_user_credits(email:str):
    try:
        res = supabase.table("profiles")\
            .select("credits_balance, subscription_tier")\
            .eq("user_email", email).execute()

        if res.data:
            return res.data[0]

        else:
            new_profile = {"user_email": email, "credits_balance": 50, "subscription_tier": "free"}
            supabase.table("profiles")\
                .insert(new_profile).execute()
            
            return new_profile
        
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/auth/instagram/login")
async def login_instagram():
    client_id = os.getenv("INSTAGRAM_CLIENT_ID")
    redirect_uri = os.getenv("INSTAGRAM_REDIRECT_URI")

    state = secrets.token_urlsafe(16)

    scope = "pages_show_list,instagram_manage_insights,instagram_basic,instagram_content_publish"

    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"state={state}&"
        f"scope={scope}"
        f"response_type=code"
    )
    
    return RedirectResponse(auth_url)

@router.get("/auth/instagram/callback")
async def callback_instagram(request: Request):
    error = request.query_params.get("error")

    if error:
        print(f"Auth Error: {error}")
        return RedirectResponse(f"{os.getenv('FRONTEND_URL')}/dashboard?error=instagram_auth_denied")
    
    code = request.query_params.get("code")

    if not code:
        raise HTTPException(400, "Authorization code missing")

    try:
        client_id = os.getenv("INSTAGRAM_CLIENT_ID")
        client_secret = os.getenv("INSTAGRAM_CLIENT_SECRET")
        redirect_uri = os.getenv("INSTAGRAM_REDIRECT_URI")

        token_url = (
            f"https://graph.facebook.com/v18.0/oauth/access_token?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"client_secret={client_secret}&"
            f"code={code}"
        )

        token_res = requests.get(token_url).json()

        if "access_token" not in token_res:
            raise HTTPException(400, f"Token exchange failed: {token_res}")
        
        access_token = token_res["access_token"]

        pages_url = f"https://graph.facebook.com/v18.0/me/accounts?access_token={access_token}"
        pages_res = requests.get(pages_url).json()

        ig_user_id = None

        if "data" in pages_res:
            for page in pages_res["data"]:
                page_id = page["id"]
                ig_req = requests.get(
                    f"https://graph.facebook.com/v18.0/{page_id}?fields=instagram_business_account&access_token={access_token}"
                ).json()

                if "instagram_business_account" in ig_req:
                    ig_user_id = ig_req["instagram_business_account"]["id"]
                    break

        if not ig_user_id:
            return RedirectResponse(
                f"{os.getenv('FRONTEND_URL')}/dashboard?error=no_instagram_business_account"
            )

        db_data = {
            "user_email": f"instagram_{ig_user_id}",
            "provider": "instagram",
            "access_token": access_token,
            "refresh_token": None,
            "updated_at": "now()"
        }

        supabase.table("social_tokens").upsert(db_data).execute()

        return RedirectResponse(
            f"{os.getenv('FRONTEND_URL')}/dashboard?status=connected&instagram_id={ig_user_id}"
        )


    except Exception as e:
        print(f"Instagram Auth Error: {e}")
        raise HTTPException(500, str(e))

class UpdateEventStatusRequest(BaseModel):
    email: str
    event_id: str
    status: str

@router.post("/calendar/mark-complete")
async def mark_calendar_event_complete(payload: UpdateEventStatusRequest):
    try:
        response = supabase.table("social_tokens")\
            .select("access_token, refresh_token")\
            .eq("user_email", payload.email).execute()

        if not response.data:
            raise HTTPException(401, "User not connected")

        token_data = response.data[0]

        creds = Credentials(
            token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=SCOPES
        )

        service = build('calendar', 'v3', credentials=creds)

        event = service.events().get(calendarId='primary', eventId=payload.event_id).execute()

        current_desc = event.get('description', '')

        changes = {}

        if payload.status == 'done':
            if "[COMPLETED]" not in current_desc:
                changes['description'] = f"{current_desc}\n\n[COMPLETED]"

            changes['colorId'] = '10'

        else:
            changes['description'] = current_desc.replace("\n\n[COMPLETED]", "").replace("[COMPLETED]", "")

            changes['colorId'] = None

        updated_event = service.events().patch(
            calendarId='primary',
            eventId=payload.event_id,
            body=changes
        ).execute()

        return {"status": "success", "event": updated_event}

    except Exception as e:
        print(f"Calendar Update Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/linkedin/login")
async def login_linkedin():
    client_id = os.getenv("LINKEDIN_CLIENT_ID")
    redirect_uri = os.getenv("LINKEDIN_REDIRECT_URI")
    state = secrets.token_urlsafe(16)

    scope_string = "%20".join(LINKEDIN_SCOPES)

    auth_url = (
        f"https://www.linkedin.com/oauth/v2/authorization?"
        f"response_type=code&"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"state={state}&"
        f"scope={scope_string}"
    )

    return RedirectResponse(auth_url)

@router.get("/auth/linkedin/callback")
async def callback_linkedin(request: Request):
    code = request.query_params.get("code")

    if not code:
        raise HTTPException(400, "Authorization code missing")

    try:
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": os.getenv("LINKEDIN_REDIRECT_URI"),
            "client_id": os.getenv("LINKEDIN_CLIENT_ID"),
            "client_secret": os.getenv("LINKEDIN_CLIENT_SECRET")
        }

        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        token_res = requests.post(token_url, data=data, headers=headers).json()

        access_token = token_res.get("access_token")

        if not access_token:
            raise HTTPException(400, f"Failed to retrieve LinkedIn token: {token_res}")

        profile_res = requests.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        ).json()

        linkedin_urn = profile_res.get("sub")
        # email = profile_res.get("email")

        db_data = {
            "user_email": f"linkedin_{linkedin_urn}", # Unique ID for this provider
            "provider": "linkedin",
            "access_token": access_token,
            "refresh_token": token_res.get("refresh_token"), 
            "updated_at": "now()"
        }

        supabase.table("social_tokens").upsert(db_data).execute()

        frontend_url = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")

        return RedirectResponse(
            f"{frontend_url}/dashboard?status=connected&provider=linkedin&linkedin_id={linkedin_urn}"
        )

    except Exception as e:
        print(f"LinkedIn Auth Error: {e}")
        raise HTTPException(500, str(e))

