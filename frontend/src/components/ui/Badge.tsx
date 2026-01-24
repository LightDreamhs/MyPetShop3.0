import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant: _variant,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${className}`}
    >
      {children}
    </span>
  );
};
