const sharp = require('sharp');

/**
 * SVG + Sharp を使用した株価チャート生成クラス
 */
class ChartGenerator {
  constructor(width = 800, height = 400) {
    this.width = width;
    this.height = height;
    
    // フォント設定の確認（開発/デバッグ用）
    this.checkFontSupport();
  }

  /**
   * フォントサポートの確認（Linux環境での日本語フォント確認）
   */
  checkFontSupport() {
    const os = require('os');
    const platform = os.platform();
    
    console.log(`Platform: ${platform}`);
    
    if (platform === 'linux') {
      console.log('Linux環境での日本語フォント確認');
      try {
        const { execSync } = require('child_process');
        const fontList = execSync('fc-list :lang=ja family', { encoding: 'utf8' });
        console.log('利用可能な日本語フォント:');
        console.log(fontList.split('\n').slice(0, 5).join('\n')); // 最初の5個を表示
      } catch (error) {
        console.log('フォント確認中にエラー:', error.message);
      }
    }
  }

  /**
   * 株価の線グラフチャートを生成
   */
  async generateLineChart(historicalData, title) {
    try {
      console.log(`SVGチャート生成開始: ${title}`);
      console.log(`データポイント数: ${historicalData.data.length}`);
      
      const data = historicalData.data || [];
      if (data.length === 0) {
        throw new Error('データが空です');
      }
      
      const prices = data.map(item => item.close);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      console.log(`価格範囲: ${minPrice} - ${maxPrice}`);
      
      // 価格の変動を色で表現
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const isPositive = lastPrice >= firstPrice;
      const lineColor = isPositive ? '#10B981' : '#EF4444';
      const fillColor = isPositive ? '#10B981' : '#EF4444';
      
      // マージン設定
      const margin = { top: 80, right: 40, bottom: 60, left: 100 };
      const chartWidth = this.width - margin.left - margin.right;
      const chartHeight = this.height - margin.top - margin.bottom;
      
      // データポイントの座標を計算
      const points = data.map((item, index) => {
        const x = margin.left + (chartWidth / (data.length - 1)) * index;
        const normalizedPrice = (item.close - minPrice) / (maxPrice - minPrice);
        const y = margin.top + chartHeight - (normalizedPrice * chartHeight);
        return { x, y, price: item.close, date: item.date };
      });
      
      // グリッド線の生成
      const gridLines = [];
      const gridCount = 5;
      for (let i = 0; i <= gridCount; i++) {
        const y = margin.top + (chartHeight / gridCount) * i;
        gridLines.push(`<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}"/>`);
        
              // Y軸ラベル
      for (let i = 0; i <= gridCount; i++) {
        const y = margin.top + (chartHeight / gridCount) * i;
        gridLines.push(`<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}"/>`);
        
        // Y軸ラベル
        const price = maxPrice - (maxPrice - minPrice) * (i / gridCount);
        gridLines.push(`<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-family="'Noto Sans CJK JP', 'Hiragino Sans', Arial, sans-serif" font-size="11" fill="#374151">¥${Math.round(price).toLocaleString()}</text>`);
      }
      }
      
      // X軸グリッドとラベル
      const xGridLines = [];
      const labelCount = Math.min(data.length, 8);
      for (let i = 0; i < labelCount; i++) {
        const dataIndex = Math.floor((data.length - 1) * i / (labelCount - 1));
        const x = margin.left + (chartWidth / (labelCount - 1)) * i;
        
        xGridLines.push(`<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartHeight}"/>`);
        
        // X軸ラベル
        const label = data[dataIndex].date ? 
          data[dataIndex].date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) :
          `Day ${dataIndex + 1}`;
        xGridLines.push(`<text x="${x}" y="${margin.top + chartHeight + 25}" text-anchor="middle" font-family="'Noto Sans CJK JP', 'Hiragino Sans', Arial, sans-serif" font-size="11" fill="#374151">${label}</text>`);
      }
      
      // データ線のパス生成
      const linePath = points.map((point, index) => 
        index === 0 ? `M${point.x},${point.y}` : `L${point.x},${point.y}`
      ).join(' ');
      
      // 塗りつぶしエリアのパス生成
      const areaPath = `M${points[0].x},${margin.top + chartHeight} ` + 
        points.map(point => `L${point.x},${point.y}`).join(' ') + 
        ` L${points[points.length - 1].x},${margin.top + chartHeight} Z`;
      
      // データポイントの円
      const circles = points.map(point => 
        `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${lineColor}" stroke="#FFFFFF" stroke-width="2"/>`
      ).join('\n');
      
      // 変動情報
      const change = lastPrice - firstPrice;
      const changePercent = ((change / firstPrice) * 100).toFixed(2);
      const changeText = `${isPositive ? '+' : ''}¥${Math.round(change).toLocaleString()} (${changePercent}%)`;
      
      // SVG作成
      const svg = `
        <svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${fillColor};stop-opacity:0.3"/>
              <stop offset="100%" style="stop-color:${fillColor};stop-opacity:0.1"/>
            </linearGradient>
          </defs>
          
          <!-- 背景 -->
          <rect width="${this.width}" height="${this.height}" fill="#FFFFFF"/>
          
          <!-- タイトル -->
          <text x="${this.width / 2}" y="40" text-anchor="middle" font-family="'Noto Sans CJK JP', 'Hiragino Sans', Arial, sans-serif" font-size="20" font-weight="bold" fill="#1F2937">
            ${title}
          </text>
          
          <!-- グリッド線 -->
          <g stroke="#E5E7EB" stroke-width="1" opacity="0.8">
            ${gridLines.join('\n')}
            ${xGridLines.join('\n')}
          </g>
          
          <!-- 外枠 -->
          <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
                fill="none" stroke="#9CA3AF" stroke-width="2"/>
          
          <!-- 塗りつぶしエリア -->
          <path d="${areaPath}" fill="url(#areaGradient)"/>
          
          <!-- データ線 -->
          <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="3"/>
          
          <!-- データポイント -->
          ${circles}
          
          <!-- 変動情報 -->
          <text x="${this.width - 20}" y="60" text-anchor="end" font-family="'Noto Sans CJK JP', 'Hiragino Sans', Arial, sans-serif" font-size="14" font-weight="bold" fill="${lineColor}">
            ${changeText}
          </text>
          
          <!-- 現在価格 -->
          <text x="${this.width - 20}" y="80" text-anchor="end" font-family="'Noto Sans CJK JP', 'Hiragino Sans', Arial, sans-serif" font-size="12" fill="#374151">
            現在価格: ¥${Math.round(lastPrice).toLocaleString()}
          </text>
        </svg>
      `;
      
      console.log('SVGをPNGに変換中...');
      
      // フォント設定を含むオプション
      const sharpOptions = {
        density: 150, // DPIを高く設定してより鮮明に
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // 白背景を明示的に設定
      };
      
      const buffer = await sharp(Buffer.from(svg), sharpOptions)
        .png({
          quality: 95, // PNG品質を高く設定
          compressionLevel: 6
        })
        .toBuffer();
      
      console.log(`SVGチャート生成成功: ${title}, サイズ: ${buffer.length} bytes`);
      return buffer;
      
    } catch (error) {
      console.error('SVGチャート生成エラー:', error);
      console.error('エラーの詳細:', error.stack);
      throw error;
    }
  }

  /**
   * 複数銘柄の比較チャートを生成
   */
  async generateComparisonChart(multipleHistoricalData, title) {
    try {
      console.log(`SVG比較チャート生成開始: ${title}`);
      
      if (multipleHistoricalData.length === 0) {
        throw new Error('比較データが空です');
      }
      
      const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'
      ];
      
      // 全データの価格範囲を計算
      let allPrices = [];
      multipleHistoricalData.forEach(data => {
        allPrices = allPrices.concat(data.data.map(item => item.close));
      });
      
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      
      // マージン設定
      const margin = { top: 120, right: 40, bottom: 60, left: 100 };
      const chartWidth = this.width - margin.left - margin.right;
      const chartHeight = this.height - margin.top - margin.bottom;
      
      // 凡例の生成
      const legends = multipleHistoricalData.map((data, index) => {
        const color = colors[index % colors.length];
        const legendX = 50 + (index * 120);
        const legendY = 60;
        
        return `
          <line x1="${legendX}" y1="${legendY}" x2="${legendX + 20}" y2="${legendY}" stroke="${color}" stroke-width="3"/>
          <text x="${legendX + 25}" y="${legendY + 4}" font-family="'Noto Sans CJK JP', 'Hiragino Sans', Arial, sans-serif" font-size="12" fill="#374151">
            ${data.symbol || `銘柄${index + 1}`}
          </text>
        `;
      }).join('\n');
      
      // 各データセットの線を生成
      const dataLines = multipleHistoricalData.map((data, index) => {
        const color = colors[index % colors.length];
        const prices = data.data.map(item => item.close);
        const dataLength = prices.length;
        
        const points = prices.map((price, i) => {
          const x = margin.left + (chartWidth / (dataLength - 1)) * i;
          const normalizedPrice = (price - minPrice) / (maxPrice - minPrice);
          const y = margin.top + chartHeight - (normalizedPrice * chartHeight);
          return { x, y };
        });
        
        const linePath = points.map((point, i) => 
          i === 0 ? `M${point.x},${point.y}` : `L${point.x},${point.y}`
        ).join(' ');
        
        const circles = points.map(point => 
          `<circle cx="${point.x}" cy="${point.y}" r="2" fill="${color}"/>`
        ).join('\n');
        
        return `
          <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2"/>
          ${circles}
        `;
      }).join('\n');
      
      // グリッド線の生成
      const gridLines = [];
      const gridCount = 5;
      for (let i = 0; i <= gridCount; i++) {
        const y = margin.top + (chartHeight / gridCount) * i;
        gridLines.push(`<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}"/>`);
        
        const price = maxPrice - (maxPrice - minPrice) * (i / gridCount);
        gridLines.push(`<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-family="'Noto Sans CJK JP', 'Hiragino Sans', Arial, sans-serif" font-size="11" fill="#374151">¥${Math.round(price).toLocaleString()}</text>`);
      }
      
      const svg = `
        <svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
          <!-- 背景 -->
          <rect width="${this.width}" height="${this.height}" fill="#FFFFFF"/>
          
          <!-- タイトル -->
          <text x="${this.width / 2}" y="30" text-anchor="middle" font-family="'Noto Sans CJK JP', 'Hiragino Sans', Arial, sans-serif" font-size="18" font-weight="bold" fill="#1F2937">
            ${title}
          </text>
          
          <!-- 凡例 -->
          ${legends}
          
          <!-- グリッド線 -->
          <g stroke="#E5E7EB" stroke-width="1" opacity="0.8">
            ${gridLines.join('\n')}
          </g>
          
          <!-- 外枠 -->
          <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
                fill="none" stroke="#9CA3AF" stroke-width="2"/>
          
          <!-- データ線 -->
          ${dataLines}
        </svg>
      `;
      
      console.log('比較チャートをPNGに変換中...');
      
      // フォント設定を含むオプション
      const sharpOptions = {
        density: 150, // DPIを高く設定してより鮮明に
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // 白背景を明示的に設定
      };
      
      const buffer = await sharp(Buffer.from(svg), sharpOptions)
        .png({
          quality: 95, // PNG品質を高く設定
          compressionLevel: 6
        })
        .toBuffer();
      
      console.log(`SVG比較チャート生成成功: ${title}, サイズ: ${buffer.length} bytes`);
      return buffer;
      
    } catch (error) {
      console.error('SVG比較チャート生成エラー:', error);
      throw error;
    }
  }
}

module.exports = ChartGenerator;
