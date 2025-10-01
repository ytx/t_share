# 定型文管理・共有Webアプリ (T-SHARE)

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
2. **定型文管理** - 作成・編集・検索・履歴管理、タグ・シーン分類
3. **プロジェクト管理** - 作成・編集・削除、公開/非公開設定
4. **文書作成** - Aceエディタ、マークダウン、プレビュー
5. **変数管理** - ユーザ変数・プロジェクト変数
6. **設定管理** - エディタ設定
7. **管理機能** - ユーザー・タグ・シーン・プロジェクト・データ管理

## 開発ガイドライン
- コードスタイル: Prettier + ESLint
- コミットメッセージ: Conventional Commits
- ブランチ戦略: Git Flow
- テスト: Jest + React Testing Library

## 最新の変更履歴 (2025-10-01)

### メイン画面下段エディタの完全サーバーストレージ化
1. **プロジェクト内共有文書機能**
   - タイトル「プロジェクト内共有」の文書をプロジェクトごとに自動作成
   - プロジェクトにアクセスできる全ユーザーが閲覧・編集可能
   - 公開プロジェクト: 全ユーザーがアクセス可能
   - 非公開プロジェクト: 所有者と管理者のみアクセス可能
   - タブ名: 「プロジェクト内共有」

2. **個人メモ機能（サーバーストレージ化）**
   - タイトル「メモ（自分用）」の文書をユーザーごとに自動作成
   - LocalStorageからサーバーストレージに完全移行
   - ユーザーごとに1つのメモ文書（作成者のみアクセス可能）
   - 複数デバイス間での同期が可能に
   - タブ名: 「メモ（自分用）」

3. **自動保存機能の強化**
   - 3秒デバウンスでの自動保存
   - タブ切り替え時の即座保存（flush機能）
   - 未保存変更の視覚的インジケーター
   - コンポーネントのマウント状態維持（CSS表示制御）
   - キャッシュ管理の最適化

4. **バックエンドAPI拡張**
   - `GET /api/documents/project/:projectId/shared`: プロジェクト内共有文書取得・作成
   - `GET /api/documents/personal-memo`: 個人メモ取得・作成
   - 特殊文書のアクセス制御実装
   - `updateDocument`: タイトルベースの権限チェック追加

5. **文書フィルタリング**
   - 「全ての文書」モーダルから特殊文書を除外
   - `getProjectDocuments`: 特殊文書を除外（プロジェクト内共有、メモ（自分用））
   - 通常の文書一覧と特殊文書の分離

6. **UI/UX改善**
   - タブ順序: プロジェクト内共有 → メモ（自分用）
   - タブ選択状態のlocalStorage永続化
   - リフレッシュボタン追加（設定ボタンの左側）
   - プロジェクト未選択時のタブ無効化

### データエクスポート機能の改善
1. **タイムスタンプのJST対応**
   - エクスポートファイル名のタイムスタンプをGMTからJSTに変更
   - UTC+9時間のオフセット適用
   - ファイル名例: `t-share-export-2025-10-01T15-30-45.json`

### TypeScriptコンパイルエラーの完全解決
1. **全TypeScriptエラーの修正**
   - バックエンド: 22エラー → 0エラー (100%解決)
   - フロントエンド: 0エラー維持
   - 未使用パラメータの整理
   - 型定義の統一化

2. **ESLint警告の維持**
   - エラー: 0件
   - 警告: 18件 (型アサーション関連、許容範囲内)

## 以前の変更履歴 (2025-10-01)

### プロジェクト所有者変更機能の実装
1. **管理者専用の所有者変更機能**
   - 管理画面のプロジェクト編集で所有者を変更可能
   - バリデーション: 管理者権限必須、承認済みユーザーのみ選択可能
   - 変更履歴のログ出力（監査用）
   - 新しい所有者は承認済みユーザー必須
   - バックエンドで厳密なバリデーション

### 文書参照モーダルの機能改善
1. **検索機能の改善（日本語IME対応）**
   - 検索ボタン追加（即時検索から明示的検索へ）
   - Enterキーでも検索実行可能
   - 日本語入力中に検索が実行されない仕様
   - searchInputとsearchKeywordの分離

2. **検索結果なし時のUI改善**
   - 検索フィールドを常に表示
   - 検索条件を変更して継続検索可能
   - メッセージエリアで状態を明示
   - 入力フィールドが消えない仕様

3. **プロジェクト文書のアクセス権限拡張**
   - 公開プロジェクトの文書は全ユーザーが閲覧可能
   - 作成者に依らずプロジェクト内の全文書を表示
   - アクセス権限: 公開プロジェクト OR 所有者 OR 管理者
   - `documentService.ts`: getProjectDocumentsの権限チェック修正

4. **ダークモード対応**
   - 文書内容表示エリアの配色調整
   - ライトモード: grey.50背景
   - ダークモード: grey.900背景、grey.100文字色
   - テーマモード自動切り替え

5. **UI/UX改善**
   - 検索ボタン配置（入力フィールドの右側）
   - 検索結果0件時も入力継続可能
   - キーボードショートカット維持（←→↑↓, Esc）
   - レスポンシブ対応

## 以前の変更履歴 (2025-09-23)

