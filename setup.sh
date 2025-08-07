#!/bin/bash

echo "🚀 株価通知bot セットアップスクリプト"
echo "======================================"

# Node.js のバージョンチェック
echo "Node.js バージョンを確認中..."
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Node.js がインストールされていません"
    echo "Node.js 18以上をインストールしてください: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js バージョン: $node_version"

# npm の依存関係をインストール
echo ""
echo "📦 依存関係をインストール中..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依存関係のインストールに失敗しました"
    exit 1
fi

echo "✅ 依存関係のインストールが完了しました"

# 設定確認
echo ""
echo "⚙️  設定確認"
echo "以下のGitHub Secretsを設定してください:"
echo "1. SLACK_BOT_TOKEN - SlackボットのOAuthトークン"
echo "2. SLACK_CHANNEL_ID - 投稿先のSlackチャンネルID"

echo ""
echo "📋 Slackアプリの設定手順:"
echo "1. https://api.slack.com/apps でアプリを作成"
echo "2. OAuth & Permissions で以下のスコープを追加:"
echo "   - chat:write"
echo "   - files:write"
echo "3. ボットトークンを取得してGitHub Secretsに設定"
echo "4. アプリをワークスペースにインストール"

echo ""
echo "🧪 テスト実行"
echo "ローカルでテストするには:"
echo "export SLACK_BOT_TOKEN='your-bot-token'"
echo "export SLACK_CHANNEL_ID='your-channel-id'"
echo "npm start"

echo ""
echo "✅ セットアップ完了!"
echo "GitHub Actionsは毎日15:30(JST)に自動実行されます"
