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
      invalidatesTags: (result, _, { id, data }) => {
        const tags: Array<{ type: 'Document'; id?: number | string } | 'Document'> = [
          { type: 'Document', id },
          'Document', // Invalidate all document queries
        ];
        // If updating a shared document, also invalidate the shared project document cache
        if (data.projectId) {
          tags.push({ type: 'Document', id: `SHARED_${data.projectId}` });
        }
        // If updating personal memo, also invalidate personal memo cache
        if (result && result.title === 'メモ（自分用）') {
          tags.push({ type: 'Document', id: 'PERSONAL_MEMO' });
        }
        return tags;
      },
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

    getSharedProjectDocument: builder.query<{ data: Document }, number>({
      query: (projectId) => `/project/${projectId}/shared`,
      providesTags: (_, __, projectId) => [
        { type: 'Document', id: `SHARED_${projectId}` },
      ],
    }),

    getPersonalMemo: builder.query<{ data: Document }, void>({
      query: () => '/personal-memo',
      providesTags: () => [
        { type: 'Document', id: 'PERSONAL_MEMO' },
      ],
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
  useGetSharedProjectDocumentQuery,
  useGetPersonalMemoQuery,
} = documentApi;