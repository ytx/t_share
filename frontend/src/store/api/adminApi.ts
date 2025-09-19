import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface SystemStats {
  overview: {
    totalUsers: number;
    totalTemplates: number;
    totalProjects: number;
    totalDocuments: number;
    totalVariables: number;
  };
  userActivity: {
    activeUsersToday: number;
    activeUsersWeek: number;
    activeUsersMonth: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
  };
  templateActivity: {
    templatesCreatedToday: number;
    templatesCreatedWeek: number;
    templatesCreatedMonth: number;
    templateUsageToday: number;
    templateUsageWeek: number;
    templateUsageMonth: number;
    popularTemplates: Array<{
      id: number;
      title: string;
      usageCount: number;
      creator: string;
    }>;
  };
  projectActivity: {
    projectsCreatedToday: number;
    projectsCreatedWeek: number;
    projectsCreatedMonth: number;
    documentsCreatedToday: number;
    documentsCreatedWeek: number;
    documentsCreatedMonth: number;
  };
  systemHealth: {
    databaseConnections: number;
    memoryUsage: string;
    uptime: string;
    errorCount24h: number;
  };
}

export interface SystemHealth {
  database: {
    status: string;
    responseTime: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  system: {
    uptime: number;
    platform: string;
    nodeVersion: string;
  };
}

export interface SystemInfo {
  version: string;
  environment: string;
  uptime: number;
  memory: any;
  platform: string;
  nodeVersion: string;
  timestamp: string;
}

export interface AdminUser {
  id: number;
  email: string;
  displayName?: string;
  username?: string;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    templates: number;
    projects: number;
    documents: number;
    userVariables: number;
  };
}

export interface UserListResponse {
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityItem {
  type: 'template' | 'project' | 'document';
  id: number;
  title: string;
  creator: string;
  project?: string;
  createdAt: string;
}

export interface ActivityResponse {
  data: ActivityItem[];
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/admin',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['SystemStats', 'UserList', 'Activity'],
  endpoints: (builder) => ({
    getSystemStats: builder.query<SystemStats, void>({
      query: () => '/stats',
      providesTags: ['SystemStats'],
      keepUnusedDataFor: 300,
    }),

    getSystemHealth: builder.query<SystemHealth, void>({
      query: () => '/health',
      keepUnusedDataFor: 60,
    }),

    getSystemInfo: builder.query<SystemInfo, void>({
      query: () => '/info',
    }),

    getUserList: builder.query<UserListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/users',
        params: { page, limit },
      }),
      providesTags: ['UserList'],
      keepUnusedDataFor: 300,
    }),

    getRecentActivity: builder.query<ActivityResponse, { limit?: number }>({
      query: ({ limit = 50 } = {}) => ({
        url: '/activity',
        params: { limit },
      }),
      providesTags: ['Activity'],
      keepUnusedDataFor: 180,
    }),

    exportSystemData: builder.query<any, void>({
      query: () => '/export',
    }),
  }),
});

export const {
  useGetSystemStatsQuery,
  useGetSystemHealthQuery,
  useGetSystemInfoQuery,
  useGetUserListQuery,
  useGetRecentActivityQuery,
  useExportSystemDataQuery,
} = adminApi;