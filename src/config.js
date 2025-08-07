// 株価監視対象の設定
module.exports = {
  // 監視対象の株式銘柄（環境変数から取得、フォールバック付き）
  stocks: (() => {
    console.log('STOCK_SYMBOLS環境変数:', process.env.STOCK_SYMBOLS ? 'あり' : 'なし');
    if (process.env.STOCK_SYMBOLS) {
      console.log('STOCK_SYMBOLS値:', process.env.STOCK_SYMBOLS);
      try {
        const parsed = JSON.parse(process.env.STOCK_SYMBOLS);
        console.log('パース成功:', parsed);
        return parsed;
      } catch (error) {
        console.error('STOCK_SYMBOLS JSONパースエラー:', error.message);
        console.log('デフォルト設定を使用します');
      }
    }
    console.log('デフォルト株式設定を使用');
    return [
      {
        symbol: '7203.T',        // トヨタ自動車
        name: 'トヨタ自動車',
        market: '東証プライム'
      },
      {
        symbol: '6098.T',        // リクルートホールディングス
        name: 'リクルートHD',
        market: '東証プライム'
      }
    ];
  })(),
  
  // インデックス（環境変数から取得、フォールバック付き）
  indices: process.env.INDEX_SYMBOLS ? 
    JSON.parse(process.env.INDEX_SYMBOLS) : 
    [
      {
        symbol: '^N225',         // 日経平均
        name: '日経平均株価'
      },
      {
        symbol: '^TPX',          // TOPIX
        name: 'TOPIX'
      }
    ],
  
  // チャート設定
  chartConfig: {
    width: 800,
    height: 400,
    period: '1mo',             // 1ヶ月間のデータ
    interval: '1d'             // 日次データ
  }
};
