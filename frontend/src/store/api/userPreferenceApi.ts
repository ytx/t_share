import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface EditorSettings {
  theme?: 'light' | 'dark';
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  keybinding?: 'default' | 'vim' | 'emacs';
  showWhitespace?: boolean;
}

export interface UISettings {
  sidebarOpen?: boolean;
  compactMode?: boolean;
  showMinimap?: boolean;
}

export interface NotificationSettings {
  emailNotifications?: boolean;
  browserNotifications?: boolean;
  soundEnabled?: boolean;
}

export interface UserPreferences {
  id: number;
  userId: number;
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  editorSettings: EditorSettings;
  uiSettings: UISettings;
  notifications: NotificationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferenceUpdateData {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'ja' | 'en';
  editorSettings?: EditorSettings;
  uiSettings?: UISettings;
  notifications?: NotificationSettings;
}

export const userPreferenceApi = createApi({
  reducerPath: 'userPreferenceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/user-preferences',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['UserPreference'],
  endpoints: (builder) => ({
    getUserPreferences: builder.query<UserPreferences, void>({
      query: () => '',
      providesTags: ['UserPreference'],
    }),

    updateUserPreferences: builder.mutation<UserPreferences, UserPreferenceUpdateData>({
      query: (data) => ({
        url: '',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['UserPreference'],
    }),

    resetUserPreferences: builder.mutation<UserPreferences, void>({
      query: () => ({
        url: '/reset',
        method: 'POST',
      }),
      invalidatesTags: ['UserPreference'],
    }),

    updateEditorSettings: builder.mutation<UserPreferences, EditorSettings>({
      query: (data) => ({
        url: '/editor',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['UserPreference'],
    }),

    updateUISettings: builder.mutation<UserPreferences, UISettings>({
      query: (data) => ({
        url: '/ui',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['UserPreference'],
    }),

    updateNotificationSettings: builder.mutation<UserPreferences, NotificationSettings>({
      query: (data) => ({
        url: '/notifications',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['UserPreference'],
    }),

    exportUserPreferences: builder.query<any, void>({
      query: () => '/export',
    }),

    importUserPreferences: builder.mutation<UserPreferences, any>({
      query: (data) => ({
        url: '/import',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UserPreference'],
    }),
  }),
});

export const {
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useResetUserPreferencesMutation,
  useUpdateEditorSettingsMutation,
  useUpdateUISettingsMutation,
  useUpdateNotificationSettingsMutation,
  useExportUserPreferencesQuery,
  useImportUserPreferencesMutation,
} = userPreferenceApi;