# 定型文管理・共有Webアプリ (Template Share)

## プロジェクト概要
定型文を管理・共有するためのWebアプリケーション。ユーザーが定型文を作成・編集・共有し、文書作成時に効率的に活用できるシステム。

## 技術スタック
- **フロントエンド**: React
- **バックエンド**: Node.js
- **データベース**: PostgreSQL
- **デプロイ**: AWS EC2（Docker）

## 開発・運用コマンド
```bash
# 開発環境起動
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# リント・型チェック
npm run lint
npm run typecheck

# Dockerビルド
docker build -t template-share .

# Docker起動
docker-compose up -d
```

## プロジェクト構成
```
/
├── frontend/          # Reactアプリケーション
├── backend/           # Node.js API サーバー
├── database/          # PostgreSQL設定・マイグレーション
├── docs/              # ドキュメント
├── docker/            # Docker設定
└── README.md
```

## 主要機能
1. **認証・権限管理** - Googleログイン、管理者権限
2. **定型文管理** - 作成・編集・検索・履歴管理
3. **文書作成** - Aceエディタ、マークダウン、プレビュー
4. **変数管理** - ユーザ変数・プロジェクト変数
5. **設定管理** - エディタ設定、データエクスポート・インポート

## 開発ガイドライン
- コードスタイル: Prettier + ESLint
- コミットメッセージ: Conventional Commits
- ブランチ戦略: Git Flow
- テスト: Jest + React Testing Library