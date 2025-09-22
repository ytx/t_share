import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Document } from '../../types';

export interface DocumentCreateData {
  projectId?: number;
  title?: string;
  content: string;
  contentMarkdown: string;
}

export interface DocumentUpdateData {
  projectId?: number;
  title?: string;
  content?: string;
  contentMarkdown?: string;
}

export interface DocumentSearchParams {
  projectId?: number;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface DocumentSearchResponse {
  data: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentListResponse {
  data: Document[];
}

export const documentApi = createApi({
  reducerPath: 'documentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/documents',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Document'],
  endpoints: (builder) => ({
    createDocument: builder.mutation<Document, DocumentCreateData>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Document'],
    }),

    updateDocument: builder.mutation<Document, { id: number; data: DocumentUpdateData }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Document', id }],
    }),

    deleteDocument: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Document'],
    }),

    getDocument: builder.query<Document, number>({
      query: (id) => `/${id}`,
      providesTags: (_, __, id) => [{ type: 'Document', id }],
    }),

    searchDocuments: builder.query<DocumentSearchResponse, DocumentSearchParams>({
      query: (params) => ({
        url: '/search',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Document' as const, id })),
              { type: 'Document', id: 'SEARCH' },
            ]
          : [{ type: 'Document', id: 'SEARCH' }],
    }),

    getProjectDocuments: builder.query<DocumentListResponse, number>({
      query: (projectId) => `/project/${projectId}`,
      providesTags: (result, _, projectId) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Document' as const, id })),
              { type: 'Document', id: `PROJECT_${projectId}` },
            ]
          : [{ type: 'Document', id: `PROJECT_${projectId}` }],
    }),
  }),
});

export const {
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentQuery,
  useSearchDocumentsQuery,
  useGetProjectDocumentsQuery,
} = documentApi;