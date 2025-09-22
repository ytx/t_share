import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/api';

export interface ExportData {
  exportedAt: string;
  version: string;
  data: {
    users: any[];
    scenes: any[];
    tags: any[];
    projects: any[];
    templates: any[];
    templateVersions: any[];
    templateTags: any[];
    templateUsage: any[];
    userVariables: any[];
    projectVariables: any[];
    documents: any[];
    userPreferences: any[];
  };
}

export interface ImportOptions {
  clearExistingData?: boolean;
  preserveIds?: boolean;
}

export interface ImportRequest {
  exportedAt: string;
  version: string;
  data: ExportData['data'];
  options?: ImportOptions;
}

export interface ExportStats {
  users: number;
  scenes: number;
  tags: number;
  projects: number;
  templates: number;
  documents: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: Record<string, number>;
}

export const dataExportImportApi = createApi({
  reducerPath: 'dataExportImportApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/admin/data`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // データエクスポート
    exportAllData: builder.mutation<Blob, void>({
      query: () => ({
        url: '/export',
        method: 'GET',
        responseHandler: async (response) => {
          // JSONファイルとしてダウンロード
          return await response.blob();
        },
      }),
    }),

    // データインポート
    importAllData: builder.mutation<
      { message: string; options: ImportOptions; importedAt: string },
      ImportRequest
    >({
      query: (data) => ({
        url: '/import',
        method: 'POST',
        body: data,
      }),
    }),

    // エクスポート統計取得
    getExportStats: builder.query<
      { message: string; stats: ExportStats; timestamp: string },
      void
    >({
      query: () => '/stats',
    }),

    // インポートデータ検証
    validateImportData: builder.mutation<
      { message: string; validation: ValidationResult; timestamp: string },
      ExportData
    >({
      query: (data) => ({
        url: '/validate',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useExportAllDataMutation,
  useImportAllDataMutation,
  useGetExportStatsQuery,
  useValidateImportDataMutation,
} = dataExportImportApi;

// ファイルダウンロード用ヘルパー関数
export const downloadExportFile = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/api/admin/data/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // ファイル名をレスポンスヘッダーから取得
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'template-share-export.json';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error('Export download failed:', error);
    throw error;
  }
};

// ファイル読み込み用ヘルパー関数
export const readImportFile = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as ExportData;

        // 基本的なデータ構造チェック
        if (!data.exportedAt || !data.version || !data.data) {
          throw new Error('Invalid export file format');
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse import file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};