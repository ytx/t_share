export interface AppLocalStorageData {
  selectedProjectId?: number;
  selectedSceneId?: number;
  themeMode?: 'light' | 'dark';
  adminMode?: boolean;
  editorContent?: string;
  searchFilters?: {
    sceneId?: number;
    sortBy?: string;
    keyword?: string;
    tagFilter?: string[];
    excludedTagFilter?: string[];
  };
}

const STORAGE_KEY = 't-share-app-state';

export const saveToLocalStorage = (data: Partial<AppLocalStorageData>) => {
  try {
    const existingData = getFromLocalStorage();
    const updatedData = { ...existingData, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const getFromLocalStorage = (): AppLocalStorageData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return {};
  }
};

export const clearLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

export const saveProjectSelection = (projectId?: number) => {
  saveToLocalStorage({ selectedProjectId: projectId });
};

export const saveSceneSelection = (sceneId?: number) => {
  saveToLocalStorage({ selectedSceneId: sceneId });
};

export const saveThemeMode = (mode: 'light' | 'dark') => {
  saveToLocalStorage({ themeMode: mode });
};

export const saveAdminMode = (isAdmin: boolean) => {
  saveToLocalStorage({ adminMode: isAdmin });
};

export const saveEditorContent = (content: string) => {
  saveToLocalStorage({ editorContent: content });
};

export const saveSearchFilters = (filters: {
  sceneId?: number;
  sortBy?: string;
  keyword?: string;
  tagFilter?: string[];
  excludedTagFilter?: string[];
}) => {
  saveToLocalStorage({ searchFilters: filters });
};