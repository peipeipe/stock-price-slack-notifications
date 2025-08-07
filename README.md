# Stock Price Slack Bot

GitHub Actionsを使用してSlackに株価情報を自動投稿するbotです。

## 機能

- 毎日15:30（JST）に株価データを取得
- テキスト形式での株価情報表示
- 株価チャート画像の生成・投稿
- Slackへの自動投稿

## セットアップ

### 1. GitHub Secretsの設定

以下のシークレットを設定してください：

**必須設定:**
- `SLACK_BOT_TOKEN`: SlackボットのOAuthトークン
- `SLACK_CHANNEL_ID`: 投稿先のSlackチャンネルID

**オプション設定（銘柄をプライベートにしたい場合）:**
- `STOCK_SYMBOLS`: 監視する株式銘柄（JSON形式）
- `INDEX_SYMBOLS`: 監視するインデックス（JSON形式）

#### 銘柄設定の例:
```json
STOCK_SYMBOLS:
[
  {
    "symbol": "7974.T",
    "name": "任天堂",
    "market": "東証プライム"
  },
  {
    "symbol": "6501.T",
    "name": "日立製作所",
    "market": "東証プライム"
  }
]

INDEX_SYMBOLS:
[
  {
    "symbol": "^N225",
    "name": "日経平均株価"
  },
  {
    "symbol": "^TPX", 
    "name": "TOPIX"
  }
]
```

### 2. Slackアプリの作成

1. [Slack API](https://api.slack.com/apps)でアプリを作成
2. OAuth & Permissions で以下のスコープを追加：
   - `chat:write`
   - `files:write`
3. ボットトークンを取得してGitHub Secretsに設定

### 3. 株価銘柄の設定

**方法1: GitHub Secrets（推奨・プライベート）**
GitHub Secretsで `STOCK_SYMBOLS` と `INDEX_SYMBOLS` を設定

**方法2: コード内設定（パブリック）**
`src/config.js` で直接設定（環境変数が未設定の場合のデフォルト値: トヨタ自動車、リクルートHD、日経平均、TOPIX）

## ローカルテスト

### 依存関係のインストール

```bash
npm install
```

### 環境変数の設定

1. `.env.example` を `.env` にコピー：
```bash
cp .env.example .env
```

2. `.env` ファイルを編集して実際の値を設定：
```env
SLACK_BOT_TOKEN=xoxb-your-actual-slack-bot-token
SLACK_CHANNEL_ID=C1234567890
```

### テスト実行

環境変数を読み込んでローカル実行：
```bash
# 方法1: exportで環境変数を設定
export SLACK_BOT_TOKEN='your-bot-token'
export SLACK_CHANNEL_ID='your-channel-id'
npm start

# 方法2: .envファイルを使用（dotenvパッケージが必要）
source .env && npm start

# 方法3: 1回だけの実行
SLACK_BOT_TOKEN='your-token' SLACK_CHANNEL_ID='your-channel' npm start
```

### デバッグモード

詳細なログを確認したい場合：
```bash
DEBUG=* npm start
```

## 使用技術

- Node.js
- GitHub Actions
- Slack Web API
- **Sharp + SVG** (チャート生成) ← Chart.jsからSVGベースに変更
- Yahoo Finance API (株価データ取得)

## トラブルシューティング

### よくある問題

1. **依存関係のインストールエラー**
   ```bash
   # macOS
   npm install
   
   # Ubuntu/Debian (GitHub Actions環境)
   sudo apt-get install libvips-dev
   ```

2. **Slack APIエラー**
   - ボットトークンが正しいか確認
   - チャンネルIDが正しいか確認
   - ボットがチャンネルに招待されているか確認

3. **株価データ取得エラー**
   - インターネット接続を確認
   - Yahoo Finance APIの制限に引っかかっていないか確認
   - 銘柄コードが正しいか確認（7203.T、6098.T など）

### ログの確認

実行時のログでエラーの詳細を確認できます：
```bash
npm start 2>&1 | tee debug.log
```

### チャート画像について

- **SVGベースの高品質チャート**: 30KB以上の詳細な画像
- **価格変動に応じた色分け**: 上昇（緑）、下降（赤）
- **完全な日本語対応**: グリッド線、ラベル、変動率表示
- **安定した画像生成**: SVG + Sharpによる確実な描画

### GitHub Actionsでの実行

Ubuntu環境での依存関係：
```bash
sudo apt-get install libvips-dev
```

## FAQ

**Q: GitHub Actionsでのスケジュール実行が動作しない**
A: `.github/workflows/stock-notification.yml` ファイルでcron設定を確認してください。

**Q: 複数の銘柄を追加したい**
A: `src/config.js` の `stocks` 配列に新しい銘柄を追加してください。
