import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Tag, TagFormData } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3101`;

export const tagApi = createApi({
  reducerPath: 'tagApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/tags`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Tag'],
  endpoints: (builder) => ({
    // Get all tags
    getAllTags: builder.query<{ tags: Tag[] }, void>({
      query: () => '/',
      providesTags: ['Tag'],
    }),

    // Get popular tags
    getPopularTags: builder.query<{ tags: Tag[] }, number | void>({
      query: (limit = 10) => `/popular?limit=${limit}`,
      providesTags: ['Tag'],
    }),

    // Get tag by ID
    getTag: builder.query<{ tag: Tag }, number>({
      query: (id) => `/${id}`,
      providesTags: (_, __, id) => [{ type: 'Tag', id }],
    }),

    // Create tag
    createTag: builder.mutation<{ tag: Tag; message: string }, TagFormData>({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tag'],
    }),

    // Update tag
    updateTag: builder.mutation<{ tag: Tag; message: string }, { id: number; data: Partial<TagFormData> }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Tag', id }, 'Tag'],
    }),

    // Delete tag
    deleteTag: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tag'],
    }),
  }),
});

export const {
  useGetAllTagsQuery,
  useGetPopularTagsQuery,
  useGetTagQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = tagApi;