### 選択的データインポート機能の実装
1. **カテゴリベースインポートシステム**
   - データインポート時に4つのカテゴリから選択してインポート可能
   - **ユーザー**: ユーザーアカウント情報
   - **シーン・定型文**: シーン、タグ、定型文、定型文バージョン、定型文タグ、使用履歴
   - **プロジェクト・文書**: プロジェクト、プロジェクト変数、文書
   - **システム設定**: ユーザー変数、ユーザー設定

2. **バックエンドサービス拡張**
   - `/src/services/dataExportImportService.ts` の大幅更新
   - `ImportCategories` インターフェースの追加
   - `clearCategoryData` メソッドでカテゴリ別データ削除機能
   - `importInOrder` メソッドでカテゴリ条件付きインポート機能
   - 依存関係を考慮した安全なカテゴリ別処理

3. **API エンドポイント更新**
   - `/src/controllers/dataExportImportController.ts` の更新
   - Zod バリデーションスキーマにカテゴリ対応を追加
   - `importCategoriesSchema` による厳密な型チェック
   - インポートオプションの拡張

4. **フロントエンド UI 機能追加**
   - `/src/store/api/dataExportImportApi.ts` 型定義更新
   - `/src/components/Settings/DataManagementPanel.tsx` UI拡張
   - カテゴリ選択チェックボックス セクションの追加
   - 各カテゴリの詳細説明テキスト表示
   - デフォルト全選択設定

5. **選択的インポートのメリット**
   - 必要なデータのみをインポート可能
   - 既存データの部分更新が安全に実行可能
   - テスト環境での特定データのみ復元
   - 本番環境への段階的データ移行サポート

6. **技術的実装詳細**
   - カテゴリ未指定時は全データインポート（後方互換性維持）
   - トランザクション内でのカテゴリ別処理
   - 外部キー制約を考慮した適切な削除順序
   - ID保持設定との組み合わせサポート

## 以前の変更履歴 (2025-09-23)

### TypeScript型安全性の強化・ESLint警告解消
1. **包括的エラーハンドリングシステムの実装**
   - `/src/utils/errorHandler.ts` 新規作成
   - 型安全なエラー抽出機能（`getErrorMessage`, `getErrorStack`）
   - 統一的なコントローラーエラーハンドリング（`handleControllerError`）
   - HTTP ステータスコード別の自動判定（404, 403, 409, 400, 500）
   - 今後の実装で再利用可能な設計

2. **コントローラー層の型安全性向上**
   - templateController, tagController, sceneController の全面改修
   - 50+ の冗長なcatchブロックを統一的なエラーハンドラーに置換
   - 既存のエラーロジックを維持しつつ型安全性を向上
   - 全コントローラーで一貫したエラーハンドリングパターンを適用

3. **認証・ミドルウェア層の型修正**
   - JWT ペイロード型定義の追加（`JwtPayload` インターフェース）
   - 認証ミドルウェアの `any` 型を適切な型に変更
   - passport.js の型安全性向上
   - 不要なimportの削除とコード整理

4. **サービス層の型改善**
   - `dataExportImportService.ts` の戻り値型定義
   - `authService.ts` の JWT 署名処理修正
   - Prisma 型との統合改善

5. **ESLint警告の大幅削減**
   - **87 → 10件の警告削減（88%改善）**
   - `@typescript-eslint/no-explicit-any` 警告の系統的解決
   - 未使用変数・import の整理
   - 型安全性を保ちながらの段階的改善

6. **開発効率性・保守性の向上**
   - 新規実装での型安全パターンの標準化
   - エラーハンドリングの一元化による保守性向上
   - TypeScript コンパイルエラーの解決推進
   - コードレビュー・品質管理の改善

7. **技術的詳細**
   - フェーズ2: 中期対応アプローチの採用
   - 型安全性とコンパイル成功の両立
   - 既存機能への影響を最小限に抑制
   - 将来の開発での適用可能性を重視した設計

### Ansibleデプロイメント設定の改善
1. **データベース保護機能の実装**
   - ステージング・本番環境でのデータベース内容保持機能
   - `./run-deploy.sh staging` でデータを削除せずマイグレーションのみ実行
   - PostgreSQLデータボリューム（`t-share_postgres_data`）の保護

2. **deploy vs init の役割明確化**
   - **deploy**: 既存データ保持 + スキーママイグレーション実行
   - **init**: 完全データベースリセット + 初期データ投入
   - 条件付きデータシード（空のDBの場合のみ初期データ挿入）

3. **Docker volume管理の改善**
   - `docker-compose down -v` → `docker-compose down` でボリューム保持
   - アプリケーションコンテナのみ再作成、データベースは継続
   - node_modules等の非永続ボリュームは適切にクリーンアップ

4. **既存データ検査機能**
   - ユーザーテーブルのレコード数による既存データ判定
   - データが存在する場合はシード処理を自動スキップ
   - 初回デプロイ時のみ自動的に管理者ユーザーを作成

5. **デプロイメントコマンド体系**
   ```bash
   # データ保持デプロイ（推奨）
   ./run-deploy.sh staging
   ./run-deploy.sh production

   # 完全初期化（注意）
   ./run-deploy.sh staging init
   ./run-deploy.sh production init
   ```

6. **安全性・運用性の向上**
   - データ消失リスクの大幅削減
   - 開発・テスト環境での継続的データ蓄積が可能
   - マイグレーション実行による最新スキーマへの自動更新
   - 初期化時の明確な警告メッセージ表示

