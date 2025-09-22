// API configuration
export const getApiBaseUrl = (): string => {
  // 環境変数から取得（ビルド時に埋め込まれる）
  const viteApiUrl = import.meta.env.VITE_API_BASE_URL;
  const reactApiUrl = import.meta.env.REACT_APP_API_URL;

  if (viteApiUrl) return viteApiUrl;
  if (reactApiUrl) return reactApiUrl;

  // フォールバック: 本番環境では現在のホストを使用
  if (window.location.hostname !== 'localhost') {
    return `${window.location.protocol}//${window.location.hostname}/api`;
  }

  // 開発環境のフォールバック
  return 'http://localhost:3101/api';
};

export const API_BASE_URL = getApiBaseUrl();