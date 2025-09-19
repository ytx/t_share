// User types
export interface User {
  id: number;
  email: string;
  username?: string;
  displayName?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Template types
export interface Template {
  id: number;
  title: string;
  content: string;
  description?: string;
  sceneId?: number;
  status: 'draft' | 'published';
  isPublic: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    displayName?: string;
    username?: string;
  };
  scene?: Scene;
  templateTags: TemplateTag[];
  templateUsage?: TemplateUsage[];
}

export interface TemplateUsage {
  id: number;
  templateId: number;
  userId: number;
  usageCount: number;
  lastUsedAt: string;
}

export interface TemplateVersion {
  id: number;
  templateId: number;
  versionNumber: number;
  title: string;
  content: string;
  description?: string;
  sceneId?: number;
  status: string;
  createdBy: number;
  createdAt: string;
  creator: {
    id: number;
    displayName?: string;
    username?: string;
  };
}

// Scene types
export interface Scene {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    displayName?: string;
    username?: string;
  };
  _count?: {
    templates: number;
  };
}

// Tag types
export interface Tag {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdBy: number;
  createdAt: string;
  creator: {
    id: number;
    displayName?: string;
    username?: string;
  };
  _count?: {
    templateTags: number;
  };
}

export interface TemplateTag {
  id: number;
  templateId: number;
  tagId: number;
  tag: Tag;
}

// Search and filter types
export interface TemplateSearchFilters {
  keyword?: string;
  sceneId?: number;
  createdBy?: string;
  status?: 'active' | 'all';
  tagIds?: number[];
  sortBy?: 'lastUsed' | 'updated' | 'created';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  adminMode?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TemplateSearchResponse {
  data: Template[];
  pagination: PaginationInfo;
}

// Form types
export interface TemplateFormData {
  title: string;
  content: string;
  description?: string;
  sceneId?: number;
  status: 'draft' | 'published';
  isPublic: boolean;
  tagIds: number[];
}

export interface SceneFormData {
  name: string;
  description?: string;
}

export interface TagFormData {
  name: string;
  description?: string;
  color?: string;
}

// API response types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

// UI state types
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
}

// Editor types
export interface EditorPreferences {
  theme: 'light' | 'dark';
  keybinding: 'default' | 'vim' | 'emacs';
  showLineNumbers: boolean;
  wordWrap: boolean;
  showWhitespace: boolean;
  fontSize: number;
}

// Project types
export interface Project {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    displayName?: string;
    username?: string;
  };
  _count?: {
    documents: number;
    projectVariables?: number;
  };
}

// Document types
export interface Document {
  id: number;
  projectId?: number;
  title?: string;
  content: string;
  contentMarkdown: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    displayName?: string;
    username?: string;
  };
  project?: {
    id: number;
    name: string;
    description?: string;
  };
}