### 文書作成機能の安定性修正
1. **データベースSequence同期問題の解決**
   - PostgreSQL auto-increment sequenceが実際のIDとずれる問題を修正
   - データインポート時にsequence値が更新されない問題の根本解決
   - `dataExportImportService.ts` に `resetSequences` メソッドを実装
   - 全12テーブルの auto-increment sequence を自動的に正しい値に設定
   - インポート処理完了時の自動sequence修正機能

2. **プリズマ データベース修正**
   - 開発環境でのドキュメント作成500エラーの修正
   - `npx prisma db execute` によるsequence手動修正方法を確立
   - "Unique constraint failed on the fields: (`id`)" エラーの恒久的解決
   - backend/prisma での SQL実行によるsequence値リセット

3. **バリデーション修正**
   - タグ作成時の400エラー修正
   - `validation.ts` でタグdescriptionフィールドに `.allow('')` を追加
   - 空文字列descriptionを許可する仕様に統一
   - シーンバリデーションとの一貫性確保

### Googleログイン機能の実装
1. **OAuth認証フローの完全実装**
   - Google OAuth 2.0 による認証システム構築
   - `/api/auth/google` エンドポイントとの連携
   - JWT トークン処理とローカルストレージ管理
   - バックエンド `/auth/me` APIとの統合

2. **認証関連ページの新規作成**
   - `AuthCallback.tsx`: Google認証後のコールバック処理
   - `PendingApproval.tsx`: 管理者承認待ちユーザー向けページ
   - `AuthError.tsx`: 認証エラー時の統一エラーページ
   - React Router による適切なルーティング設定

3. **Redux State管理の拡張**
   - `authSlice.ts` に `loginSuccess` アクションを追加
   - Google認証成功時の状態管理を統一
   - localStorage でのトークン・ユーザー情報永続化
   - 既存の認証フローとの互換性維持

4. **ログイン画面の改善**
   - デモユーザー情報表示を削除
   - Googleログインボタンの追加（Material-UI Google アイコン使用）
   - エラーメッセージ表示の統一（URL パラメータ対応）
   - レスポンシブ対応のレイアウト調整

5. **環境変数・設定修正**
   - Vite環境での `process.env` エラー修正
   - 相対パス `/api/auth/google` を使用したプロキシ対応
   - フロントエンド・バックエンド間の認証連携最適化

### Ansible デプロイメント自動化の強化
1. **初期化Playbookの実装**
   - `ansible/playbooks/init.yml` の新規作成
   - `start-prod.sh --init` と同等の完全初期化機能
   - データベース強制再作成・シード実行
   - 失敗時のフォールバック管理者作成機能

2. **本番環境設定の最適化**
   - `docker-compose.prod.yml.j2` テンプレートの更新
   - 最新の安定性修正を反映（CORS設定、Prismaエンジン設定等）
   - Node.js 16対応とメモリ制限設定
   - 環境変数テンプレートの改善

3. **デプロイメント安全性の向上**
   - `run-deploy.sh` スクリプトで確認プロンプト追加
   - 環境別デプロイメントの検証機能
   - `--force-recreate` による確実なコンテナ更新
   - エラーハンドリングと状態確認の強化

## 以前の変更履歴 (2025-09-22)

### TypeScript厳密設定の復元と完全修正
1. **緊急修正項目の完全解決**
   - Express Request.user型定義問題の修正：backend/src/types/express.d.ts でモジュール拡張とグローバル名前空間の両方のアプローチを実装
   - EditorSettings型不整合の解決：DocumentEditor.tsx と SimpleMarkdownEditor.tsx でuseState型の適切な設定
   - APIパラメータ型エラーの修正：RTK Query構造の正規化（data: パラメータのネスト化）
   - Express Requestインポート問題：コントローラでのExpress Request型の明示的インポート

2. **TypeScript厳密設定の復元**
   - frontend/tsconfig.json と backend/tsconfig.json の strict モードを復元
   - "noUnusedLocals": true, "noUnusedParameters": true の再有効化
   - ビルドスクリプトからエラー抑制フラグの削除

