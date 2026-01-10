'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateImage(prompt: string, aspectRatio: string) {
  try {
    console.log("🎨 Starting Generation for:", prompt);

    const output = await replicate.run(
      "black-forest-labs/flux-schnell", 
      {
        input: {
          prompt: prompt,
          aspect_ratio: aspectRatio,
          go_fast: true,
          megapixels: "1",
          output_format: "webp" // explicit format helps
        }
      }
    );

    console.log("✅ Replicate Output received");

    // The output is an array. The first item is the image stream.
    const imageStream = (output as any)[0];

    // Helper to convert Web Stream to Node Buffer
    const streamToBuffer = async (stream: ReadableStream) => {
      const reader = stream.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      // Combine chunks into a single buffer
      const buffer =  Buffer.concat(chunks);
      return buffer;
    };

    // Convert Stream -> Buffer -> Base64
    const imageBuffer = await streamToBuffer(imageStream);
    const base64Image = imageBuffer.toString('base64');
    
    // Construct the Data URI (Browser can display this directly)
    const dataUrl = `data:image/webp;base64,${base64Image}`;

    return { success: true, imageUrl: dataUrl };

  } catch (error) {
    console.error("❌ Image Gen Error:", error);
    return { success: false, error: "Failed to generate image" };
  }
}