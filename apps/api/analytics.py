import os
import datetime
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
        scopes=["https://www.googleapis.com/auth/yt-analytics.readonly"]
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

        youtube_analytics = build('youtubeAnalytics', 'v2', credentials=creds)

        end_date = datetime.date.today().strftime('%Y-%m-%d')
        start_date = (datetime.date.today() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')

        report = youtube_analytics.reports().query(
            ids='channel==MINE',
            startDate=start_date,
            endDate=end_date,
            metrics='views,likes',
            dimensions='day',
            sort='day'
        ).execute()


        chart_data = []

        if 'rows' in report and report['rows']:
            for row in report['rows']:
                date_obj = datetime.datetime.strptime(row[0], '%Y-%m-%d')
                day_name = date_obj.strftime('%a')
                total_engagement = row[1] + row[2]

                chart_data.append({
                    "name": day_name,
                    "engagement": total_engagement,
                    "views": row[1],
                    "likes": row[2]
                })
            
            return {"status": "success", "data": chart_data}

    except Exception as e:
        print(f"Analytics Error: {e}")
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
        uploads_id = channels_res["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

        videos_res = youtube.playlistItems().list(
            part="snippet",
            playlistId=uploads_id,
            maxResults=10
        ).execute()

        video_ids = [item['snippet']['resourceId']['videoId'] for item in videos_res['items']]

        stats_res = youtube.videos().list(
            part="statistics",
            id=','.join(video_ids)
        ).execute()

        data_points = []

        for i, item in enumerate(videos_res['items']):
            vid_id = item['snippet']['resourceId']['videoId']
            title = item['snippet']['title']
            thumb_url = item['snippet']['thumbnails'].get('high', item['snippet']['thumbnails']['default'])['url']

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

        return{
            "status": "success",
            "analysis": {
                "best_performing_color": data_points[0]['color'],
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