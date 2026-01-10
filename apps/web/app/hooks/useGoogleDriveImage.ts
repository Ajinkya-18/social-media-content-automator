// apps/web/app/hooks/useGoogleDriveImage.ts

import { useGoogleLogin } from '@react-oauth/google';
import { useState, useRef } from 'react';
import { generateAfterGlowFileName } from '../utils/fileNameGenerator'; 

interface UseGoogleDriveImageReturn {
  saveImageToDrive: (imageData: string, currentScriptTitle: string) => void;
  isUploading: boolean;
  uploadSuccessLink: string | null; 
  resetUploadState: () => void;     
}

export const useGoogleDriveImage = (): UseGoogleDriveImageReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessLink, setUploadSuccessLink] = useState<string | null>(null);
  
  // Refs to hold data between login steps
  const imageRef = useRef<string>("");
  const titleRef = useRef<string>("");

  const uploadToBackend = async (token: string, imageData: string, title: string) => {
    setIsUploading(true);
    try {
      // 1. Generate the filename using our new utility
      const dynamicFileName = generateAfterGlowFileName(title, 'Visual', 'webp');

      // 2. Construct Payload
      const payload = {
        token: token,
        image_data: imageData,
        file_name: dynamicFileName
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/save-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.status === "success") {
        setUploadSuccessLink(data.link); // Triggers the Toast
      } else {
        throw new Error(data.detail || "Upload failed");
      }

    } catch (error) {
      console.error("Upload Error:", error);
      sessionStorage.removeItem('google_access_token');
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: (tokenResponse) => {
      sessionStorage.setItem('google_access_token', tokenResponse.access_token);
      uploadToBackend(tokenResponse.access_token, imageRef.current, titleRef.current);
    },
    onError: () => {
      alert("Google Login Failed");
      setIsUploading(false);
    }
  });

  const saveImageToDrive = (imageData: string, currentScriptTitle: string) => {
    if (!imageData) return alert("No image to save!");
    
    imageRef.current = imageData;
    titleRef.current = currentScriptTitle;
    
    const cachedToken = sessionStorage.getItem('google_access_token');

    if (cachedToken) {
       uploadToBackend(cachedToken, imageData, currentScriptTitle);
    } else {
       login();
    }
  };

  const resetUploadState = () => setUploadSuccessLink(null);

  return { saveImageToDrive, isUploading, uploadSuccessLink, resetUploadState };
};