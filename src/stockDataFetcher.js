const axios = require('axios');

/**
 * Yahoo Finance APIから株価データを取得
 */
class StockDataFetcher {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
  }

  /**
   * 単一銘柄の現在価格を取得
   */
  async getCurrentPrice(symbol) {
    try {
      const url = `${this.baseUrl}/${symbol}`;
      const response = await axios.get(url);
      
      const data = response.data.chart.result[0];
      const meta = data.meta;
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        symbol,
        currentPrice: currentPrice.toFixed(2),
        previousClose: previousClose.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent.toFixed(2),
        currency: meta.currency,
        marketState: meta.marketState,
        timestamp: new Date(meta.regularMarketTime * 1000)
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * 複数銘柄の現在価格を取得
   */
  async getCurrentPrices(symbols) {
    const promises = symbols.map(symbol => this.getCurrentPrice(symbol));
    const results = await Promise.all(promises);
    return results.filter(result => result !== null);
  }

  /**
   * チャート用の履歴データを取得
   */
  async getHistoricalData(symbol, period = '1mo', interval = '1d') {
    try {
      const url = `${this.baseUrl}/${symbol}?range=${period}&interval=${interval}`;
      const response = await axios.get(url);
      
      const data = response.data.chart.result[0];
      if (!data || !data.timestamp || !data.indicators || !data.indicators.quote) {
        console.warn(`No valid data found for ${symbol}`);
        return null;
      }
      
      const timestamps = data.timestamp;
      const prices = data.indicators.quote[0];
      
      if (!timestamps || !prices) {
        console.warn(`Invalid data structure for ${symbol}`);
        return null;
      }
      
      const historicalData = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000),
        open: prices.open?.[index],
        high: prices.high?.[index],
        low: prices.low?.[index],
        close: prices.close?.[index],
        volume: prices.volume?.[index]
      })).filter(item => item.close !== null && item.close !== undefined);
      
      return {
        symbol,
        data: historicalData,
        meta: data.meta
      };
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error.message);
      return null;
    }
  }
}

module.exports = StockDataFetcher;
