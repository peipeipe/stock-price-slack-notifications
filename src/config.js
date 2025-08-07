// 株価監視対象の設定
module.exports = {
  // 監視対象の株式銘柄（Yahoo Finance Symbol）
  stocks: [
    {
      symbol: '215A.T',        // タイミー
      name: 'タイミー',
      market: '東証グロース'
    }
  ],
  
  // インデックス
  indices: [
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
