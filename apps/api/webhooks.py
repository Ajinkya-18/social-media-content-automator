import os
import stripe
from fastapi import APIRouter, Request, HTTPException, Header
from supabase import create_client, Client
from dotenv import load_dotenv


load_dotenv()

router = APIRouter()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, endpoint_secret
        )
    
    except ValueError as e:
        raise HTTPException(400, "Invalid payload")

    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(400, "Invalid signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        user_email = session['metadata'].get('user_email')
        plan_type = session['metadata'].get('plan_type')

        if not user_email:
            print("Webhook Error: No email in metadata")
            return {"status": "ignored"}
        
        print(f"Payment received from {user_email} for {plan_type}")

        credits_to_add = 0
        new_tier = None

        if plan_type == 'credits_100':
            credits_to_add = 100
        
        elif plan_type == 'starter':
            credits_to_add = 500
            new_tier = 'starter'
        
        elif plan_type == 'pro':
            credits_to_add = 2000
            new_tier = 'pro'

        res = supabase.table("profiles")\
            .select("credits_balance").eq("user_email", user_email)\
            .execute()
        
        current_balance = res.data[0]['credits_balance'] if res.data else 0

        update_data = {"credits_balance": current_balance + credits_to_add}

        if new_tier:
            update_data['subscription_tier'] = new_tier
        
        supabase.table("profiles").update(update_data)\
            .eq("user_email", user_email).execute()
        
        print(f"Credits updated. New Balance: {current_balance + credits_to_add}")

    return {"status": "success"}


