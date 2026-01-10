// apps/web/app/utils/fileNameGenerator.ts

export type AfterGlowFileType = 'Visual' | 'Script' | 'Audio';

export const generateAfterGlowFileName = (
  title: string, 
  type: AfterGlowFileType, 
  extension: string
): string => {
  // 1. Sanitize: Remove special chars, keep alphanumerics, replace spaces with underscores
  // Default to "Untitled" if title is missing
  const safeTitle = (title || "Untitled")
    .replace(/[^a-zA-Z0-9\s]/g, '') 
    .trim()
    .replace(/\s+/g, '_')           
    .substring(0, 30);              

  // 2. Generate Timestamp: YYYYMMDD_HHMM
  const now = new Date();
  const pad = (num: number) => num.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

  // 3. Final Output: "AfterGlow_Visual_The_Martian_20260104_1430.webp"
  return `AfterGlow_${type}_${safeTitle}_${timestamp}.${extension}`;
};