import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  type = 'text',
  ...props
}) => {
  // 禁用 number 类型输入框的滚轮功能
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (type === 'number') {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1 lg:text-sm">
          {label}
        </label>
      )}
      <input
        type={type}
        onWheel={handleWheel}
        className={`w-full px-4 py-3 min-h-[48px] text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent lg:px-3 lg:py-2 lg:min-h-[0] lg:text-base ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
