import os
import asyncio
from typing import AsyncGenerator
from google import genai
from huggingface_hub import AsyncInferenceClient
from dotenv import load_dotenv

load_dotenv()

google_client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
hf_client = AsyncInferenceClient(token=os.environ.get("HF_TOKEN"))

async def generate_script_stream(topic: str, platform:str, tone:str, plan:str) -> AsyncGenerator[str, None]:
    """
    Routes the request to the appropriate LLM based on user plan.
    """

    system_prompt = f"""You are an expert social media strategist for {platform}. 
    Topic: {topic}
    Tone: {tone}
    Task: Write a high-performing script/caption. 
    Rules: 
    - Be engaging and concise.
    - Use appropriate hashtags.
    - Format for readability.
    """

    try:
        if plan == "free":
            model_id = "meta-llama/Llama-3.1-8B-Instruct"

            messages = [
                {"role": "system", "content": f"You are a helpful assistant for {platform} content creation."},
                {"role": "user", "content": f"{system_prompt}"} 
            ]

            stream = await hf_client.chat_completion(
                model=model_id,
                messages=messages,
                max_tokens=500,
                stream=True
            )

            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
            
        elif plan == "standard":
            response = google_client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=system_prompt
            )

            for chunk in response:
                if chunk.text:
                    yield chunk.text

        elif plan == "pro":
            response = google_client.models.generate_content_stream(
                model="gemini-3-pro-preview",
                contents=system_prompt
            )

            for chunk in response:
                if chunk.text:
                    yield chunk.text

        else:
            yield "Error: Invalid plan seelcted."

    except Exception as e:
        yield f"Error generating content: {str(e)}"