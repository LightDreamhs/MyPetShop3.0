/**
 * 表单验证工具函数
 */

/**
 * 验证价格输入是否有效
 * @param value - 输入值
 * @param allowZero - 是否允许为零值，默认为 false
 * @returns 验证结果对象
 */
export function validatePrice(value: string, allowZero: boolean = false): {
  isValid: boolean;
  error: string;
  numericValue?: number;
} {
  // 移除前后空格
  const trimmedValue = value.trim();

  // 检查是否为空
  if (!trimmedValue) {
    return { isValid: false, error: '价格不能为空' };
  }

  // 检查是否为有效数字
  const numericValue = parseFloat(trimmedValue);

  if (isNaN(numericValue)) {
    return { isValid: false, error: '请输入有效的数字' };
  }

  // 检查是否为负数
  if (numericValue < 0) {
    return { isValid: false, error: '价格不能为负数' };
  }

  // 检查是否为零（如果不允许）
  if (!allowZero && numericValue === 0) {
    return { isValid: false, error: '价格不能为零' };
  }

  // 检查小数位数
  const decimalPlaces = trimmedValue.includes('.')
    ? trimmedValue.split('.')[1].length
    : 0;

  if (decimalPlaces > 2) {
    return { isValid: false, error: '价格最多保留两位小数' };
  }

  return { isValid: true, error: '', numericValue };
}

/**
 * 验证数量输入是否有效
 * @param value - 输入值
 * @param allowZero - 是否允许为零值，默认为 true
 * @returns 验证结果对象
 */
export function validateQuantity(value: string, allowZero: boolean = true): {
  isValid: boolean;
  error: string;
  numericValue?: number;
} {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { isValid: false, error: '数量不能为空' };
  }

  const numericValue = parseInt(trimmedValue, 10);

  if (isNaN(numericValue)) {
    return { isValid: false, error: '请输入有效的整数' };
  }

  if (numericValue < 0) {
    return { isValid: false, error: '数量不能为负数' };
  }

  if (!allowZero && numericValue === 0) {
    return { isValid: false, error: '数量不能为零' };
  }

  return { isValid: true, error: '', numericValue };
}
