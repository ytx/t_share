# T-SHARE - 定型文管理・共有Webアプリケーション

定型文を管理・共有するためのWebアプリケーション。ユーザーが定型文を作成・編集・共有し、文書作成時に効率的に活用できるシステムです。

## 🚀 クイックスタート

### 開発環境
```bash
# バックエンド
cd backend
npm install
npm run dev

# フロントエンド（別ターミナル）
cd frontend
npm install
npm run dev
```

### ローカルプロダクション環境
```bash
# 簡単起動
./scripts/start-prod.sh

# または手動起動
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📦 環境構成

### 開発環境
- **フロントエンド**: http://localhost:3000 (Vite開発サーバー)
- **バックエンド**: http://localhost:3101 (ts-node + nodemon)
- **データベース**: localhost:5434 (PostgreSQL)

### ローカルプロダクション環境
- **フロントエンド**: http://localhost:3200 (Nginx + 静的ファイル)
- **バックエンド**: http://localhost:4200 (Node.js + ビルド済みJS)
- **データベース**: localhost:5200 (PostgreSQL)

## 📋 主要機能

1. **認証・権限管理** - Googleログイン、管理者権限、ユーザー承認フロー
2. **定型文管理** - 作成・編集・検索・履歴管理、タグ・シーン分類、三状態フィルター
3. **プロジェクト管理** - 作成・編集・削除、公開/非公開設定、所有者変更（管理者）
4. **文書作成・参照** - ACEエディタ、マークダウン、プレビュー、文書検索モーダル
5. **変数管理** - ユーザ変数・プロジェクト変数、チェックボックス機能
6. **設定管理** - エディタ設定（テーマ、キーバインディング）、ダークモード対応
7. **管理機能** - ユーザー・タグ・シーン・プロジェクト・データ管理、データエクスポート/インポート

## 🛠 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite + Material-UI
- **バックエンド**: Node.js + Express + TypeScript + Prisma
- **データベース**: PostgreSQL 15
- **認証**: Google OAuth 2.0 + JWT
- **デプロイ**: Docker + Nginx

## 📚 詳細ドキュメント

- [ローカルプロダクション環境セットアップ](docs/PRODUCTION_SETUP.md)
- [開発ガイドライン](CLAUDE.md)

## 🔧 開発コマンド

```bash
# ビルド
npm run build

# テスト実行
npm test

# リント・型チェック
npm run lint
npm run typecheck

# プロダクション環境停止
./scripts/stop-prod.sh
```

## 📝 最新の更新 (2025-10-01)

### 主要な追加機能
- ✅ プロジェクト所有者変更機能（管理者専用）
- ✅ 文書検索モーダルの改善（日本語IME対応、検索ボタン追加）
- ✅ プロジェクト文書の全文表示（公開プロジェクトの文書は全員閲覧可）
- ✅ ダークモード対応の強化（文書表示エリアの配色改善）
- ✅ TypeScriptコンパイルエラー完全解決（22→0エラー）

### 技術的改善
- TypeScript型安全性の向上（厳格なエラーハンドリング）
- ESLintエラーの解消（1→0エラー）
- プロダクションビルド成功（フロントエンド・バックエンド）
- 監査ログ機能の強化

詳細は [CLAUDE.md](CLAUDE.md) を参照してください。

## 📄 ライセンス

MIT License
