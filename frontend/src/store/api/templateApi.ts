import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Template, TemplateSearchResponse, TemplateSearchFilters, TemplateFormData, TemplateVersion } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3101`;

export const templateApi = createApi({
  reducerPath: 'templateApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/templates`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Template', 'TemplateVersion'],
  endpoints: (builder) => ({
    // Search templates
    searchTemplates: builder.query<TemplateSearchResponse, TemplateSearchFilters>({
      query: (filters) => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });

        return `/?${params.toString()}`;
      },
      providesTags: ['Template'],
    }),

    // Get template by ID
    getTemplate: builder.query<{ template: Template }, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Template', id }],
    }),

    // Create template
    createTemplate: builder.mutation<{ template: Template; message: string }, TemplateFormData>({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Template'],
    }),

    // Update template
    updateTemplate: builder.mutation<{ template: Template; message: string }, { id: number; data: Partial<TemplateFormData> }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Template', id }, 'Template'],
    }),

    // Delete template
    deleteTemplate: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Template'],
    }),

    // Use template (record usage)
    useTemplate: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/${id}/use`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Template', id }],
    }),

    // Get template versions
    getTemplateVersions: builder.query<{ versions: TemplateVersion[] }, number>({
      query: (id) => `/${id}/versions`,
      providesTags: (result, error, id) => [{ type: 'TemplateVersion', id }],
    }),

    // Restore template version
    restoreTemplateVersion: builder.mutation<{ template: Template; message: string }, { id: number; version: number }>({
      query: ({ id, version }) => ({
        url: `/${id}/restore/${version}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Template', id },
        { type: 'TemplateVersion', id },
        'Template',
      ],
    }),
  }),
});

export const {
  useSearchTemplatesQuery,
  useGetTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useUseTemplateMutation,
  useGetTemplateVersionsQuery,
  useRestoreTemplateVersionMutation,
} = templateApi;