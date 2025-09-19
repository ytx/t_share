import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Scene, SceneFormData } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const sceneApi = createApi({
  reducerPath: 'sceneApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/scenes`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Scene'],
  endpoints: (builder) => ({
    // Get all scenes
    getAllScenes: builder.query<{ scenes: Scene[] }, void>({
      query: () => '/',
      providesTags: ['Scene'],
    }),

    // Get scene by ID
    getScene: builder.query<{ scene: Scene }, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Scene', id }],
    }),

    // Create scene (admin only)
    createScene: builder.mutation<{ scene: Scene; message: string }, SceneFormData>({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Scene'],
    }),

    // Update scene (admin only)
    updateScene: builder.mutation<{ scene: Scene; message: string }, { id: number; data: Partial<SceneFormData> }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Scene', id }, 'Scene'],
    }),

    // Delete scene (admin only)
    deleteScene: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Scene'],
    }),
  }),
});

export const {
  useGetAllScenesQuery,
  useGetSceneQuery,
  useCreateSceneMutation,
  useUpdateSceneMutation,
  useDeleteSceneMutation,
} = sceneApi;