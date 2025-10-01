import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface ImportResponse {
  success: boolean;
  result: ImportResult;
}

interface ImportStats {
  totalConversations: number;
  withResponses: number;
  withoutResponses: number;
}

interface StatsResponse {
  success: boolean;
  data: ImportStats;
}

interface ImportHistoryItem {
  id: number;
  userId: number;
  fileName: string;
  fileSize: number;
  projectId: number | null;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  createdAt: string;
  project?: {
    id: number;
    name: string;
  };
}

interface HistoryResponse {
  success: boolean;
  data: ImportHistoryItem[];
}

export const claudeHistoryApi = createApi({
  reducerPath: 'claudeHistoryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/claude-history',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ClaudeHistory', 'Documents'],
  endpoints: (builder) => ({
    importJsonl: builder.mutation<ImportResponse, { file: File; projectId?: number }>({
      query: ({ file, projectId }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (projectId) {
          formData.append('projectId', projectId.toString());
        }
        return {
          url: '/import',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['ClaudeHistory', 'Documents'],
    }),
    getImportStats: builder.query<StatsResponse, void>({
      query: () => '/stats',
      providesTags: ['ClaudeHistory'],
    }),
    getImportHistory: builder.query<HistoryResponse, { projectId?: number }>({
      query: ({ projectId }) => ({
        url: '/history',
        params: projectId ? { projectId } : undefined,
      }),
      providesTags: ['ClaudeHistory'],
    }),
  }),
});

export const {
  useImportJsonlMutation,
  useGetImportStatsQuery,
  useGetImportHistoryQuery,
} = claudeHistoryApi;
