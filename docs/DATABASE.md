# データベース定義書

T-SHAREアプリケーションのデータベース構造定義

## 概要

- **RDBMS**: PostgreSQL 15
- **ORM**: Prisma
- **文字セット**: UTF-8
- **タイムゾーン**: UTC（アプリケーション層でJST変換）

## テーブル一覧

| テーブル名 | 論理名 | 説明 |
|-----------|--------|------|
| users | ユーザー | ユーザーアカウント情報 |
| scenes | シーン | 定型文の利用シーン分類 |
| tags | タグ | 定型文のタグ |
| projects | プロジェクト | ユーザープロジェクト |
| templates | 定型文 | 定型文の本体 |
| template_versions | 定型文バージョン | 定型文の履歴管理 |
| template_tags | 定型文タグ関連 | 定型文とタグの多対多リレーション |
| template_usage | 定型文使用履歴 | 定型文の使用統計 |
| user_variables | ユーザ変数 | ユーザー固有の変数 |
| project_variables | プロジェクト変数 | プロジェクト固有の変数 |
| documents | 文書 | プロジェクト文書・個人メモ |
| user_preferences | ユーザー設定 | UI・エディタ設定 |

---

## 1. users（ユーザー）

ユーザーアカウント情報を管理

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | ユーザーID（主キー） |
| email | VARCHAR | NO | - | メールアドレス（一意） |
| username | VARCHAR | YES | NULL | ユーザー名 |
| display_name | VARCHAR | YES | NULL | 表示名 |
| avatar_url | VARCHAR | YES | NULL | プロフィール画像URL（Google OAuth） |
| google_id | VARCHAR | YES | NULL | Google ID（一意） |
| password_hash | VARCHAR | YES | NULL | パスワードハッシュ（bcrypt） |
| is_admin | BOOLEAN | NO | false | 管理者フラグ |
| approval_status | VARCHAR | NO | 'pending' | 承認ステータス（pending/approved） |
| applied_at | TIMESTAMP | NO | now() | 登録申請日時 |
| approved_at | TIMESTAMP | YES | NULL | 承認日時 |
| approved_by | INT | YES | NULL | 承認者ID（外部キー: users.id） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

### インデックス
- PRIMARY KEY: `id`
- UNIQUE: `email`
- UNIQUE: `google_id`

### リレーション
- `approved_by` → `users.id`（承認者）
- 1:N → `templates`（作成した定型文）
- 1:N → `scenes`（作成したシーン）
- 1:N → `tags`（作成したタグ）
- 1:N → `projects`（作成したプロジェクト）
- 1:N → `template_usage`（定型文使用履歴）
- 1:N → `user_variables`（ユーザ変数）
- 1:N → `project_variables`（作成したプロジェクト変数）
- 1:N → `documents`（作成した文書）
- 1:1 → `user_preferences`（ユーザー設定）
- 1:N → `template_versions`（作成したバージョン）

---

## 2. scenes（シーン）

定型文の利用シーン分類

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | シーンID（主キー） |
| name | VARCHAR | NO | - | シーン名 |
| description | TEXT | YES | NULL | 説明 |
| created_by | INT | NO | - | 作成者ID（外部キー: users.id） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

### インデックス
- PRIMARY KEY: `id`

### リレーション
- `created_by` → `users.id`（作成者）
- 1:N → `templates`（このシーンの定型文）

---

## 3. tags（タグ）

定型文のタグ

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | タグID（主キー） |
| name | VARCHAR | NO | - | タグ名（一意） |
| description | TEXT | YES | NULL | 説明 |
| color | VARCHAR | YES | NULL | カラーコード（#RRGGBB） |
| created_by | INT | NO | - | 作成者ID（外部キー: users.id） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |

### インデックス
- PRIMARY KEY: `id`
- UNIQUE: `name`

### リレーション
- `created_by` → `users.id`（作成者）
- 1:N → `template_tags`（定型文との関連）

---

## 4. projects（プロジェクト）

ユーザープロジェクト

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | プロジェクトID（主キー） |
| name | VARCHAR | NO | - | プロジェクト名 |
| description | TEXT | YES | NULL | 説明 |
| is_public | BOOLEAN | NO | true | 公開フラグ |
| color | VARCHAR | NO | '#1976d2' | ヘッダーカラー（#RRGGBB） |
| created_by | INT | NO | - | 作成者ID（外部キー: users.id） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

### インデックス
- PRIMARY KEY: `id`

