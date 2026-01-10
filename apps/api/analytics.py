import os
import datetime
from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleRequest
from dotenv import load_dotenv

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
