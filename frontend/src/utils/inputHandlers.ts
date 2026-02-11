/**
 * 输入框事件处理工具
 */

/**
 * 阻止输入框的滚轮事件（禁用滚轮改变数值）
 * @param e - 滚轮事件对象
 */
export function preventWheelChange(e: React.WheelEvent<HTMLInputElement>) {
  e.preventDefault();
}

/**
 * 为原生 input 元素创建 props 对象，包含禁用滚轮的处理器
 * @param existingProps - 已有的 props
 * @returns 包含滚轮处理的新 props
 */
export function withWheelPrevention<T extends React.InputHTMLAttributes<HTMLInputElement>>(
  existingProps: T = {} as T
): T & { onWheel: (e: React.WheelEvent<HTMLInputElement>) => void } {
  return {
    ...existingProps,
    onWheel: preventWheelChange,
  };
}
