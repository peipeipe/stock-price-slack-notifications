const StockDataFetcher = require('./stockDataFetcher');
const ChartGenerator = require('./chartGenerator');
const SlackNotifier = require('./slackNotifier');
const config = require('./config');

// .envファイルから環境変数を読み込み
require('dotenv').config();

/**
 * メイン処理
 */
async function main() {
  console.log('Starting stock price notification bot...');
  
  // 環境変数の確認
  const slackToken = process.env.SLACK_BOT_TOKEN;
  const slackChannelId = process.env.SLACK_CHANNEL_ID;
  
  if (!slackToken || !slackChannelId) {
    console.error('Error: SLACK_BOT_TOKEN and SLACK_CHANNEL_ID must be set');
    process.exit(1);
  }

  try {
    // インスタンスの初期化
    const stockFetcher = new StockDataFetcher();
    const chartGenerator = new ChartGenerator(
      config.chartConfig.width,
      config.chartConfig.height
    );
    const slackNotifier = new SlackNotifier(slackToken, slackChannelId);

    console.log('Fetching current stock prices...');
    
    // 現在の株価データを取得
    const stockSymbols = config.stocks.map(stock => stock.symbol);
    const indexSymbols = config.indices.map(index => index.symbol);
    
    const [stockPrices, indexPrices] = await Promise.all([
      stockFetcher.getCurrentPrices(stockSymbols),
      stockFetcher.getCurrentPrices(indexSymbols)
    ]);

    console.log('Fetching historical data for charts...');
    
    // チャート用の履歴データを取得
    const historicalDataPromises = [
      ...stockSymbols.map(symbol => 
        stockFetcher.getHistoricalData(
          symbol, 
          config.chartConfig.period, 
          config.chartConfig.interval
        )
      ),
      ...indexSymbols.map(symbol => 
        stockFetcher.getHistoricalData(
          symbol, 
          config.chartConfig.period, 
          config.chartConfig.interval
        )
      )
    ];
    
    const historicalDataResults = await Promise.all(historicalDataPromises);
    const validHistoricalData = historicalDataResults.filter(data => data !== null);

    console.log('Generating charts...');
    
    // チャート画像を生成
    const images = [];
    
    // 個別銘柄のチャート
    for (const stock of config.stocks) {
      const historicalData = validHistoricalData.find(data => data.symbol === stock.symbol);
      if (historicalData) {
        const chartBuffer = await chartGenerator.generateLineChart(
          historicalData,
          `${stock.name} (${stock.symbol})`
        );
        images.push({
          buffer: chartBuffer,
          filename: `${stock.symbol.replace('.', '_')}_chart.png`,
          title: `${stock.name}の株価チャート`
        });
      }
    }

    // インデックスのチャート
    for (const index of config.indices) {
      const historicalData = validHistoricalData.find(data => data.symbol === index.symbol);
      if (historicalData) {
        const chartBuffer = await chartGenerator.generateLineChart(
          historicalData,
          `${index.name} (${index.symbol})`
        );
        images.push({
          buffer: chartBuffer,
          filename: `${index.symbol.replace('^', '').replace('.', '_')}_chart.png`,
          title: `${index.name}のチャート`
        });
      }
    }

    // 比較チャート（全銘柄）を削除
    // 個別銘柄とインデックスのチャートのみ生成

    console.log('Sending notification to Slack...');
    
    // Slackにメッセージと画像を送信
    const message = slackNotifier.formatStockMessage(stockPrices, indexPrices);
    await slackNotifier.sendMessageWithImages(message, images);

    console.log('Stock price notification completed successfully!');
    
    // 結果のサマリーを出力
    console.log(`\nSummary:`);
    console.log(`- Stock prices fetched: ${stockPrices.length}`);
    console.log(`- Index prices fetched: ${indexPrices.length}`);
    console.log(`- Charts generated: ${images.length}`);
    console.log(`- Slack notification sent successfully`);

  } catch (error) {
    console.error('Error in main process:', error);
    
    // エラーが発生した場合もSlackに通知
    try {
      const slackNotifier = new SlackNotifier(slackToken, slackChannelId);
      await slackNotifier.sendErrorMessage(error);
    } catch (slackError) {
      console.error('Failed to send error notification to Slack:', slackError);
    }
    
    process.exit(1);
  }
}

// プロセス終了時のハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// メイン処理を実行
if (require.main === module) {
  main();
}

module.exports = { main };
