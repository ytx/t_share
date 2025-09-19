import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Project } from '../../types';

export interface ProjectCreateData {
  name: string;
  description?: string;
}

export interface ProjectUpdateData {
  name?: string;
  description?: string;
}

export interface ProjectResponse {
  data: Project[];
}

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/projects',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Project'],
  endpoints: (builder) => ({
    createProject: builder.mutation<Project, ProjectCreateData>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Project'],
    }),

    updateProject: builder.mutation<Project, { id: number; data: ProjectUpdateData }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Project', id }],
    }),

    deleteProject: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),

    getProject: builder.query<Project, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),

    getUserProjects: builder.query<ProjectResponse, void>({
      query: () => '',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Project' as const, id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),

    getAllProjects: builder.query<ProjectResponse, void>({
      query: () => '/all',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Project' as const, id })),
              { type: 'Project', id: 'ALL' },
            ]
          : [{ type: 'Project', id: 'ALL' }],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectQuery,
  useGetUserProjectsQuery,
  useGetAllProjectsQuery,
} = projectApi;