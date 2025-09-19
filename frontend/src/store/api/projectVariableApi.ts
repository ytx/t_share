import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ProjectVariable {
  id: number;
  name: string;
  value: string;
  description?: string;
  projectId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    displayName?: string;
    username?: string;
  };
  project: {
    id: number;
    name: string;
  };
}

export interface ProjectVariableCreateData {
  name: string;
  value: string;
  description?: string;
}

export interface ProjectVariableUpdateData {
  name?: string;
  value?: string;
  description?: string;
}

export interface ProjectVariableBulkCreateData {
  variables: ProjectVariableCreateData[];
}

export interface ProjectVariableResponse {
  data: ProjectVariable[];
}

export const projectVariableApi = createApi({
  reducerPath: 'projectVariableApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/project-variables',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ProjectVariable'],
  endpoints: (builder) => ({
    createProjectVariable: builder.mutation<ProjectVariable, { projectId: number; data: ProjectVariableCreateData }>({
      query: ({ projectId, data }) => ({
        url: `/project/${projectId}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectVariable', id: `PROJECT_${projectId}` },
      ],
    }),

    updateProjectVariable: builder.mutation<ProjectVariable, { id: number; data: ProjectVariableUpdateData }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProjectVariable', id }],
    }),

    deleteProjectVariable: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProjectVariable'],
    }),

    getProjectVariable: builder.query<ProjectVariable, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProjectVariable', id }],
    }),

    getProjectVariables: builder.query<ProjectVariableResponse, number>({
      query: (projectId) => `/project/${projectId}`,
      providesTags: (result, error, projectId) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'ProjectVariable' as const, id })),
              { type: 'ProjectVariable', id: `PROJECT_${projectId}` },
            ]
          : [{ type: 'ProjectVariable', id: `PROJECT_${projectId}` }],
    }),

    bulkCreateProjectVariables: builder.mutation<ProjectVariableResponse, { projectId: number; data: ProjectVariableBulkCreateData }>({
      query: ({ projectId, data }) => ({
        url: `/project/${projectId}/bulk`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectVariable', id: `PROJECT_${projectId}` },
      ],
    }),
  }),
});

export const {
  useCreateProjectVariableMutation,
  useUpdateProjectVariableMutation,
  useDeleteProjectVariableMutation,
  useGetProjectVariableQuery,
  useGetProjectVariablesQuery,
  useBulkCreateProjectVariablesMutation,
} = projectVariableApi;