import { useEffect, useCallback } from 'react';
import type { RefObject } from 'react';

/**
 * 禁用 number 类型输入框的滚轮功能
 * 使用原生 DOM 事件监听器，因为 React 的 onWheel 合成事件可能无法阻止浏览器的默认行为
 *
 * @param ref - 输入框的 ref
 * @param type - input 的 type 属性，只有 'number' 类型才禁用滚轮
 */
export function useWheelPrevention(ref: RefObject<HTMLInputElement | null>, type: string = 'number') {
  useEffect(() => {
    const input = ref.current;
    if (!input || type !== 'number') return;

    // 使用原生事件监听器，在捕获阶段阻止事件
    const handleWheel = (e: WheelEvent) => {
      // 阻止默认行为（滚轮改变数值）
      e.preventDefault();
      // 阻止事件传播
      e.stopPropagation();
      // 阻止事件冒泡到其他监听器
      e.stopImmediatePropagation();
    };

    // 使用 capture 阶段，在 React 事件处理之前拦截
    input.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    // 清理函数
    return () => {
      input.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [ref, type]);
}

/**
 * 返回一个 ref 回调函数，用于原生 input 元素
 * 直接在 JSX 中使用：ref={preventWheelRef}
 *
 * @example
 * ```tsx
 * <input
 *   ref={preventWheelRef}
 *   type="number"
 *   ...
 * />
 * ```
 */
export function usePreventWheelRef() {
  return useCallback((element: HTMLInputElement | null) => {
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    element.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    // 返回清理函数（虽然 ref 回调通常不需要清理）
    return () => {
      element.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, []);
}

/**
 * 直接为 input 元素设置滚轮防护
 * 用于原生 input 元素，需要在 input 挂载后调用
 *
 * @param input - input 元素或 null
 */
export function preventWheelOnInput(input: HTMLInputElement | null) {
  if (!input) return;

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  input.addEventListener('wheel', handleWheel, { passive: false, capture: true });
}

