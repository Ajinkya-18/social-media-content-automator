import React, { useState, useEffect } from 'react';
import { Folder, FileText, HardDrive, Cloud, Table } from 'lucide-react';
import { useAppStore } from '../lib/store';
import ContentCalendar from './ContentCalendar';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string; // For Google Drive files
}

export default function Planner() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Content Calendar</h1>
      </div>
      <ContentCalendar />
    </div>
  );
}
