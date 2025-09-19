# 実装計画書 - Template Share

## 実装概要

### 開発アプローチ
- **段階的実装**: フェーズ分けによる段階的開発
- **最小機能プロダクト (MVP)**: 基本機能から開始し、段階的に機能追加
- **フロントエンド・バックエンド並行開発**: API設計確定後、並行開発

### 進捗状況 (2024年現在)
- ✅ **Phase 1 完了**: 基盤構築・認証・データベース
- 🚧 **Phase 2 開始**: 定型文管理API・基本UI実装

### 技術選択理由
- **React**: 豊富なエコシステム、コンポーネント再利用性
- **Node.js + Express**: JavaScript統一、高速開発
- **PostgreSQL**: ACID準拠、全文検索機能
- **Docker**: 環境統一、デプロイ簡略化

## 実装フェーズ

### Phase 1: 基盤構築 (Week 1-2) ✅ **完了**
**目標**: 基本的な認証とデータベース構造の構築

#### Phase 1.1: プロジェクトセットアップ ✅
- [x] プロジェクト構造作成
- [x] Docker環境構築
- [x] フロントエンド基盤 (React + TypeScript + Vite)
- [x] バックエンド基盤 (Node.js + Express + TypeScript)
- [x] PostgreSQLデータベースセットアップ

#### Phase 1.2: 認証システム ✅
- [x] Google OAuth設定 (Passport.js)
- [x] JWT認証実装
- [x] ユーザ管理API
- [x] 認証ミドルウェア実装
- [x] 基本的なバックエンド認証フロー

#### Phase 1.3: データベース実装 ✅
- [x] Prismaスキーマ作成
- [x] 全テーブル作成
- [x] インデックス設定
- [x] シードデータ投入
- [x] バリデーションスキーマ作成

### Phase 2: 基本機能実装 (Week 3-5) 🚧 **進行中**
**目標**: 定型文の基本CRUD操作とテンプレート検索

#### Phase 2.1: 定型文管理API ✅
- [x] 定型文CRUD API実装
- [x] シーン・タグ管理API
- [x] 検索・フィルタリングAPI
- [x] バージョン管理API
- [x] 使用状況追跡API
- [x] 認証・認可機能

#### Phase 2.2: フロントエンド基本UI
- [ ] メインレイアウト (分割パネル)
- [ ] 定型文検索パネル
- [ ] 定型文作成・編集モーダル
- [ ] 基本的なナビゲーション

#### Phase 2.3: 検索・フィルタリング機能
- [ ] キーワード検索実装
- [ ] シーン・タグフィルタ
- [ ] 並び順機能
- [ ] ページネーション

### Phase 3: エディタ機能実装 (Week 6-7)
**目標**: 文書作成エディタとテンプレート活用機能

#### Phase 3.1: エディタ統合
- [ ] Ace Editorセットアップ
- [ ] Markdownモード設定
- [ ] エディタ設定機能
- [ ] プレビュー機能

#### Phase 3.2: テンプレート活用機能
- [ ] テンプレートペースト機能
- [ ] 変数置換モーダル
- [ ] チェックボックス処理
- [ ] 使用状況追跡

#### Phase 3.3: 文書管理
- [ ] 文書保存機能
- [ ] プロジェクト管理
- [ ] 文書履歴表示
- [ ] クリップボードコピー

### Phase 4: 高度な機能実装 (Week 8-9)
**目標**: 変数管理、設定、管理機能

#### Phase 4.1: 変数管理システム
- [ ] ユーザ変数CRUD
- [ ] プロジェクト変数CRUD
- [ ] 変数置換エンジン
- [ ] 変数管理UI

#### Phase 4.2: 設定・環境設定
- [ ] ユーザ設定API
- [ ] テーマ切り替え機能
- [ ] エディタ設定保存
- [ ] 設定画面UI

#### Phase 4.3: 管理機能
- [ ] 管理者権限制御
- [ ] 管理画面UI
- [ ] データエクスポート・インポート
- [ ] システム統計

### Phase 5: 最適化・テスト (Week 10-11)
**目標**: パフォーマンス最適化とテスト

#### Phase 5.1: パフォーマンス最適化
- [ ] データベースクエリ最適化
- [ ] フロントエンド最適化
- [ ] キャッシュ戦略実装
- [ ] 負荷テスト

#### Phase 5.2: テスト実装
- [ ] ユニットテスト (Backend)
- [ ] ユニットテスト (Frontend)
- [ ] 統合テスト
- [ ] E2Eテスト

#### Phase 5.3: デプロイ準備
- [ ] Production環境設定
- [ ] Docker最適化
- [ ] CI/CDパイプライン
- [ ] モニタリング設定

## 詳細実装タスク

