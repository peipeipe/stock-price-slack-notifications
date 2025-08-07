// 株価監視対象の設定
module.exports = {
  // 監視対象の株式銘柄（環境変数から取得、フォールバック付き）
  stocks: process.env.STOCK_SYMBOLS ? 
    JSON.parse(process.env.STOCK_SYMBOLS) : 
    [
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
    ],
  
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
