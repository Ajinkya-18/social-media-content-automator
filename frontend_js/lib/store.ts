import { create } from 'zustand';

interface AppState {
  currentView: 'dashboard' | 'planner' | 'scripts' | 'sheet' | 'generator' | 'images' | 'settings';
  setCurrentView: (view: 'dashboard' | 'planner' | 'scripts' | 'sheet' | 'generator' | 'images' | 'settings') => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;
  fileSource: 'local' | 'google';
  setFileSource: (source: 'local' | 'google') => void;
  selectedFileId: string | null;
  setSelectedFileId: (id: string | null) => void;
  // Google Service Toggles
  googleDriveEnabled: boolean;
  googleSheetsEnabled: boolean;
  googleDocsEnabled: boolean;
  toggleGoogleService: (service: 'drive' | 'sheets' | 'docs') => void;
  setGoogleService: (service: 'drive' | 'sheets' | 'docs', enabled: boolean) => void;
  // Social Profiles
  socialProfiles: {
    twitter: string;
    linkedin: string;
    instagram: string;
    youtube: string;
  };
  setSocialProfile: (platform: 'twitter' | 'linkedin' | 'instagram' | 'youtube', url: string) => void;
  // Drive Settings
  driveSettings: {
    plannerId: string | null;
    plannerName: string | null;
    scriptsId: string | null;
    scriptsName: string | null;
    imagesId: string | null;
    imagesName: string | null;
  };
  setDriveSetting: (
    type: 'planner' | 'scripts' | 'images', 
    id: string | null, 
    name: string | null
  ) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),
  fileSource: 'local',
  setFileSource: (source) => set({ fileSource: source }),
  selectedFileId: null,
  setSelectedFileId: (id) => set({ selectedFileId: id }),
  // Default to true
  googleDriveEnabled: true,
  googleSheetsEnabled: true,
  googleDocsEnabled: true,
  toggleGoogleService: (service) => set((state) => {
    if (service === 'drive') return { googleDriveEnabled: !state.googleDriveEnabled };
    if (service === 'sheets') return { googleSheetsEnabled: !state.googleSheetsEnabled };
    if (service === 'docs') return { googleDocsEnabled: !state.googleDocsEnabled };
    return state;
  }),
  setGoogleService: (service, enabled) => set((state) => {
    if (service === 'drive') return { googleDriveEnabled: enabled };
    if (service === 'sheets') return { googleSheetsEnabled: enabled };
    if (service === 'docs') return { googleDocsEnabled: enabled };
    return state;
  }),
  socialProfiles: {
    twitter: '',
    linkedin: '',
    instagram: '',
    youtube: '',
  },
  setSocialProfile: (platform, url) => set((state) => ({
    socialProfiles: { ...state.socialProfiles, [platform]: url }
  })),
  driveSettings: {
    plannerId: null,
    plannerName: null,
    scriptsId: null,
    scriptsName: null,
    imagesId: null,
    imagesName: null,
  },
  setDriveSetting: (type, id, name) => set((state) => ({
    driveSettings: {
      ...state.driveSettings,
      [`${type}Id`]: id,
      [`${type}Name`]: name,
    }
  })),
}));
