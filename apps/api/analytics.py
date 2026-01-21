import os
import datetime
from datetime import timedelta
import io
import requests
from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleRequest
from dotenv import load_dotenv
from PIL import Image
from collections import Counter
from auth import SCOPES
from auth import LINKEDIN_SCOPES

load_dotenv()

router = APIRouter()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def get_refreshed_credentials(token_data):
    creds = Credentials(
        token=token_data['access_token'],
        refresh_token=token_data['refresh_token'],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES
    )

    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())

        supabase.table("social_tokens").update({
            "access_token": creds.token
        }).eq("user_email", token_data['user_email']).execute()

    return creds

@router.get("/api/analytics/youtube")
async def get_youtube_stats(email:str):
    try:
        response = supabase.table("social_tokens").select("*").eq("user_email", email).eq("provider", "youtube").execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="User not connected to YouTube")

        token_data = response.data[0]

        creds = get_refreshed_credentials(token_data)

        yt_data = build('youtube', 'v3', credentials=creds)
        youtube_analytics = build('youtubeAnalytics', 'v2', credentials=creds)

        channel_res = yt_data.channels().list(mine=True, part="snippet,statistics").execute()

        if not channel_res.get("items"):
            raise HTTPException(404, "No channel found")

        stats_lifetime = channel_res["items"][0]["statistics"]
        channel_title = channel_res["items"][0]["snippet"]["title"]

        end_date = datetime.date.today().strftime('%Y-%m-%d')
        start_date = (datetime.date.today() - timedelta(days=30)).strftime('%Y-%m-%d')

        report = youtube_analytics.reports().query(
            ids='channel==MINE',
            startDate=start_date,
            endDate=end_date,
            metrics='views,estimatedMinutesWatched,likes,subscribersGained',
            dimensions='day',
            sort='day'
        ).execute()

        rows = report.get("rows", [])

        period_views = sum(r[1] for r in rows)
        period_minutes = sum(r[2] for r in rows)
        period_likes = sum(r[3] for r in rows)

        graph_data = [{"date": r[0], "views": r[1], "likes": r[3]} for r in rows]

        return {
            "status": "success",
            "channel_name": channel_title,
            "overview": {
                "views": period_views,
                "watch_time_hours": int(period_minutes / 60),
                "likes": period_likes,
                "total_subs": stats_lifetime.get("subscriberCount"),
                "total_views": stats_lifetime.get("viewCount")
            },
            "graph_data": graph_data
        }

    except Exception as e:
        print(f"YT Analytics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/analytics/linkedin")