### リレーション
- `created_by` → `users.id`（作成者）
- 1:N → `project_variables`（プロジェクト変数）
- 1:N → `documents`（プロジェクト文書）

---

## 5. templates（定型文）

定型文の本体

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | 定型文ID（主キー） |
| title | VARCHAR | NO | - | タイトル |
| content | TEXT | NO | - | 内容 |
| description | TEXT | YES | NULL | 説明 |
| scene_id | INT | YES | NULL | シーンID（外部キー: scenes.id） |
| status | VARCHAR | NO | 'draft' | ステータス（draft/published） |
| is_public | BOOLEAN | NO | true | 公開フラグ |
| created_by | INT | NO | - | 作成者ID（外部キー: users.id） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

### インデックス
- PRIMARY KEY: `id`

### リレーション
- `created_by` → `users.id`（作成者）
- `scene_id` → `scenes.id`（シーン）
- 1:N → `template_tags`（タグ関連）
- 1:N → `template_versions`（バージョン履歴）
- 1:N → `template_usage`（使用履歴）

---

## 6. template_versions（定型文バージョン）

定型文の履歴管理

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | バージョンID（主キー） |
| template_id | INT | NO | - | 定型文ID（外部キー: templates.id） |
| version_number | INT | NO | - | バージョン番号 |
| title | VARCHAR | NO | - | タイトル |
| content | TEXT | NO | - | 内容 |
| description | TEXT | YES | NULL | 説明 |
| scene_id | INT | YES | NULL | シーンID |
| status | VARCHAR | NO | - | ステータス |
| created_by | INT | NO | - | 作成者ID（外部キー: users.id） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |

### インデックス
- PRIMARY KEY: `id`
- UNIQUE: `(template_id, version_number)`

### リレーション
- `template_id` → `templates.id`（CASCADE削除）
- `created_by` → `users.id`（作成者）

---

## 7. template_tags（定型文タグ関連）

定型文とタグの多対多リレーション

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | ID（主キー） |
| template_id | INT | NO | - | 定型文ID（外部キー: templates.id） |
| tag_id | INT | NO | - | タグID（外部キー: tags.id） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |

### インデックス
- PRIMARY KEY: `id`
- UNIQUE: `(template_id, tag_id)`

### リレーション
- `template_id` → `templates.id`（CASCADE削除）
- `tag_id` → `tags.id`（CASCADE削除）

---

## 8. template_usage（定型文使用履歴）

定型文の使用統計

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | ID（主キー） |
| template_id | INT | NO | - | 定型文ID（外部キー: templates.id） |
| user_id | INT | NO | - | ユーザーID（外部キー: users.id） |
| usage_count | INT | NO | 0 | 使用回数 |
| last_used_at | TIMESTAMP | NO | now() | 最終使用日時 |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

### インデックス
- PRIMARY KEY: `id`
- UNIQUE: `(template_id, user_id)`

### リレーション
- `template_id` → `templates.id`（CASCADE削除）
- `user_id` → `users.id`（CASCADE削除）

---

## 9. user_variables（ユーザ変数）

ユーザー固有の変数（定型文内で`{{変数名}}`形式で使用）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | ID（主キー） |
| user_id | INT | NO | - | ユーザーID（外部キー: users.id） |
| name | VARCHAR | NO | - | 変数名 |
| value | TEXT | NO | - | 変数値 |
| description | TEXT | YES | NULL | 説明 |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

### インデックス
- PRIMARY KEY: `id`
- UNIQUE: `(user_id, name)`

### リレーション
- `user_id` → `users.id`（CASCADE削除）

---

## 10. project_variables（プロジェクト変数）

プロジェクト固有の変数（定型文内で`{{変数名}}`形式で使用）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | ID（主キー） |
| project_id | INT | NO | - | プロジェクトID（外部キー: projects.id） |
| name | VARCHAR | NO | - | 変数名 |
| value | TEXT | NO | - | 変数値 |
| description | TEXT | YES | NULL | 説明 |
| created_by | INT | NO | - | 作成者ID（外部キー: users.id） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

### インデックス
- PRIMARY KEY: `id`
- UNIQUE: `(project_id, name)`

### リレーション
- `project_id` → `projects.id`（CASCADE削除）
- `created_by` → `users.id`（作成者）

### 特殊変数
システムが自動管理するポート番号変数（プロジェクト編集時に自動作成）：

| 変数名 | 用途 | ポート範囲 |
|-------|------|-----------|
| FRONTEND_PORT | フロントエンド | 3200-3299 |
| BACKEND_PORT | バックエンド | 4200-4299 |
| DB_PORT | データベース | 5200-5299 |

