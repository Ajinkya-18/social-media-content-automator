# Content Automation

This project is an AI-powered content automation system featuring a **FastAPI** backend for image/content generation and a **Next.js** frontend for the user interface.

## Project Structure

- **`backend_api/`**: Python FastAPI application handling AI content generation (Gemini, Flux).
- **`frontend_js/`**: Next.js (React) application for the user dashboard.

## Getting Started

### 1. Backend Setup (Python)

Navigate to the backend directory:
```bash
cd backend_api
```

**Prerequisites:**
- Python 3.8+
- [Git](https://git-scm.com/)

**Installation:**

1.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```
2.  Activate the virtual environment:
    - **Windows:** `.\venv\Scripts\Activate`
    - **Mac/Linux:** `source venv/bin/activate`
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

**Configuration:**

Create a `.env` file in the `backend_api` directory with the following keys:
```ini
GOOGLE_API_KEY=your_gemini_api_key
HF_TOKEN=your_huggingface_token
```

**Run the Server:**
```bash
uvicorn app.main:app --reload
```
The backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup (Next.js)

Navigate to the frontend directory:
```bash
cd frontend_js
```

**Prerequisites:**
- Node.js 18+
- npm, yarn, or pnpm

**Installation:**

Install dependencies:
```bash
npm install
# or
yarn install
```

**Run the Development Server:**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Image Generation**: Supports multiple plans (Free, Standard, Pro).
    - **Free**: Uses Hugging Face (Flux).
    - **Standard**: Uses Google Gemini 2.5 Flash.
    - **Pro**: Uses Google Gemini 3 Pro.
