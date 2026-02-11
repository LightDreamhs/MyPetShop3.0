/**
 * 日期格式化工具函数
 */

/**
 * 获取当前本地时间的 datetime-local 格式字符串 (yyyy-MM-ddTHH:mm)
 * @returns 格式化后的当前时间字符串
 */
export function getCurrentLocalDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 将本地日期时间转换为字符串格式 (yyyy-MM-dd HH:mm:ss)
 * @param date - 日期对象或日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function getLocalDateTimeString(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 将本地日期转换为字符串格式 (yyyy-MM-dd)
 * @param date - 日期对象或日期字符串
 * @returns 格式化后的日期字符串
 */
export function getLocalDateString(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
