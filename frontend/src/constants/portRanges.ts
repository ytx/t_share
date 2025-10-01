/**
 * ポート範囲定義
 */
export const PORT_RANGES = {
  FRONTEND_DEV: { start: 13200, label: 'フロントエンド開発', key: 'PORT_FRONTEND_DEV' },
  BACKEND_DEV: { start: 14200, label: 'バックエンド開発', key: 'PORT_BACKEND_DEV' },
  DATABASE_DEV: { start: 15200, label: 'データベース開発', key: 'PORT_DATABASE_DEV' },
  FRONTEND_DOCKER: { start: 3200, label: 'フロントエンドDocker', key: 'PORT_FRONTEND_DOCKER' },
  BACKEND_DOCKER: { start: 4200, label: 'バックエンドDocker', key: 'PORT_BACKEND_DOCKER' },
  DATABASE_DOCKER: { start: 5200, label: 'データベースDocker', key: 'PORT_DATABASE_DOCKER' },
} as const;

export type PortRangeKey = keyof typeof PORT_RANGES;
