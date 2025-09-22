# T-SHARE Ansible Deployment

Ubuntu 24.04環境でT-SHAREアプリケーションのステージング・本番環境を構築するためのAnsible Playbookです。

## 前提条件

- Ansible 2.14+ がインストールされていること
- ターゲットサーバーへのSSH公開鍵認証が設定済みであること
- SSL証明書が `~/valut/certs/trusted-host.online/cur/` に配置されていること
- SSH秘密鍵が `~/valut/ssh/4each.pem` に配置されていること
- 1GBメモリのUbuntu 24.04サーバー

## ディレクトリ構成

```
ansible/
├── inventory.yml              # ホスト定義
├── group_vars/
│   ├── all.yml               # 共通設定
│   ├── staging.yml           # ステージング環境設定
│   └── production.yml        # 本番環境設定
├── secrets/
│   ├── staging_secrets.yml.example
│   ├── production_secrets.yml.example
│   └── README.md
├── playbooks/
│   └── deploy.yml            # メインPlaybook
├── templates/
│   ├── docker-compose.yml.j2 # Docker Compose設定
│   ├── .env.j2               # 環境変数設定
│   ├── nginx.conf.j2         # Nginx設定
│   ├── logrotate.j2          # ログローテーション
│   └── systemd/
│       └── t-share.service.j2 # Systemdサービス
└── README.md                 # このファイル
```

## 初期セットアップ

### 1. 機密情報設定

```bash
# 機密情報ファイルを作成
cd ansible/secrets
cp staging_secrets.yml.example staging_secrets.yml
cp production_secrets.yml.example production_secrets.yml

# 実際の値を設定
vim staging_secrets.yml
vim production_secrets.yml

# （オプション）暗号化
ansible-vault encrypt staging_secrets.yml
ansible-vault encrypt production_secrets.yml
```

### 2. SSL証明書配置

以下のファイルが `~/valut/certs/trusted-host.online/cur/` に配置されていることを確認：
- `server.crt` - SSL証明書本体
- `ca.crt` - CA中間証明書
- `nopass.key` - 秘密鍵（パスキーなし）

**重要**: ワイルドカード証明書のため、ステージング・本番環境どちらでも使用可能

### 3. SSH秘密鍵設定

SSH秘密鍵が正しく配置されていることを確認：
```bash
# 秘密鍵のパーミッション設定
chmod 600 ~/valut/ssh/4each.pem

# 接続テスト
ansible all -i inventory.yml -m ping
```

## デプロイメント

### ステージング環境

```bash
# 通常実行
ansible-playbook -i inventory.yml playbooks/deploy.yml --limit staging

# Vault使用時
ansible-playbook -i inventory.yml playbooks/deploy.yml --limit staging --ask-vault-pass
```

### 本番環境

```bash
# 通常実行
ansible-playbook -i inventory.yml playbooks/deploy.yml --limit production

# Vault使用時
ansible-playbook -i inventory.yml playbooks/deploy.yml --limit production --ask-vault-pass
```

### 両環境同時

```bash
ansible-playbook -i inventory.yml playbooks/deploy.yml --ask-vault-pass
```

## 環境情報

### サーバー情報
- **ステージング**: t-share9.trusted-host.online (mainブランチ)
- **本番**: t-share0.trusted-host.online (releaseブランチ)
- **SSH接続**: ubuntu ユーザー、~/valut/ssh/4each.pem 秘密鍵

### アプリケーション構成
- **フロントエンド**: React + Vite
- **バックエンド**: Node.js + Express
- **データベース**: PostgreSQL 15
- **Webサーバー**: Nginx (リバースプロキシ)
- **コンテナ**: Docker + Docker Compose

### リソース最適化
- **PostgreSQL**: shared_buffers=128MB, work_mem=4MB
- **Node.js**: max_memory=256m
- **Nginx**: worker_processes=1
- **スワップ**: 1GB (自動作成)

## 運用コマンド

### サービス管理
```bash
# サービス状態確認
sudo systemctl status t-share

# サービス再起動
sudo systemctl restart t-share

# ログ確認
sudo journalctl -u t-share -f
```

### Docker操作
```bash
# コンテナ状態確認
sudo docker-compose ps

# ログ確認
sudo docker-compose logs -f

# 再起動
sudo docker-compose restart
```

### ログ場所
- **アプリケーション**: `/mnt/data/logs/`
- **Nginx**: `/mnt/data/logs/nginx/`
- **システム**: `journalctl -u t-share`

## トラブルシューティング

### 1. デプロイメント失敗
```bash
# 詳細ログで実行
ansible-playbook -i inventory.yml playbooks/deploy.yml --limit staging -vvv
```

### 2. SSL証明書エラー
```bash
# 証明書確認
sudo nginx -t
sudo systemctl status nginx
```

### 3. メモリ不足
```bash
# メモリ使用量確認
free -h
sudo docker stats

# スワップ確認
sudo swapon --show
```

### 4. データベース接続エラー
```bash
# PostgreSQL確認
sudo docker-compose exec postgres psql -U t_share_user -d t_share_db
```

## 機密情報設定ガイド

### Google OAuth設定
Google Cloud Consoleで取得した認証情報を設定：

1. **Google OAuth Client ID/Secret**:
   ```yaml
   vault_staging_google_client_id: "your_client_id.apps.googleusercontent.com"
   vault_staging_google_client_secret: "your_client_secret"
   ```

2. **承認済みリダイレクトURI**:
   - ステージング: `https://t-share9.trusted-host.online/api/auth/google/callback`
   - 本番: `https://t-share0.trusted-host.online/api/auth/google/callback`

### JWT Secret設定
強力なランダム文字列を生成（64文字推奨）：
```bash
# Node.jsで生成
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSLで生成
openssl rand -hex 64
```

### データベースパスワード
PostgreSQL用の強力なパスワードを設定：
```yaml
vault_staging_db_password: "your_secure_db_password"
```

## セキュリティ機能

- UFW ファイアウォール設定
- SSL/TLS 暗号化（ワイルドカード証明書）
- Rate limiting (Nginx)
- Container security options
- Secret管理 (ansible-vault対応)

## パフォーマンス監視

### ヘルスチェック
- **ステージング**: `https://t-share9.trusted-host.online/health`
- **本番**: `https://t-share0.trusted-host.online/health`
- **応答**: "healthy"

### メトリクス確認
```bash
# システムリソース
htop
sudo docker stats

# ディスク使用量
df -h
du -sh /mnt/data/*
```

## 更新手順

1. **コード更新**: リポジトリから最新版を取得
2. **再デプロイ**: Playbookを再実行
3. **ヘルスチェック**: アプリケーションの動作確認
4. **モニタリング**: ログとメトリクスの確認

## サポート

問題が発生した場合は、以下の情報を収集してください：

1. エラーメッセージ
2. システムログ (`journalctl -u t-share`)
3. Dockerログ (`docker-compose logs`)
4. システムリソース (`free -h`, `df -h`)

---

**注意**: 本番環境での作業前は必ずステージング環境でテストを実施してください。