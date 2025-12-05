import os
from google import genai
from google.genai import types
import base64
import io
from dotenv import load_dotenv
from huggingface_hub import AsyncInferenceClient

load_dotenv()


google_client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
hf_client = AsyncInferenceClient(token=os.environ.get("HF_TOKEN"))


async def generate_image(prompt: str, aspect_ratio:str, plan:str) -> str:
    """
    Generates an image using Google 'Nano Banana' 
    (Gemini 2.5 Flash Image)
    """
    try:
        # ar_map = {"1:1": "1:1", "16:9": "16:9", "9:16": "9:16"}
        if plan == "free":
            model_id = "black-forest-labs/FLUX.1-schnell"
            enhanced_prompt = f"{prompt}, high quality, detailed"

            image = await hf_client.text_to_image(
                prompt=enhanced_prompt,
                model=model_id,
                height=1024,
                width=1024
            )

            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

            return f"data:image/jpeg;base64,{img_str}"

        elif plan == "standard":
            response = google_client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=[prompt],
            )

            try:
                for part in response.parts:
                    if part.text is not None:
                        print(part.text)
                    elif part.inline_data is not None:
                        img_str = base64.b64encode(part.inline_data.data).decode("utf-8")
                        return f"data:image/jpeg;base64,{img_str}"
            
            except Exception as e:
                print(f"Generation Error: {e}")
                raise e

            
        elif plan == "pro":
            response = google_client.models.generate_content(
                model="gemini-3-pro-image-preview",
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_modalities=['TEXT', 'IMAGE'],
                    image_config=types.ImageConfig(
                        aspect_ratio=aspect_ratio,
                        # image_size=resolution
                    ),
                )
            )

            try:
                for part in response.parts:
                    if part.text is not None:
                        print(part.text)
                    elif part.inline_data is not None:
                        img_str = base64.b64encode(part.inline_data.data).decode("utf-8")
                        return f"data:image/jpeg;base64,{img_str}"
            
            except Exception as e:
                print(f"Generation Error: {e}")
                raise e

        else:
            raise Exception("Invalid plan selected")
    

    except Exception as e:
        print(f"Generation Error: {e}")
        raise e



