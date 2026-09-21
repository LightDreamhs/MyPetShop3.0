/**
 * 金额与数量输入/展示的统一工具。
 *
 * 全链路约定：金额在数据库与接口中以"分"（整数）存储，输入框中以"元"字符串展示。
 * 设计原则（键盘优先）：
 * - 输入框 type="text" + inputMode（decimal/numeric），移动端弹数字键盘，桌面端无 spinner；
 * - onChange 用正则放行输入中间态（"5."、"5.6" 等），不重排用户已输入内容；
 * - onBlur 只做"元→分"换算，不把输入串强制格式化成两位小数——
 *   用户输 5 就显示 5，输 5.68 就显示 5.68，后端拿到的是换算后的分。
 */

/** 金额输入正则：空串、纯整数、带最多两位小数（含 "5." 输入中间态） */
export const MONEY_INPUT_RE = /^\d*\.?\d{0,2}$/;

/** 数量输入正则：空串或纯数字 */
export const INTEGER_INPUT_RE = /^\d*$/;

/**
 * 元字符串 → 分。空串/无效输入返回 null，由调用方决定回退值。
 * "5" → 500，"5.6" → 560，"5.68" → 568，"5.689" → 568（Math.round 截到两位）。
 */
export const yuanInputToCents = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '.') return null;
  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * 100);
};

/**
 * 分 → 元显示串（去尾零），用于输入框回显与只读金额展示。
 * 500 → "5"，568 → "5.68"，1250 → "12.5"，-350 → "-3.5"，0 → "0"。
 */
export const formatYuan = (cents: number): string =>
  Number((cents / 100).toFixed(2)).toString();

/**
 * 分 → 元显示串（去尾零），0 显示为空串，用于"可留空"的输入框回显/自动填充。
 */
export const centsToYuanInput = (cents: number): string =>
  cents === 0 ? '' : formatYuan(cents);

/**
 * 金额输入框 onBlur 的统一收尾：
 * 换算成"分"交给调用方，同时返回一个轻度清理后的输入串（去尾部孤立小数点、去多余前导零），
 * 不强制补齐两位小数。无效输入返回 null（调用方清空）。
 *
 * 返回 { cents, display }；display 保留用户输入的有效形态（0 → "0"）。
 */
export const settleMoneyInput = (
  value: string
): { cents: number; display: string } | null => {
  const cents = yuanInputToCents(value);
  if (cents === null) return null;
  // 显示串由分反推（去尾零），同时消除 "05"、"5." 这类中间态
  return { cents, display: formatYuan(cents) };
};
