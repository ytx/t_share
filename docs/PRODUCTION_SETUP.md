# T-SHARE ローカルプロダクション環境セットアップ

このドキュメントでは、ローカル環境でプロダクション構成のT-SHAREを実行する方法を説明します。

## 概要

ローカルプロダクション環境では、以下のポート構成を使用します：

- **フロントエンド**: http://localhost:3200
- **バックエンドAPI**: http://localhost:4200
- **PostgreSQLデータベース**: localhost:5200

## 前提条件

- Docker Desktop がインストールされ、実行中であること
- Docker Compose が利用可能であること
- curl コマンドが利用可能であること（ヘルスチェック用）

## クイックスタート

### 1. 環境変数の設定（オプション）

デフォルト設定をカスタマイズしたい場合は、環境変数ファイルをコピーして編集してください：

```bash
cp .env.prod .env.prod.local
# .env.prod.local を編集してGoogle OAuth設定などをカスタマイズ
```

### 2. プロダクション環境の起動

```bash
# 簡単起動（推奨）
./scripts/start-prod.sh

# または手動起動
docker-compose -f docker-compose.prod.yml up --build -d
```

### 3. サービスの確認

起動完了後、以下のURLでサービスにアクセスできます：

- **Webアプリケーション**: http://localhost:3200
- **APIドキュメント**: http://localhost:4200/api/health
- **データベース**: `psql -h localhost -p 5200 -U postgres -d templateshare`

### 4. 環境の停止

```bash
# 簡単停止
./scripts/stop-prod.sh

# または手動停止
docker-compose -f docker-compose.prod.yml down
```

## 詳細設定

### 環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `FRONTEND_PORT` | 3200 | フロントエンドのポート |
| `BACKEND_PORT` | 4200 | バックエンドのポート |
| `DATABASE_PORT` | 5200 | データベースのポート |
| `GOOGLE_CLIENT_ID` | (空) | Google OAuthクライアントID |
| `GOOGLE_CLIENT_SECRET` | (空) | Google OAuthクライアントシークレット |

### プロダクション環境の特徴

1. **セキュリティ強化**
   - 非rootユーザーでの実行
   - セキュリティヘッダーの設定
   - 最小権限の原則

2. **パフォーマンス最適化**
   - Gzip圧縮
   - 静的アセットのキャッシュ
   - Nginx最適化設定

3. **ヘルスチェック**
   - アプリケーションレベルでのヘルスチェック
   - 自動復旧機能

4. **ログ管理**
   - 構造化ログ
   - ボリュームマウントでの永続化

## トラブルシューティング

### よくある問題

1. **ポートが既に使用中**
   ```bash
   # 使用中のポートを確認
   lsof -i :3200 -i :4200 -i :5200

   # 必要に応じて他のプロセスを停止
   ```

2. **Dockerイメージのビルドエラー**
   ```bash
   # キャッシュをクリアして再ビルド
   docker-compose -f docker-compose.prod.yml build --no-cache
   ```

3. **データベース接続エラー**
   ```bash
   # データベースコンテナのログを確認
   docker-compose -f docker-compose.prod.yml logs postgres
   ```

### ログの確認

```bash
# 全サービスのログ
docker-compose -f docker-compose.prod.yml logs -f

# 特定サービスのログ
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### データベースアクセス

```bash
# PostgreSQLコンテナに接続
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d templateshare

# 外部からの接続
psql -h localhost -p 5200 -U postgres -d templateshare
```

## 開発との違い

| 項目 | 開発環境 | プロダクション環境 |
|------|----------|-------------------|
| フロントエンド | Vite開発サーバー | Nginx + 静的ファイル |
| バックエンド | ts-node + nodemon | Node.js + ビルド済みJS |
| データベース | ポート5434 | ポート5200 |
| セキュリティ | 基本設定 | 強化設定 |
| パフォーマンス | 開発向け | 最適化済み |

## 本番環境への移行

このローカルプロダクション環境は、実際の本番環境とほぼ同じ構成です。以下の点のみ本番環境で調整が必要です：

1. 環境変数の設定（シークレットキー、データベース接続文字列など）
2. SSL/TLS証明書の設定
3. ドメイン名の設定
4. スケーリング設定