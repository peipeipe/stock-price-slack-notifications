const { WebClient } = require('@slack/web-api');
const fs = require('fs');

/**
 * Slackに通知を送信するクラス
 */
class SlackNotifier {
  constructor(token, channelId) {
    this.client = new WebClient(token);
    this.channelId = channelId;
  }

  /**
   * 株価情報のテキストメッセージを生成
   */
  formatStockMessage(stockData, indexData) {
    const now = new Date();
    const timeString = now.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let message = `📈 *株価情報* (${timeString})\n\n`;

    // インデックス情報
    if (indexData && indexData.length > 0) {
      message += '*📊 主要指数*\n';
      indexData.forEach(data => {
        const changeIcon = parseFloat(data.change) >= 0 ? '📈' : '📉';
        const changeColor = parseFloat(data.change) >= 0 ? '+' : '';
        message += `${changeIcon} *${data.symbol}*: ¥${parseFloat(data.currentPrice).toLocaleString()} `;
        message += `(${changeColor}${data.change} / ${changeColor}${data.changePercent}%)\n`;
      });
      message += '\n';
    }

    // 個別銘柄情報
    if (stockData && stockData.length > 0) {
      message += '*🏢 個別銘柄*\n';
      stockData.forEach(data => {
        const changeIcon = parseFloat(data.change) >= 0 ? '📈' : '📉';
        const changeColor = parseFloat(data.change) >= 0 ? '+' : '';
        message += `${changeIcon} *${data.symbol}*: ¥${parseFloat(data.currentPrice).toLocaleString()} `;
        message += `(${changeColor}${data.change} / ${changeColor}${data.changePercent}%)\n`;
      });
    }

    return message;
  }

  /**
   * テキストメッセージを送信
   */
  async sendMessage(text) {
    try {
      const result = await this.client.chat.postMessage({
        channel: this.channelId,
        text: text,
        mrkdwn: true
      });
      console.log('Message sent successfully:', result.ts);
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * 画像ファイルをアップロード（改良版）
   */
  async uploadImage(imageBuffer, filename, title) {
    try {
      // バッファーサイズをチェック
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('画像バッファーが空です');
      }
      
      console.log(`画像アップロード開始: ${filename} (${imageBuffer.length} bytes)`);
      
      // バッファの内容をチェック（PNGヘッダーの確認）
      const pngHeader = imageBuffer.slice(0, 8);
      const expectedHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const isValidPNG = pngHeader.equals(expectedHeader);
      
      console.log(`PNG形式チェック: ${isValidPNG ? '有効' : '無効'}`);
      console.log(`ヘッダー: ${pngHeader.toString('hex')}`);
      
      if (!isValidPNG) {
        throw new Error('無効なPNG形式です');
      }
      
      // 一時ファイルとして保存
      const tempFilePath = `/tmp/${filename}`;
      fs.writeFileSync(tempFilePath, imageBuffer);

      // ファイルサイズをチェック
      const stats = fs.statSync(tempFilePath);
      console.log(`一時ファイル作成: ${tempFilePath} (${stats.size} bytes)`);
      
      if (stats.size !== imageBuffer.length) {
        throw new Error(`ファイルサイズが一致しません: ${stats.size} != ${imageBuffer.length}`);
      }

      // Slack API v2を使用してアップロード
      console.log('Slack APIでアップロード中...');
      const result = await this.client.files.uploadV2({
        channel_id: this.channelId,
        file: tempFilePath,
        filename: filename,
        title: title
      });

      // 一時ファイルを削除
      fs.unlinkSync(tempFilePath);

      console.log('画像アップロード成功:', result.file?.id || 'uploaded');
      
      // アップロード結果の詳細ログ
      if (result.file) {
        console.log('アップロードファイル情報:');
        console.log(`  ID: ${result.file.id}`);
        console.log(`  名前: ${result.file.name}`);
        console.log(`  サイズ: ${result.file.size}`);
        console.log(`  MIME: ${result.file.mimetype}`);
      }
      
      return result;
    } catch (error) {
      console.error('画像アップロードエラー:', error.message);
      
      // より詳細なエラー情報を出力
      if (error.data) {
        console.error('Slack API エラー詳細:', JSON.stringify(error.data, null, 2));
      }
      
      throw error;
    }
  }

  /**
   * メッセージと画像を同時に送信
   */
  async sendMessageWithImages(text, images) {
    try {
      // まずテキストメッセージを送信
      await this.sendMessage(text);

      // 各画像を順次アップロード
      for (const image of images) {
        try {
          await this.uploadImage(image.buffer, image.filename, image.title);
          // 連続投稿を避けるため少し待機
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (imageError) {
          console.error(`画像 ${image.filename} のアップロードに失敗:`, imageError.message);
          
          // 個別の画像エラーは警告として扱い、処理を続行
          await this.sendMessage(`⚠️ 画像「${image.title}」のアップロードに失敗しました`);
        }
      }

      console.log('すべてのメッセージと画像の送信が完了しました');
    } catch (error) {
      console.error('メッセージと画像の送信中にエラー:', error);
      throw error;
    }
  }

  /**
   * エラーメッセージを送信
   */
  async sendErrorMessage(error) {
    const errorMessage = `❌ *株価取得エラー*\n\n` +
      `エラー内容: ${error.message}\n` +
      `時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`;

    try {
      await this.sendMessage(errorMessage);
    } catch (slackError) {
      console.error('Error sending error message to Slack:', slackError);
    }
  }
}

module.exports = SlackNotifier;
