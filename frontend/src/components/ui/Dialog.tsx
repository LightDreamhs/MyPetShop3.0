import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// 全局对话框计数器
let dialogCount = 0;
const dialogInstances = new Set<number>();

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  const dialogId = useRef<number>(dialogCount++);

  // 同步更新 isOpenRef
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      dialogInstances.add(dialogId.current);
    } else {
      dialogInstances.delete(dialogId.current);
    }
  }, [isOpen, dialogId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 只在对话框打开时检查点击外部
      if (!isOpenRef.current) return;

      // 确保对话框已渲染
      if (!dialogRef.current) {
        return;
      }

      // 检查点击是否在对话框内部
      if (dialogRef.current.contains(event.target as Node)) {
        return;
      }

      // 检查是否是最上层的对话框（z-index 最大）
      const maxDialogId = Math.max(...Array.from(dialogInstances));
      if (dialogId.current !== maxDialogId) {
        // 不是最上层的对话框，不关闭
        return;
      }

      // 是最上层的对话框，且点击在外部，关闭
      onClose();
    };

    // 移除了 ESC 键处理，避免与页面的 ESC 键处理冲突
    // 页面会按正确顺序关闭多层对话框

    if (isOpen) {
      // 使用 setTimeout 确保 DOM 完全渲染后再添加事件监听
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'hidden';
      }, 0);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm bg-gray-900/30 transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={dialogRef}
          className={`bg-white rounded-lg shadow-2xl w-full max-w-full mx-auto overflow-y-auto pointer-events-auto transform transition-all ${sizeClasses[size]}`}
        >
          <div className="flex items-center justify-between px-4 py-4 lg:px-6 lg:py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded active:scale-95 lg:p-1"
              type="button"
              aria-label="关闭"
            >
              <X size={24} />
            </button>
          </div>
          <div className="px-4 py-4 lg:px-6 lg:py-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
