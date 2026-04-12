import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending' | 'graded' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    draft: 'bg-muted text-muted-foreground',
    submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-destructive text-destructive-foreground',
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    graded: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
    default: 'bg-secondary text-secondary-foreground',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