async def get_linkedin_analytics(linkedin_id: str, company_urn: str = None):
    try:
        res = supabase.table("social_tokens").select("access_token")\
            .eq("user_email", f"linkedin_{linkedin_id}").execute()

        if not res.data:
            return {"connected": False}

        token = res.data[0]['access_token']

        headers = {
            "Authorization": f"Bearer {token}",
            "X-Restli-Protocol-Version": "2.0.0"
        }

        if not company_urn:
            user_info = requests.get("https://api.linkedin.com/v2/userinfo", headers=headers).json()

            return {
                "connected": True,
                "profile": {
                    "name": f"{user_info.get('given_name')} {user_info.get('family_name')}",
                    "picture": user_info.get("picture")
                },
                "message": "select a company to view stats"
            }
        
        encoded_urn = company_urn.replace(":", "%3A")
        url = f"https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity={encoded_urn}"

        stats_res = requests.get(url, headers=headers)

        if stats_res.status_code != 200:
            print(f"LI Stats Error: {stats_res.text}")
            return {"connected": True, "error": "Could not fetch stats. Ensure you are a Page Admin."}

        data = stats_res.json()

        total_impressions = 0
        total_engagements = 0
        total_clicks = 0
        total_likes = 0

        elements = data.get("elements", [])

        for el in elements:
            total = el.get("totalShareStatistics", {})
            total_impressions += total.get("impressionCount", 0)
            total_clicks += total.get("clickCount", 0)
            total_likes += total.get("likeCount", 0)
            total_engagements += (total.get("shareCount", 0) + total.get("likeCount", 0) + total.get("clickCount", 0))

        return {
            "connected": True,
            "company_urn": company_urn,
            "overview": {
                "impressions": total_impressions,
                "engagements": total_engagements,
                "clicks": total_clicks,
                "likes": total_likes
            }
        }
    
    except Exception as e:
        print(f"LinkedIn Analytics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_dominant_color(image_url):
    try:
        response = requests.get(image_url)
        img = Image.open(io.BytesIO(response.content))
        img = img.resize((50, 50))
        img = img.convert('RGB')

        pixels = list(img.getdata())
        filtered_pixels = [p for p in pixels if not (p[0] < 30 and p[1] < 30 and p[2] < 30) and not (p[0] > 220 and p[1] > 220 and p[2] > 220)]

        if not filtered_pixels:
            filtered_pixels = pixels

        most_common = Counter(filtered_pixels).most_common(1)[0][0]

        return "#{:02x}{:02x}{:02x}".format(most_common[0], most_common[1], most_common[2])

    except:
        return "#000000"
    
@router.get("/api/analytics/intelligence")
async def get_analytics_intelligence(email: str):
    try: 
        response = supabase.table("social_tokens").select("*")\
            .eq("user_email", email).eq("provider", "youtube").execute()

        if not response.data:
            raise HTTPException(404, "YouTube not connected")

        creds = get_refreshed_credentials(response.data[0])
        youtube = build('youtube', 'v3', credentials=creds)

        channels_res = youtube.channels().list(part="contentDetails", mine=True).execute()

        if not channels_res.get("items"):
            raise HTTPException(404, "No channel found")

        uploads_id = channels_res["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

        videos_res = youtube.playlistItems().list(
            part="snippet",
            playlistId=uploads_id,
            maxResults=10
        ).execute()

        if not videos_res.get("items"):
            return {
                "status": "success", 
                "analysis": {
                    "best_performing_color": "#000000",
                    "data": []
                }
            }

        video_ids = [item['snippet']['resourceId']['videoId'] for item in videos_res['items']]

        stats_res = youtube.videos().list(
            part="statistics",
            id=','.join(video_ids)
        ).execute()

        data_points = []

        for i, item in enumerate(videos_res['items']):
            vid_id = item['snippet']['resourceId']['videoId']
            title = item['snippet']['title']
            thumb_dict = item['snippet']['thumbnails']
            thumb_url = thumb_dict.get('high', thumb_dict.get('medium', thumb_dict.get('default', {}))).get('url', '')
            
            stats = next((s for s in stats_res['items'] if s['id'] == vid_id), None)
            views = int(stats['statistics'].get('viewCount', 0)) if stats else 0

            dominant_color = get_dominant_color(thumb_url)

            data_points.append({
                "title": title,
                "views": views,
                "color": dominant_color,
                "thumbnail": thumb_url
            })

        data_points.sort(key=lambda x: x['views'], reverse=True)

        best_color = data_points[0]['color'] if data_points else "#000000"

        return{
            "status": "success",
            "analysis": {
                "best_performing_color": best_color,
                "data": data_points
            }
        }
    
    except Exception as e:
        print(f"Intelligence Error: {e}")

        return {
            "status": "mock",
            "analysis": {
                "best_performing_color": "#ff0000",
                "data": [
                    {"title": "Demo Video 1", "views": 5000, "color": "#FF5733", "thumbnail": ""},
                    {"title": "Demo Video 2", "views": 1200, "color": "#33FF57", "thumbnail": ""}
                ]
            }
        }

@router.get("/api/analytics/instagram")
async def get_instagram_analytics(instagram_id: str):
    try:
        response = supabase.table("social_tokens").select("access_token").eq("user_email", f"instagram_{instagram_id}").execute()

        if not response.data:
            raise HTTPException(401, "Instagram not connected")
        
        access_token = response.data[0]['access_token']

        url = f"https://graph.facebook.com/v18.0/{instagram_id}?fields=username,followers_count,media_count,profile_picture_url&access_token={access_token}"

        res = requests.get(url).json()

        if "error" in res: 
            raise HTTPException(400, res["error"]["message"])
        
        return {
            "username": res.get("username", "Unknown"),
            "followers": res.get("followers_count", 0),
            "posts": res.get("media_count", 0),
            "profile_pic": res.get("profile_picture_url", ""),
            "status": "active"
        }
    
    except Exception as e:
        print(f"IG Stats Error: {e}")
        raise HTTPException(500, str(e))
    

