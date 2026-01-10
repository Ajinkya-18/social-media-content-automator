import { useGoogleLogin } from '@react-oauth/google';
import { useState, useRef } from 'react';
// Import the shared utility
import { generateAfterGlowFileName } from '../utils/fileNameGenerator';

interface UseGoogleDriveReturn {
  saveScriptToDrive: (content: string, title: string) => void;
  isSaving: boolean;
  saveSuccessLink: string | null;
  resetSaveState: () => void;
}

export const useGoogleDrive = (): UseGoogleDriveReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessLink, setSaveSuccessLink] = useState<string | null>(null);

  // Refs to hold data during the login process
  const contentRef = useRef<string>("");
  const titleRef = useRef<string>("");

  const uploadToBackend = async (token: string, content: string, title: string) => {
    setIsSaving(true);
    try {
      // 1. Generate Standard Name (Script)
      // We use 'Script' as the type and 'txt' as extension (or 'md'/'pdf' if you prefer)
      const fileName = generateAfterGlowFileName(title, 'Script', 'txt');

      // 2. Prepare Payload
      // Note: Ensure your backend '/save-script' endpoint accepts 'file_name'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/save-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          content: content,
          file_name: fileName 
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setSaveSuccessLink(data.link); // Trigger the Toast
      } else {
        throw new Error(data.detail || "Upload failed");
      }
    } catch (error) {
      console.error("Script Upload Error:", error);
      sessionStorage.removeItem('google_access_token');
      alert("Failed to save script.");
    } finally {
      setIsSaving(false);
    }
  };

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: (tokenResponse) => {
      sessionStorage.setItem('google_access_token', tokenResponse.access_token);
      uploadToBackend(tokenResponse.access_token, contentRef.current, titleRef.current);
    },
    onError: () => {
      setIsSaving(false);
      alert("Google Login Failed");
    }
  });

  const saveScriptToDrive = (content: string, title: string) => {
    if (!content) return alert("Script is empty! Generate something first.");
    
    contentRef.current = content;
    titleRef.current = title;

    const cachedToken = sessionStorage.getItem('google_access_token');
    if (cachedToken) {
      uploadToBackend(cachedToken, content, title);
    } else {
      login();
    }
  };

  const resetSaveState = () => setSaveSuccessLink(null);

  return { saveScriptToDrive, isSaving, saveSuccessLink, resetSaveState };
};