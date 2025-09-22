import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface UserVariable {
  id: number;
  name: string;
  value: string;
  description?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserVariableCreateData {
  name: string;
  value: string;
  description?: string;
}

export interface UserVariableUpdateData {
  name?: string;
  value?: string;
  description?: string;
}

export interface UserVariableBulkCreateData {
  variables: UserVariableCreateData[];
}

export interface UserVariableResponse {
  data: UserVariable[];
}

export const userVariableApi = createApi({
  reducerPath: 'userVariableApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/user-variables',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['UserVariable'],
  endpoints: (builder) => ({
    createUserVariable: builder.mutation<UserVariable, UserVariableCreateData>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UserVariable'],
    }),

    updateUserVariable: builder.mutation<UserVariable, { id: number; data: UserVariableUpdateData }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'UserVariable', id }],
    }),

    deleteUserVariable: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UserVariable'],
    }),

    getUserVariable: builder.query<UserVariable, number>({
      query: (id) => `/${id}`,
      providesTags: (_, __, id) => [{ type: 'UserVariable', id }],
    }),

    getUserVariables: builder.query<UserVariableResponse, void>({
      query: () => '',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'UserVariable' as const, id })),
              { type: 'UserVariable', id: 'LIST' },
            ]
          : [{ type: 'UserVariable', id: 'LIST' }],
    }),

    bulkCreateUserVariables: builder.mutation<UserVariableResponse, UserVariableBulkCreateData>({
      query: (data) => ({
        url: '/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UserVariable'],
    }),
  }),
});

export const {
  useCreateUserVariableMutation,
  useUpdateUserVariableMutation,
  useDeleteUserVariableMutation,
  useGetUserVariableQuery,
  useGetUserVariablesQuery,
  useBulkCreateUserVariablesMutation,
} = userVariableApi;