3. **未使用変数・インポートの完全清理**
   - フロントエンド：50以上のTS6133エラーを体系的に修正
   - バックエンド：コントローラ・サービス・ミドルウェアの未使用パラメータ修正
   - 主要修正箇所：
     - store/api/*.ts: RTK Queryコールバックの未使用パラメータ削除
     - コンポーネント: Material-UI未使用インポート削除
     - バックエンドコントローラ: req → _req による意図的未使用の明示
     - auth.ts: User型不整合の解決

4. **型整合性の向上**
   - null vs undefined型の統一（TemplateCreateModal, TemplateEditModal）
   - RTK Query APIパラメータ構造の正規化
   - Prisma型定義との整合性確保

5. **ランタイムエラーの修正**
   - index.ts からの './types/express' 明示的インポート削除
   - TypeScript型定義ファイルの適切な配置確認

6. **技術的修正箇所**
   - **フロントエンド主要修正**:
     - src/pages/Dashboard.tsx: useGetAllProjectsQuery パラメータ修正
     - src/components/Editor/DocumentEditor.tsx: EditorSettings型定義修正
     - src/components/Templates/TemplateCreateModal.tsx: sceneId型修正（null → undefined）
     - src/store/api/*.ts: 7ファイルの未使用パラメータ削除
   - **バックエンド主要修正**:
     - src/controllers/*.ts: 4ファイルのExpress Request型インポート追加
     - src/middleware/auth.ts: User型不整合解決とtype assertion追加
     - src/services/userPreferenceService.ts: 非存在プロパティアクセス修正
     - src/index.ts: 実行時型インポートエラー解決

**最終結果:**
- **フロントエンド**: TypeScriptエラー 0件、Viteビルド成功
- **バックエンド**: TypeScriptエラー 0件、開発サーバー正常稼働（ポート3101）
- **型安全性**: 厳密なTypeScript設定で完全な型チェック
- **コード品質**: 未使用変数なし、本番環境デプロイ準備完了
- **開発環境**: cron jobs、health check、環境設定全て正常稼働

## 以前の変更履歴 (2025-09-20)

### 文書参照モーダルの機能強化
1. **20件制限の削除**
   - Dashboard.tsx でuseSearchDocumentsQuery の呼び出しパラメータを空オブジェクト `{}` から `{ limit: 100 }` に変更
   - バックエンドAPI（documentController.ts）でデフォルト制限が20件に設定されていたため、最大制限値100件を指定
   - DocumentViewerModal で保存されている全ての文書を参照可能に変更
   - frontend/src/pages/Dashboard.tsx:41 での修正完了

2. **プロジェクト連動表示機能**
   - useGetProjectDocumentsQuery を追加してプロジェクト固有の文書取得機能を実装
   - displayDocuments ロジックでプロジェクト選択時は該当プロジェクトの文書のみ表示
   - プロジェクト未選択時は全文書を表示する条件分岐を追加
   - frontend/src/pages/Dashboard.tsx:42-45, 122-124 での実装完了

3. **作成者名表示機能**
   - DocumentViewerModal に文書作成者名の表示機能を追加
   - creator.displayName または creator.username を優先的に表示
   - 作成日・作成者・プロジェクト情報を統合した情報表示レイアウト
   - frontend/src/components/Documents/DocumentViewerModal.tsx:242 での実装完了

4. **文書をエディタで開く機能**
   - Dashboard.tsx に documentToOpen 状態管理を追加
   - DocumentEditor.tsx に documentToOpen プロパティと useEffect による文書読み込み機能を実装
   - 文書選択時の自動プロジェクト切り替え機能
   - 使用後の状態クリア機能（100ms後に自動リセット）
   - frontend/src/pages/Dashboard.tsx:38, 112-122 および frontend/src/components/Editor/DocumentEditor.tsx:46, 59, 295-304 での実装完了

5. **技術的修正**
   - DocumentEditor.tsx で useEffect のインポート不足によるエラーを修正
   - React hooks の適切なインポート管理
   - frontend/src/components/Editor/DocumentEditor.tsx:1 での修正完了

### Ansible デプロイメント環境構築
1. **Ubuntu 24.04 対応 Ansible Playbook 実装**
   - ステージング環境：t_share9.trusted-host.online (mainブランチ)
   - 本番環境：t_share0.trusted-host.online (releaseブランチ)
   - 1GBメモリサーバー向け最適化設定

2. **システム基盤自動構築**
   - Docker & Docker Compose 自動インストール
   - Nginx リバースプロキシ設定（SSL/TLS対応）
   - PostgreSQL 15 データベース設定
   - UFW ファイアウォール設定
   - 1GB スワップファイル自動作成

3. **メモリ最適化設定**
   - PostgreSQL: shared_buffers=128MB, work_mem=4MB
   - Node.js: max_memory=256m
   - Nginx: worker_processes=1, worker_connections=512
   - Docker コンテナリソース制限設定

4. **セキュリティ強化**
   - SSL証明書自動配置（ワイルドカード証明書対応）
   - Rate limiting（API: 10r/s, Auth: 5r/s）
   - セキュリティヘッダー設定
   - ansible-vault による機密情報暗号化対応
   - Container security options（本番環境）

5. **運用・監視機能**
   - Systemd サービス統合
   - ログローテーション設定（7日保持）
   - ヘルスチェック機能
   - 自動再起動ポリシー設定

6. **Ansible ファイル構成**
   ```
   ansible/
   ├── inventory.yml              # ホスト定義
   ├── group_vars/               # 環境別設定
   ├── secrets/                  # 機密情報管理
   ├── playbooks/deploy.yml      # メインPlaybook
   └── templates/                # Jinja2テンプレート
   ```

7. **デプロイメント統合修正**
   - backend/Dockerfile のポート修正（5000 → 3101）
   - Docker Compose 本番環境設定
   - 環境変数テンプレート作成
   - Git リポジトリ統合（https://github.com/ytx/t_share.git）

### UI調整・レイアウト改善
1. **検索フィルター領域の調整**
   - TemplateSearch.tsx の検索条件レイアウト改善
   - シーン選択の最大幅を400pxに設定（maxWidth: 400）
   - 虫眼鏡、シーン選択、タグ、クリアボタンを1行に適切に配置
   - フレックスボックスレイアウトによる応答性向上

2. **プロジェクト選択機能の統合・移動**
   - Dashboard.tsx からプロジェクト選択を DocumentEditor に移動
   - ACE Editor の左上に配置し、保存・コピー・クリアボタンと同列化
   - プロジェクト選択のスタイルを検索条件のシーンと統一
   - 「プロジェクト」ラベルを削除し、minWidth: 200px を設定
   - 機能的統合による一貫したUX提供

3. **DocumentEditor アクションボタン領域の調整**
   - プロジェクト選択と保存・コピー・クリアボタンを囲む div の padding-top を 0 に設定
   - `p: 0.5` を `pt: 0, px: 0.5, pb: 0.5` に変更
   - レイアウトの密度向上とボタン領域の最適化

4. **DocumentEditor Props の拡張**
   - DocumentEditorProps に projects, onProjectChange, onOpenDocumentViewer を追加
   - プロジェクト連動機能の完全統合
   - Dashboard から DocumentEditor への責務移譲完了

### アプリケーション名変更・OAuth設定UI実装
1. **アプリケーション名変更（「Template Share」→ 「T-SHARE」）**
   - package.json（frontend/backend）のname・description更新
   - public/index.html のタイトル変更
   - Layout.tsx、MainLayout.tsx、AdminDashboard.tsx、Dashboard.tsx のヘッダ表示名変更
   - login.tsx のページタイトル変更
   - global.css のコメント更新
   - logger.ts のサービス名変更
   - dataExportImportController.ts のエクスポートファイル名変更

2. **Google OAuth設定UI実装**
   - OAuthSettings.tsx コンポーネント新規作成
   - 基本設定（有効/無効、クライアントID/シークレット、リダイレクトURI）
   - スコープ設定（推奨・追加スコープの選択UI）
   - 自動承認設定（新規ユーザーの自動承認可否）
   - 設定テスト機能・保存機能
   - セキュリティ注意事項・設定手順の表示

3. **OAuth設定バックエンドAPI実装**
   - oauthConfigController.ts 新規作成
   - GET /api/admin/oauth/google/config - 設定取得
   - PUT /api/admin/oauth/google/config - 設定更新
   - POST /api/admin/oauth/google/test - 設定テスト
   - Zodバリデーションによる入力検証
   - クライアントシークレットのマスキング機能

4. **管理画面統合**
   - AdminDashboard.tsx にOAuth設定タブ追加
   - admin.ts ルーティングにOAuth関連エンドポイント追加
   - 認証・管理者権限チェック適用

5. **認証問題修正**
   - OAuth設定コンポーネントの認証方式をlocalStorage → Redux Storeに統一
   - getAuthHeaders関数でuseSelector使用に変更
   - 他の管理コンポーネントとの認証パターン統一

## 以前の変更履歴 (2025-09-20)

### 右側パネルの垂直分割機能の実装
1. **SplitPaneを使った上下分割**
   - 右側パネルをSplitPaneで上下に分割
   - 上部：既存のDocumentEditor（保存・コピー・クリアボタン付き）
   - 下部：新しいSimpleMarkdownEditor（ボタンなし）
   - リサイザーバーでの動的サイズ調整機能

2. **SimpleMarkdownEditorコンポーネントの新規作成**
   - DocumentEditorから機能を簡素化したシンプル版
   - 保存・コピー・クリアボタンを削除
   - プロジェクト連動でlocalStorageに自動保存
   - プロジェクト切り替え時の内容自動復元
   - 500msデバウンスでの自動保存

3. **プロジェクト連動データ管理**
   - `projectEditorContent`をlocalStorageスキーマに追加
   - プロジェクトIDをキーとした内容保存・復元
   - プロジェクト未選択時の適切なプレースホルダー表示
   - リロード時の内容復元機能

4. **ACEエディタの高さ調整問題の修正**
   - MarkdownEditorコンポーネントのflexbox対応
   - Paper・Boxコンポーネントの高さ継承修正
   - SplitPaneサイズ変更に対応した動的高さ調整
   - DocumentEditorコンテナの高さ計算修正

5. **UI/UX改善**
   - 水平リサイザーのスタイル修正（縦表示 → 横表示）
   - SplitPaneのpaneStyleとresizerStyleの最適化
   - エディタコンテナのmargin・paddingの調整
   - React Router Future Flagsの追加
   - MUI Selectコンポーネントの値検証修正

6. **技術的修正**
   - 固有のeditorIdでACEエディタのID重複回避
   - flexboxレイアウトでの高さ継承チェーン修正
   - MarkdownEditor内のPaperコンポーネントpadding調整
   - overflow: 'hidden'とminHeight: 0の適切な配置

## 以前の変更履歴 (2025-09-20)

### 文書参照モーダルウィンドウの実装
1. **DocumentViewerModalコンポーネントの新規作成**
   - 保存された全文書の参照・検索・閲覧機能
   - キーワード検索機能（タイトル・内容の全文検索）
   - 文書間のナビゲーション機能（進む・戻る）
   - 文書内容の表示とスクロール機能
   - 選択した文書をエディタで開く機能

2. **キーボードショートカット対応**
   - `←` / `→`: 前後の文書に移動
   - `↑` / `↓`: 文書内容をスクロール（50pxずつ）
   - `Escape`: モーダルを閉じる
   - リアルタイムキーボードイベント処理

3. **メイン画面UIの改善**
   - ドロップダウンの左側に文書参照アイコンボタン（ViewList）を追加
   - ドロップダウンは最新20件に制限、全文書はモーダルでアクセス
   - アイコンボタンのツールチップとスタイリング
   - レスポンシブ対応のレイアウト調整

4. **検索・フィルタリング機能**
   - リアルタイム検索（タイトル・内容での部分一致）
   - 検索結果に応じた文書リストの動的更新
   - 検索結果がない場合の適切なメッセージ表示
   - 検索状態のリセット機能

### チェックボックス機能の改善
1. **新しいチェックボックス判定パターン**
   - `[?]`：モーダルでの初期状態は未チェック
   - `[*]`：モーダルでの初期状態はチェック済み
   - 従来の`[?]`パターンから2種類のパターンに拡張

2. **VariableSubstitutionModalの修正**
   - 両パターンの正しい初期状態設定
   - ラベル表示からの`[*]`パターン削除処理追加
   - プレビュー生成での両パターンの削除処理
   - チェックボックス状態管理の改善

3. **モーダルレイアウトの最適化**
   - 画面サイズに応じた動的サイズ調整（90vh）
   - 左側エリア（変数・チェックボックス）のスクロール機能
   - プレビューエリアの内部スクロール実装
   - 変数説明テキストの削除でUI簡素化
   - チェックボックス表示欄のスクロール無効化

### シーン管理システムの改善・バグ修正
1. **シーン作成400エラーの修正**
   - 400 Bad Request エラーの原因調査と修正完了
   - フロントエンドからの`color`フィールド送信問題を解決
   - バックエンドvalidationでdescriptionフィールドの空文字列許可（`.allow('')`）
   - シーンにカラー機能が不要との要件に基づき、カラー関連機能を完全削除

2. **シーン管理UI改善**
   - シーン一覧テーブルから色の列を削除
   - テーブル高さを画面サイズ応答型に変更（`calc(100vh - 300px)`）
   - フォームデータ構造の簡素化（`SceneFormData`からcolorフィールド削除）
   - Chipコンポーネントからcolor属性参照を削除

3. **エディタ保存・コピー機能の強化**
   - 保存・コピー処理のワークフロー改善
   - 先頭空行自動削除機能（`content.replace(/^\s*\n+/, '')`）
   - 保存 → 先頭空行削除 → クリップボードコピー → エディタクリア の順次実行
   - `handleSaveAndCopy`関数の処理順序最適化

4. **設定画面タブ順序の改善**
   - 設定タブの順序変更：プロジェクト → プロジェクト変数 → ユーザ変数 → エディタ
   - より論理的なワークフロー順序への調整
   - `SettingsModal.tsx`でのタブインデックス再配置

5. **技術的修正**
   - バックエンド`sceneService.ts`から色関連処理削除
   - バリデーションスキーマ`validation.ts`の更新
   - TypeScript型定義の整合性確保
   - フロントエンド・バックエンド間のデータ型統一

## 最新の変更履歴 (2025-09-19)

### タグフィルター三状態システムの実装
1. **三状態タグフィルター機能**
   - タグクリックで「未使用 → 含む → 除外 → 未使用」の状態循環
   - 含む状態：青色（primary）で表示
   - 除外状態：赤色（error）+ 取り消し線で表示
   - 未使用状態：デフォルト色（タグ固有色の薄い背景）

2. **バックエンドAPI拡張**
   - `TemplateSearchOptions`に`excludedTagIds`フィールド追加
   - 検索クエリでNOT条件による除外フィルター実装
   - バリデーションスキーマに`excludedTagIds`を追加
   - コントローラーで空文字列配列の適切な処理

3. **フロントエンド機能実装**
   - `TemplateSearch.tsx`でタグ状態管理を三状態に拡張
   - `handleTagToggle`関数で状態循環ロジック実装
   - 除外状態のタグに`textDecoration: 'line-through'`適用
   - RTK Queryで空配列送信を防ぐ処理追加

4. **localStorage対応**
   - `excludedTagFilter`フィールドをlocalStorageスキーマに追加
   - 三状態タグフィルターの永続化対応
   - リロード時の状態復元機能

5. **UI/UX改善**
   - 除外タグの視覚的判別性向上（赤色背景 + 取り消し線）
   - タグ状態の直感的理解を促進
   - フィルター条件の明確化

## 最新の変更履歴 (2025-09-19)

### シーンフィルター持続性・サーバー連携修正
1. **検索条件持続性問題の解決**
   - テンプレート検索でシーンフィルターが保存されない問題を修正
   - ヘッダー復元時の意図しない検索条件変更を防止
   - 遅延復元システム（100ms）で復元順序を制御
   - localStorage復元とヘッダー変更の適切な分離

2. **サーバー側文書保存統合**
   - Phase 3.3 文書管理機能の統合完了
   - ローカル専用保存からサーバー保存への移行
   - `useGetProjectDocumentsQuery` および `createDocument` API活用
   - 文書データのサーバー反映機能実装

3. **シーン同期動作の最適化**
   - リロード時：localStorage復元状態を維持
   - ヘッダー変更時：検索フィルターと連動
   - React re-render 対策（useRef による前回値追跡）
   - タイミング制御による復元競合回避

4. **技術的修正**
   - `TemplateSearch.tsx` でシーン同期ロジック改善
   - `DocumentEditor.tsx` でサーバー保存統合
   - `Dashboard.tsx` で `initialSceneId` 連携復元
   - デバッグログ追加・削除による問題解決

### 変数管理システムの実装
1. **ユーザ変数管理機能**
   - 設定画面にユーザ変数管理タブを追加
   - ユーザ固有の変数（{{name}}, {{email}}等）の作成・編集・削除
   - 定型文で`{{変数名}}`形式で使用可能
   - 変数の説明・用途管理

2. **プロジェクト変数管理機能**
   - 設定画面にプロジェクト変数管理タブを追加
   - プロジェクト選択式の変数管理
   - プロジェクト固有の変数設定
   - プロジェクトが選択されている場合のみ利用可能

3. **変数置換システム強化**
   - テンプレート挿入時の変数自動検出
   - ユーザ変数・プロジェクト変数の自動適用
   - VariableSubstitutionModalの改善
   - 変数ソース表示（ユーザ変数/プロジェクト変数）

### UI/UX改善
1. **設定画面の整理**
   - 管理者スイッチをユーザーアバターの右側に移動
   - SupervisorAccountアイコンを削除
   - コンテキストメニューから設定・管理者ダッシュボードを削除
   - 「全般」「外観」「通知」タブを削除
   - キーバインディングをドロップダウンに変更
   - エクスポート・インポートアイコンを削除

2. **テンプレート挿入改善**
   - 検索結果クリック時に改行を最初に挿入
   - チェックボックス機能：`[?]`パターンでモーダル設定
   - 変数・チェックボックス両方対応のモーダル表示
   - 通常の`- [ ]`はチェックボックスとして認識しない仕様

### テンプレート処理システムの修正
1. **連続クリック防止機能**
   - 3秒間の重複クリック防止機能
   - キャンセル時の即座再クリック許可
   - タイムアウト・モーダル状態の適切な管理

2. **技術的修正**
   - useEffectとuseRefを使った状態管理の最適化
   - onTemplateProcessedコールバック追加で親子間通信改善
   - モーダル再表示問題の根本的解決
   - デバッグログの追加・削除

### ACEエディタテーマ設定の実装
1. **ライト・ダークモード個別テーマ設定**
   - エディタ設定にACEエディタのテーマ選択機能を追加
   - ライトモードとダークモードで異なるテーマを設定可能
   - 従来の単純なlight/darkテーマ切り替えを廃止
   - 豊富なACEテーマオプション（ライト7種類、ダーク16種類）

2. **バックエンドAPI拡張**
   - Prismaスキーマに `editorLightTheme`, `editorDarkTheme` フィールド追加
   - `UserPreferenceService` でACEテーマ設定の保存・取得機能実装
   - データベースマイグレーション対応
   - Zodバリデーションスキーマにテーマフィールド追加

3. **フロントエンド機能実装**
   - `EditorSettingsPanel` にACEテーマ選択UI追加
   - Material-UI Selectコンポーネントでテーマ選択
   - テーマモード（light/dark）に応じた自動テーマ切り替え
   - 全ACEテーマの動的インポート対応

4. **エディタ統合**
   - `MarkdownEditor` コンポーネントでACEテーマ適用
   - `DocumentEditor` でユーザー設定との連携
   - テーマ変更の即座反映

5. **技術的修正・バグフィックス**
   - Material-UI Select undefined値エラーの修正
   - API型定義とバックエンドスキーマの整合性確保
   - Zodバリデーションによるテーマフィールド認証問題の解決
   - フロントエンド・バックエンド間のデータフロー最適化

### データエクスポート・インポート機能の実装
1. **包括的データ管理システム**
   - 全システムデータのエクスポート機能（pretty formatのJSON）
   - エクスポートしたデータからの完全システム復元機能
   - 管理画面の「データ管理」タブに統合
   - 開発・運用初期での利用を想定

2. **バックエンドAPI実装**
   - `DataExportImportService` - データベース操作を処理
   - `dataExportImportController` - REST APIエンドポイント
   - `/api/admin/data/export` - 全データエクスポート
   - `/api/admin/data/import` - データインポート
   - `/api/admin/data/stats` - エクスポート統計
   - `/api/admin/data/validate` - インポートデータ検証

3. **フロントエンド機能**
   - `DataManagementPanel` - エクスポート・インポートUI
   - 統計情報表示（ユーザー・定型文・プロジェクト・文書件数）
   - ファイル検証機能（エラー・警告表示）
   - インポートオプション（既存データクリア・ID保持）
   - プログレス表示・エラーハンドリング

4. **データ処理の安全性**
   - トランザクション内での処理実行
   - 外部キー制約の適切な管理
   - 依存関係を考慮した順序処理
   - バリデーション・エラーハンドリング
   - 全12テーブルの完全対応

### プロジェクト管理システムの実装
1. **ユーザープロジェクト管理機能**
   - プロジェクトの作成・編集・削除機能
   - 公開/非公開設定（isPublicフラグ）
   - 設定画面内にプロジェクト管理タブを追加
   - 文書数による削除制限（文書がある場合は削除不可）
   - 日本語ローカライズ対応

2. **バックエンドAPI拡張**
   - Prismaスキーマに`isPublic`フィールド追加
   - プロジェクトサービス・コントローラーの更新
   - adminModeパラメータ対応（管理者は全プロジェクト表示）
   - アクセス制御ロジック実装

3. **管理画面プロジェクト管理**
   - 管理者用プロジェクト管理画面の実装
   - `adminMode: true`で全プロジェクト表示
   - 作成者情報・文書数・公開設定の表示
   - 管理者権限での編集・削除機能

### 定型文編集機能の強化
1. **タグ作成機能**
   - 定型文編集画面でのタグ作成機能追加
   - カラーピッカー対応（デフォルト: #1976d2）
   - 作成後の自動選択機能
   - エラーハンドリング・バリデーション

2. **UI/UX改善**
   - 既存タグ選択UIを維持しつつ作成機能を統合
   - シーン作成と同様のUI構成
   - フォーム表示・非表示の切り替え
   - 作成中ローディング状態表示

### 技術的修正・改善
1. **API実装**
   - RTK Query hooksの追加（useCreateTagMutation）
   - TemplateEditModal・TemplateCreateModalにタグ作成機能統合
   - 状態管理の最適化（作成フォーム状態・エラーハンドリング）

2. **データベース・バックエンド**
   - プロジェクトスキーマ更新（Prisma）
   - adminModeに応じたプロジェクト取得ロジック
   - アクセス制御とプライバシー設定

3. **フロントエンド改善**
   - コンポーネント間の状態管理統一
   - エラー表示とローディング状態の一貫性
   - Material-UIコンポーネントの活用

### 技術的修正・バグフィックス
1. **loggerインポート修正**
   - `dataExportImportController.ts` - default importに変更
   - `dataExportImportService.ts` - default importに変更
   - バックエンドエラー「Cannot read properties of undefined」の解決

2. **管理画面統合**
   - データ管理機能を設定画面から管理画面に移動
   - 管理者権限が必要な機能として適切に配置
   - UI/UX統一とアクセス制御の改善

### 以前の変更履歴 (2025-01-19)

### 管理画面機能の実装
1. **タグ管理システム**
   - タグの追加・編集・削除機能
   - タグのマージ機能（重複タグの統合）
   - 統計情報表示（使用回数・関連テンプレート数）
   - カラーパレット対応（事前定義色 + 自由入力）
   - タブ形式のUI（一覧・マージ・統計）

2. **シーン管理システム**
   - シーンの追加・編集・削除機能
   - シーンのマージ機能（重複シーンの統合）
   - 統計情報表示（関連テンプレート数・使用状況）
   - タグ管理と同様のUI構成

3. **管理ダッシュボード**
   - 「管理者ダッシュボード」→「管理画面」に変更
   - 統計カード表示を削除してコンパクト化
   - 上部スペースを圧縮（64px → 16px）
   - テーブルのスクロール機能追加
   - SplitPaneの視認性向上（カスタムCSS）

4. **ユーザー管理システム**
   - ユーザーの追加・編集・削除機能
   - 管理者権限の設定・変更
   - パスワードハッシュ化（bcrypt）
   - バリデーション（Zod）
   - 500エラー・404エラーの修正

5. **管理者機能強化**
   - 管理者モード切替スイッチ
   - 全定型文表示 vs 公開・自分の定型文のみ表示
   - SupervisorAccountアイコン表示
   - テンプレート検索でのadminModeパラメータ対応

### バックエンドAPI拡張
1. **管理者用CRUD API**
   - `POST /api/admin/users` - ユーザー作成
   - `PUT /api/admin/users/:id` - ユーザー更新
   - `DELETE /api/admin/users/:id` - ユーザー削除
   - Zodバリデーション・エラーハンドリング強化

2. **テンプレート検索拡張**
   - adminModeパラメータ追加
   - 管理者権限による表示制御
   - バリデーションスキーマ更新

3. **データベース修正**
   - Prismaスキーマフィールド名の修正
   - `templates` → `createdTemplates`
   - `projects` → `createdProjects`

### UI/UX改善
1. **検索インターフェースの整理**
   - 定型文検索のタイトルと新規作成ボタンを削除
   - キーワード検索とタグフィルターを統合し、折りたたみ可能に
   - 検索・フィルターボタンとクリアボタンをアイコンのみに変更
   - フィルター部分のパディング・マージンを調整してコンパクト化

2. **ステータス管理の簡素化**
   - 検索条件・編集画面からステータス項目を削除
   - 定型文作成時は自動的に公開状態に設定
   - 公開スイッチは「新しいシーンを作成」ボタンの右側に配置

3. **スクロール動作の最適化**
   - ページ全体のスクロールを無効化
   - 検索結果エリアとエディタ内部でのみスクロール可能
   - ヘッダを固定位置に設定（position: fixed）
   - SplitPaneとコンテンツ高さを適切に調整

4. **テンプレート表示の改善**
   - 非公開テンプレートに赤色の背景色を追加
   - テンプレートカードの内容を全表示（スクロール無効化）
   - カード内のpタグマージンを調整

5. **エディタ改善**
   - ACEエディタの配置を調整し、保存・コピーボタンとの重複を解消
   - エディタ内スクロールを有効化
   - ボタンエリアの影を削除してフラットデザインに統一

6. **ID属性の追加**
   - 主要なdiv要素にID属性を追加（デバッグ・特定の容易化）
   - dashboard-container、main-content、search-filters-header等

### 技術的修正
- バックエンドバリデーションでテンプレート更新時の空文字列を許可
- エディタ設定でスクロールバー表示オプションを追加
- レスポンシブ対応とレイアウト調整
- RTK Query mutations の実装
- 管理者認証・認可ミドルウェアの適用