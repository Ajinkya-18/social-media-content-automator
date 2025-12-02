import random
import time

def generate_image(prompt: str, aspect_ratio: str):
    """
    Simulates Stable Diffusion image generation.
    Returns a dummy signed URL or base64 string.
    """
    # Simulate processing time
    time.sleep(1)
    
    # In a real app, this would call the SD pipeline
    # For now, return a placeholder image URL
    
    width, height = 1024, 1024
    if aspect_ratio == "16:9":
        width, height = 1920, 1080
    elif aspect_ratio == "9:16":
        width, height = 1080, 1920
        
    # Using a reliable placeholder service
    return f"https://picsum.photos/{width}/{height}?random={random.randint(1, 1000)}"
