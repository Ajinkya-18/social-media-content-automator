import sys
import json
import os
import google.generativeai as genai

def get_gemini_model():
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables.")
    genai.configure(api_key=api_key)
    # Using gemini-1.5-flash as the latest stable Flash model
    return genai.GenerativeModel('gemini-2.5-flash')

def generate_text(topic, tone, platform):
    prompt = f"""
    You are a professional content creator. Write a {platform} post about "{topic}".
    Tone: {tone}.
    
    If it's for YouTube, write a script with timecodes.
    If it's for Instagram, include a caption and visual description.
    If it's for LinkedIn, make it professional and insightful.
    
    Output ONLY the content, no conversational filler.
    """
    
    try:
        model = get_gemini_model()
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating text: {str(e)}. Please check your GOOGLE_API_KEY."

def generate_image(prompt):
    try:
        model = get_gemini_model()
        # Generating a detailed image prompt for now
        response = model.generate_content(f"Generate a detailed prompt for an AI image generator based on this concept: {prompt}")
        return response.text
    except Exception as e:
        return f"Error generating image prompt: {str(e)}"

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        request = json.loads(input_data)
        
        mode = request.get('mode', 'text') # 'text' or 'image'
        topic = request.get('topic', '')
        tone = request.get('tone', 'professional')
        platform = request.get('platform', 'linkedin')
        
        result = {}
        
        if mode == 'text':
            content = generate_text(topic, tone, platform)
            result = {"content": content}
        elif mode == 'image':
            # For image, we treat 'topic' as the image prompt
            image_description = generate_image(topic)
            result = {"content": image_description, "type": "image_prompt"}
            
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
