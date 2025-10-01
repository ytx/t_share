import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ProjectPorts {
  PORT_FRONTEND_DEV?: number;
  PORT_BACKEND_DEV?: number;
  PORT_DATABASE_DEV?: number;
  PORT_FRONTEND_DOCKER?: number;
  PORT_BACKEND_DOCKER?: number;
  PORT_DATABASE_DOCKER?: number;
}

export interface UpdatePortRequest {
  variableName: string;
  port: number;
}

export interface CheckConflictRequest {
  variableName: string;
  port: number;
}

export const portManagementApi = createApi({
  reducerPath: 'portManagementApi',
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
  tagTypes: ['ProjectPorts'],
  endpoints: (builder) => ({
    getProjectPorts: builder.query<{ data: ProjectPorts }, number>({
      query: (projectId) => `/${projectId}/ports`,
      providesTags: (_, __, projectId) => [{ type: 'ProjectPorts', id: projectId }],
    }),

    updateProjectPort: builder.mutation<{ data: { success: boolean } }, { projectId: number; data: UpdatePortRequest }>({
      query: ({ projectId, data }) => ({
        url: `/${projectId}/ports`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { projectId }) => [{ type: 'ProjectPorts', id: projectId }],
    }),

    checkPortConflict: builder.query<{ data: { hasConflict: boolean } }, { projectId: number; params: CheckConflictRequest }>({
      query: ({ projectId, params }) => ({
        url: `/${projectId}/ports/check-conflict`,
        params,
      }),
    }),
  }),
});

export const {
  useGetProjectPortsQuery,
  useUpdateProjectPortMutation,
  useLazyCheckPortConflictQuery,
} = portManagementApi;
