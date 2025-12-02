import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, tone, platform, mode = 'text' } = body;

    // Input Validation
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required and must be a string' }, { status: 400 });
    }
    
    if (mode === 'text' && (!platform || typeof platform !== 'string')) {
      return NextResponse.json({ error: 'Platform is required for text generation' }, { status: 400 });
    }

    if (topic.length > 500) {
      return NextResponse.json({ error: 'Topic is too long (max 500 chars)' }, { status: 400 });
    }

    // Path to the Python executable in the virtual environment
    const pythonPath = 'A:\\AI-Projects\\nocturnal-projects\\.venv_noctai\\Scripts\\python.exe';
    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'generate_content.py');

    const pythonProcess = spawn(pythonPath, [scriptPath]);

    let dataString = '';
    let errorString = '';

    // Send data to Python script via stdin
    pythonProcess.stdin.write(JSON.stringify({ mode, topic, tone, platform }));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    return new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorString);
          resolve(NextResponse.json({ error: 'Generation failed', details: errorString }, { status: 500 }));
        } else {
          try {
            const result = JSON.parse(dataString);
            if (result.error) {
              resolve(NextResponse.json({ error: result.error }, { status: 500 }));
            } else {
              // If image mode, convert the refined prompt to a Pollinations URL
              if (mode === 'image' && result.content) {
                const encodedPrompt = encodeURIComponent(result.content);
                const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;
                resolve(NextResponse.json({ content: imageUrl }));
              } else {
                resolve(NextResponse.json({ content: result.content }));
              }
            }
          } catch (e) {
            console.error('JSON parse error:', e);
            resolve(NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 }));
          }
        }
      });
    });

  } catch (error) {
    console.error('API Route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
