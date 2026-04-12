import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Card({ title, children, action, className = '' }: CardProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-6 shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