---

## 11. documents（文書）

プロジェクト文書・個人メモ

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | 文書ID（主キー） |
| project_id | INT | YES | NULL | プロジェクトID（外部キー: projects.id） |
| title | VARCHAR | YES | NULL | タイトル |
| content | TEXT | NO | - | 内容 |
| content_markdown | TEXT | NO | - | マークダウン内容 |
| created_by | INT | NO | - | 作成者ID（外部キー: users.id） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

### インデックス
- PRIMARY KEY: `id`

### リレーション
- `project_id` → `projects.id`（プロジェクト）
- `created_by` → `users.id`（作成者）

### 特殊文書
タイトルによる用途識別：

| タイトルパターン | 用途 | アクセス制御 |
|----------------|------|------------|
| `[PROJECT_SHARED]_{project_id}` | プロジェクト内共有文書 | プロジェクトメンバー全員 |
| `[PERSONAL_MEMO]_{user_id}` | 個人メモ | 作成者のみ |

---

## 12. user_preferences（ユーザー設定）

UI・エディタ設定

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | INT | NO | AUTO_INCREMENT | ID（主キー） |
| user_id | INT | NO | - | ユーザーID（外部キー: users.id、一意） |
| theme | VARCHAR | NO | 'light' | テーマ（light/dark） |
| editor_keybinding | VARCHAR | NO | 'default' | キーバインディング（default/vim/emacs） |
| editor_show_line_numbers | BOOLEAN | NO | true | 行番号表示 |
| editor_word_wrap | BOOLEAN | NO | true | ワードラップ |
| editor_show_whitespace | BOOLEAN | NO | false | 空白文字表示 |
| editor_light_theme | VARCHAR | NO | 'github' | ACEエディタライトテーマ |
| editor_dark_theme | VARCHAR | NO | 'monokai' | ACEエディタダークテーマ |
| editor_font_size | INT | NO | 14 | フォントサイズ（px） |
| panel_split_ratio | FLOAT | NO | 0.5 | 左パネル比率（0.0-1.0） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

### インデックス
- PRIMARY KEY: `id`
- UNIQUE: `user_id`

### リレーション
- `user_id` → `users.id`（CASCADE削除）

### ACEエディタテーマ一覧

**ライトテーマ（8種類）**:
- github, tomorrow, chrome, eclipse, textmate, xcode, katzenmilch, kuroir

**ダークテーマ（17種類）**:
- monokai, dracula, twilight, vibrant_ink, cobalt, tomorrow_night, tomorrow_night_blue, tomorrow_night_bright, tomorrow_night_eighties, idle_fingers, kr_theme, merbivore, merbivore_soft, mono_industrial, pastel_on_dark, solarized_dark, terminal

---

## ER図（主要リレーション）

```
users (1) ----< (N) templates
users (1) ----< (N) scenes
users (1) ----< (N) tags
users (1) ----< (N) projects
users (1) ----< (N) user_variables
users (1) ---- (1) user_preferences

projects (1) ----< (N) project_variables
projects (1) ----< (N) documents

scenes (1) ----< (N) templates

templates (N) ----< (N) tags (via template_tags)
templates (1) ----< (N) template_versions
templates (1) ----< (N) template_usage

users (1) ----< (N) template_usage
```

---

## データベース初期化・マイグレーション

### 初期化
```bash
# Prisma マイグレーション適用
cd backend
npx prisma migrate dev

# シードデータ投入
npx prisma db seed
```

### マイグレーション作成
```bash
# スキーマ変更後
npx prisma migrate dev --name migration_name
```

### Prisma Client再生成
```bash
npx prisma generate
```

---

## バックアップ・リストア

### エクスポート
管理画面の「データ管理」タブからJSONエクスポート可能

### インポート
管理画面からJSONファイルをインポート可能
- カテゴリ別インポート対応（ユーザー/シーン・定型文/プロジェクト・文書/システム設定）
- ID保持オプション
- 既存データクリアオプション

---

## 制約・注意事項

1. **外部キー制約**: 全リレーションで適切なCASCADE設定
2. **ユニーク制約**: email, google_id, tag.name, user_variable名, project_variable名など
3. **タイムスタンプ**: 全テーブルでcreated_at, updated_atを自動管理
4. **論理削除**: 実装なし（物理削除のみ）
5. **トランザクション**: Prismaトランザクション機能を使用
6. **文字エンコーディング**: UTF-8
7. **タイムゾーン**: UTCで保存、アプリケーション層でJST変換
