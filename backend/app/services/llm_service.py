import asyncio
import random

async def generate_text_stream(prompt: str, platform: str, tone: str):
    """
    Simulates a streaming LLM response.
    In a real app, this would call OpenAI/Gemini/Mistral API with stream=True.
    """
    
    # Mock response generation based on inputs
    intro = f"Here is a {tone} {platform} post about '{prompt}':\n\n"
    yield intro
    await asyncio.sleep(0.5)
    
    body_parts = [
        "🚀 AI is revolutionizing the way we create content. ",
        "It's not just about speed, it's about unlocking creativity. ",
        "Imagine generating ideas in seconds, not hours. ",
        "The future is here, and it's automated. ",
        "Are you ready to embrace the change? ",
        "\n\n#AI #ContentCreation #FutureOfWork #Nocturnal"
    ]
    
    for part in body_parts:
        yield part
        # Simulate network delay / token generation time
        await asyncio.sleep(random.uniform(0.1, 0.3))
