// 東京市場（日本株）営業日判定ユーティリティ
// 目的: 土日および日本の祝日はSlack投稿をスキップする

const JapaneseHolidays = require('japanese-holidays');

/**
 * 指定日が日本の祝日か
 * @param {Date} date JSTベースの日付（ローカルTZでも可）
 * @returns {boolean}
 */
function isJapanHoliday(date) {
  // ライブラリはUTCでも内部で年/月/日基準で判定するのでそのまま渡す
  const holiday = JapaneseHolidays.isHoliday(date);
  return !!holiday; // null/undefined -> false
}

/**
 * 指定日が週末(土日)か
 * @param {Date} date 
 * @returns {boolean}
 */
function isWeekend(date) {
  const day = date.getDay(); // 0:日,6:土
  return day === 0 || day === 6;
}

/**
 * 東京市場が休場日か（週末 or 日本祝日）
 * @param {Date} date (default: 現在 JST )
 * @returns {boolean}
 */
function isMarketClosed(date = new Date()) {
  // JSTに正規化（念のため）
  const jst = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
  );
  return isWeekend(jst) || isJapanHoliday(jst);
}

/**
 * 休場理由のメッセージを返す（休場でない場合はnull）
 * @param {Date} date 
 * @returns {string|null}
 */
function getMarketClosedReason(date = new Date()) {
  const jst = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
  );
  if (isWeekend(jst)) {
    return '本日は土日（市場休場）です';
  }
  const holiday = JapaneseHolidays.isHoliday(jst);
  if (holiday) {
    return `本日は日本の祝日「${holiday.name}」のため市場は休場です`;
  }
  return null;
}

module.exports = {
  isJapanHoliday,
  isWeekend,
  isMarketClosed,
  getMarketClosedReason
};
