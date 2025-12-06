import React, { useState, useEffect } from 'react';
import { Plus, Save, Calendar, Loader } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '../lib/store';
import GoogleDrivePicker from './GoogleDrivePicker';

interface PlanItem {
  id: string;
  topic: string;
  platform: 'instagram' | 'linkedin' | 'youtube';
  prompt: string;
  status: 'planned' | 'generated' | 'posted';
  date: string;
}

export default function ContentCalendar() {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [pendingSaveItem, setPendingSaveItem] = useState<PlanItem | null>(null);

  const { googleSheetsEnabled } = useAppStore();
  const { data: session } = useSession();

  useEffect(() => {
    fetchPlanner();
  }, []);

  const fetchPlanner = async () => {
    try {
      const res = await fetch('/api/local/planner');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to load planner', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem: PlanItem = {
      id: Date.now().toString(),
      topic: '',
      platform: 'instagram',
      prompt: '',
      status: 'planned',
      date: new Date().toISOString().split('T')[0],
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof PlanItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = async (item: PlanItem) => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    
    try {
      // Save Locally
      await fetch('/api/local/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      // Google Sheets Logic: Open Picker instead of auto-saving
      if (googleSheetsEnabled) {
          setPendingSaveItem(item);
          setIsDrivePickerOpen(true);
      } else {
          // Just local save success if Sheets disabled
          setSaveSuccess('Saved to local planner');
          setTimeout(() => setSaveSuccess(null), 3000);
      }
      
    } catch (error) {
      console.error('Failed to save to local planner', error);
      setSaveError('Failed to save locally');
    } finally {
      setSaving(false);
    }
  };

  const handleDriveSelect = async (sheetId: string, sheetName: string) => {
    setIsDrivePickerOpen(false);
    if (!pendingSaveItem) return;

    try {
        setSaveSuccess('Saving to Sheets...'); 
        const token = (session as any)?.accessToken;
        
        const rowData = [
            pendingSaveItem.date,
            pendingSaveItem.platform,
            pendingSaveItem.topic,
            pendingSaveItem.prompt,
            pendingSaveItem.status
        ];

        const res = await fetch('/api/python/google/sheet/append', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                spreadsheetId: sheetId,
                rowData: rowData 
            }),
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || 'Failed to save to Sheets');
        }
        
        setSaveSuccess(`Saved to local & Sheets (in ${sheetName})`);
        
    } catch (err: any) {
        console.error('Sheets Save Error', err);
        setSaveError(`Saved locally, but failed to save to Google Sheets: ${err.message}`);
    } finally {
        setTimeout(() => {
            setSaveSuccess(null);
            setSaveError(null);
        }, 5000);
        setPendingSaveItem(null);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-white" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Calendar className="mr-2 text-blue-400" />
          Content Planner
        </h2>
        <button
          onClick={handleAddItem}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add New Plan
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3 bg-green-500/20 text-green-400 rounded-lg text-sm border border-green-500/30">
            {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30">
            {saveError}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-black/20 text-gray-400 uppercase font-medium">
              <tr>
                <th className="p-4 w-32">Date</th>
                <th className="p-4 w-32">Platform</th>
                <th className="p-4">Topic</th>
                <th className="p-4">Prompt / Context</th>
                <th className="p-4 w-32">Status</th>
                <th className="p-4 w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-white w-full p-0"
                    />
                  </td>
                  <td className="p-4">
                    <select
                      value={item.platform}
                      onChange={(e) => handleUpdateItem(item.id, 'platform', e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-white w-full p-0 cursor-pointer"
                    >
                      <option value="instagram" className="bg-gray-900">Instagram</option>
                      <option value="linkedin" className="bg-gray-900">LinkedIn</option>
                      <option value="youtube" className="bg-gray-900">YouTube</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={item.topic}
                      onChange={(e) => handleUpdateItem(item.id, 'topic', e.target.value)}
                      placeholder="Enter topic..."
                      className="bg-transparent border-none focus:ring-0 text-white w-full p-0 placeholder-gray-600"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={item.prompt}
                      onChange={(e) => handleUpdateItem(item.id, 'prompt', e.target.value)}
                      placeholder="Specific prompt details..."
                      className="bg-transparent border-none focus:ring-0 text-white w-full p-0 placeholder-gray-600"
                    />
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === 'generated' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'posted' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleSave(item)}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Save Item"
                    >
                      <Save size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No content planned yet. Click "Add New Plan" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Drive Picker Modal */}
      <GoogleDrivePicker
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={handleDriveSelect}
        mode="pick-sheet"
        title="Select Spreadsheet"
      />
    </div>
  );
}
