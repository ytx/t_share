// API configuration
export const getApiBaseUrl = (): string => {
  // 環境変数から取得（ビルド時に埋め込まれる）
  const viteApiUrl = import.meta.env.VITE_API_BASE_URL;
  const reactApiUrl = import.meta.env.REACT_APP_API_URL;

  if (viteApiUrl) return viteApiUrl;
  if (reactApiUrl) return reactApiUrl;

  // フォールバック: nginxプロキシ経由で相対パスを使用
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();