/**
 * 输入框事件处理工具
 */

/**
 * 为原生 input 元素创建 ref 回调，禁用滚轮功能
 * 这是原生 input 元素的推荐用法
 *
 * @example
 * ```tsx
 * <input
 *   ref={createPreventWheelRef()}
 *   type="number"
 *   ...
 * />
 * ```
 */
export function createPreventWheelRef() {
  return (element: HTMLInputElement | null) => {
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    element.addEventListener('wheel', handleWheel, { passive: false, capture: true });
  };
}

/**
 * 阻止输入框的滚轮事件（禁用滚轮改变数值）
 *
 * @deprecated 此方法基于 React 合成事件，可能不够可靠
 * 推荐使用 createPreventWheelRef() 或 Input 组件
 * @param e - 滚轮事件对象
 */
export function preventWheelChange(e: React.WheelEvent<HTMLInputElement>) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * 为原生 input 元素创建 props 对象，包含禁用滚轮的处理器
 *
 * @deprecated 此方法基于 React 合成事件，可能不够可靠
 * 推荐使用 createPreventWheelRef() 或 Input 组件
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
