'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';
import { ArrowLeft, Loader, Calendar } from 'lucide-react';

export default function SheetViewer() {
  const { selectedFile, setCurrentView, selectedFileId } = useAppStore();
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedFileId) {
      setLoading(true);
      fetch(`/api/google/sheets?spreadsheetId=${selectedFileId}`)
        .then(res => res.json())
        .then(data => {
          setData(data.values || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [selectedFileId]);

  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p>No sheet selected.</p>
        <button 
          onClick={() => setCurrentView('planner')}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          Go to Planner
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => setCurrentView('planner')}
            className="mr-4 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{selectedFile}</h1>
            <p className="text-sm text-gray-400 flex items-center mt-1">
              <Calendar size={14} className="mr-1" />
              Content Schedule
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm relative overflow-x-auto">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                {data[0]?.map((header, index) => (
                  <th key={index} className="p-4 text-sm font-medium text-gray-300 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-white/5 transition-colors">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="p-4 text-sm text-gray-300 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