### プロジェクト構造
```
template-share/
├── backend/
│   ├── src/
│   │   ├── controllers/     # APIコントローラ
│   │   ├── models/          # データモデル
│   │   ├── routes/          # ルーティング
│   │   ├── middleware/      # ミドルウェア
│   │   ├── services/        # ビジネスロジック
│   │   ├── utils/           # ユーティリティ
│   │   └── database/        # DB設定・マイグレーション
│   ├── tests/               # テストファイル
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Reactコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── hooks/           # カスタムフック
│   │   ├── services/        # API通信
│   │   ├── store/           # Redux store
│   │   ├── types/           # TypeScript型定義
│   │   └── utils/           # ユーティリティ
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── database/
│   ├── migrations/          # マイグレーション
│   ├── seeds/               # シードデータ
│   └── init.sql
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx.conf
└── docs/                    # ドキュメント
```

### 技術的実装詳細

#### バックエンド技術スタック
```json
{
  "runtime": "Node.js 18+",
  "framework": "Express.js",
  "database": "PostgreSQL 15+",
  "orm": "Prisma or Sequelize",
  "authentication": "Passport.js (Google OAuth + Local)",
  "validation": "Joi or Yup",
  "testing": "Jest + Supertest",
  "logging": "Winston",
  "documentation": "Swagger/OpenAPI"
}
```

#### フロントエンド技術スタック
```json
{
  "framework": "React 18+",
  "language": "TypeScript",
  "state_management": "Redux Toolkit + RTK Query",
  "ui_library": "Material-UI (MUI) or Ant Design",
  "editor": "react-ace",
  "routing": "React Router v6",
  "styling": "Styled Components or CSS Modules",
  "testing": "Jest + React Testing Library",
  "build_tool": "Vite"
}
```

#### データベース実装戦略
```sql
-- 実装順序
1. users テーブル (認証基盤)
2. scenes, tags テーブル (マスタデータ)
3. projects テーブル (プロジェクト管理)
4. templates, template_versions テーブル (定型文管理)
5. template_tags, template_usage テーブル (関連テーブル)
6. user_variables, project_variables テーブル (変数管理)
7. documents テーブル (文書管理)
8. user_preferences テーブル (設定管理)
```

## API実装優先順位

### 高優先度 API (Phase 2)
1. **認証API**: `/api/auth/*`
2. **定型文API**: `/api/templates/*`
3. **検索API**: `/api/templates?search=...`
4. **シーン・タグAPI**: `/api/scenes/*`, `/api/tags/*`

### 中優先度 API (Phase 3-4)
1. **プロジェクトAPI**: `/api/projects/*`
2. **文書API**: `/api/documents/*`
3. **変数API**: `/api/variables/*`
4. **設定API**: `/api/preferences/*`

### 低優先度 API (Phase 4-5)
1. **管理API**: `/api/admin/*`
2. **エクスポートAPI**: `/api/admin/export`
3. **統計API**: `/api/admin/stats`

## フロントエンド実装優先順位

### Phase 2: 基本UI
1. **レイアウトコンポーネント**: AppLayout, Header, Sidebar
2. **認証コンポーネント**: Login, AuthGuard
3. **定型文検索**: TemplateSearch, SearchFilters
4. **定型文管理**: TemplateList, TemplateCard, TemplateModal

### Phase 3: エディタ機能
1. **エディタコンポーネント**: DocumentEditor, AceEditorWrapper
2. **プレビューコンポーネント**: MarkdownPreview
3. **変数モーダル**: VariableSubstitutionModal
4. **文書管理**: DocumentList, ProjectSelector

### Phase 4: 高度な機能
1. **設定コンポーネント**: SettingsModal, PreferencesForm
2. **変数管理**: VariableManager, VariableForm
3. **管理画面**: AdminDashboard, UserManagement
4. **テーマシステム**: ThemeProvider, ThemeToggle

## テスト戦略

### バックエンドテスト
- **ユニットテスト**: 各サービス、コントローラのテスト
- **統合テスト**: API エンドポイントのテスト
- **データベーステスト**: モデルとクエリのテスト

### フロントエンドテスト
- **コンポーネントテスト**: 各Reactコンポーネントのテスト
- **フックテスト**: カスタムフックのテスト
- **E2Eテスト**: ユーザーワークフローのテスト

## リスク管理

### 技術的リスク
1. **Google OAuth設定の複雑さ** → 事前検証・ドキュメント準備
2. **Ace Editorのカスタマイズ** → プロトタイプ作成
3. **PostgreSQL全文検索パフォーマンス** → インデックス戦略検討

### 開発リスク
1. **フロントエンド・バックエンド統合** → 早期統合テスト
2. **データベース設計変更** → マイグレーション戦略
3. **UI/UX要件変更** → モックアップ事前確認

## 成功指標

### Phase 1 完了指標 ✅
- [x] ローカル環境でのDocker起動
- [x] Google認証ログイン成功
- [x] 基本データベーステーブル作成
- [x] JWT認証フロー実装
- [x] Prismaスキーマ完成
- [x] シードデータ投入完了

### Phase 2 完了指標
- [ ] 定型文の作成・編集・削除
- [ ] キーワード検索機能
- [ ] フィルタリング機能

### Phase 3 完了指標
- [ ] エディタでのMarkdown編集
- [ ] テンプレートペースト機能
- [ ] 変数置換機能

### 最終完了指標
- [ ] 全要件機能の実装完了
- [ ] テストカバレッジ80%以上
- [ ] パフォーマンステスト合格
- [ ] Production環境デプロイ成功