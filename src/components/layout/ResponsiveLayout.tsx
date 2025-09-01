import React from 'react';
import { clsx } from 'clsx';
import { useAccessibilityContext } from '../../providers/AccessibilityProvider';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Responsive layout component that provides consistent spacing and breakpoints
 */
export function ResponsiveLayout({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
  spacing = 'md'
}: ResponsiveLayoutProps) {
  const { prefersReducedMotion } = useAccessibilityContext();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  };

  const spacingClasses = {
    none: '',
    sm: 'space-y-2 sm:space-y-4',
    md: 'space-y-4 sm:space-y-6 lg:space-y-8',
    lg: 'space-y-6 sm:space-y-8 lg:space-y-12'
  };

  return (
    <div
      className={clsx(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        spacingClasses[spacing],
        prefersReducedMotion && 'reduced-motion',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg';
  minItemWidth?: string;
}

/**
 * Responsive grid component with flexible column configuration
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'md',
  minItemWidth
}: ResponsiveGridProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  const getGridCols = () => {
    const classes = [];
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);
    
    return classes.join(' ');
  };

  const gridStyle = minItemWidth ? {
    gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`
  } : undefined;

  return (
    <div
      className={clsx(
        'grid',
        !minItemWidth && getGridCols(),
        gapClasses[gap],
        className
      )}
      style={gridStyle}
    >
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal' | 'responsive';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  wrap?: boolean;
}

/**
 * Responsive stack component for flexible layouts
 */
export function ResponsiveStack({
  children,
  className,
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  spacing = 'md',
  wrap = false
}: ResponsiveStackProps) {
  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row',
    responsive: 'flex-col sm:flex-row'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const spacingClasses = {
    none: '',
    sm: direction === 'horizontal' ? 'gap-2 sm:gap-3' : 'space-y-2 sm:space-y-3',
    md: direction === 'horizontal' ? 'gap-4 sm:gap-6' : 'space-y-4 sm:space-y-6',
    lg: direction === 'horizontal' ? 'gap-6 sm:gap-8' : 'space-y-6 sm:space-y-8'
  };

  return (
    <div
      className={clsx(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        spacingClasses[spacing],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'primary' | 'destructive';
  align?: 'left' | 'center' | 'right' | 'justify';
  responsive?: boolean;
}

/**
 * Responsive text component with consistent typography
 */
export function ResponsiveText({
  children,
  className,
  size = 'base',
  weight = 'normal',
  color = 'default',
  align = 'left',
  responsive = true
}: ResponsiveTextProps) {
  const sizeClasses = responsive ? {
    xs: 'text-responsive-xs',
    sm: 'text-responsive-sm',
    base: 'text-responsive-base',
    lg: 'text-responsive-lg',
    xl: 'text-responsive-xl',
    '2xl': 'text-xl sm:text-2xl lg:text-3xl',
    '3xl': 'text-2xl sm:text-3xl lg:text-4xl',
    '4xl': 'text-3xl sm:text-4xl lg:text-5xl'
  } : {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const colorClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    primary: 'text-primary',
    destructive: 'text-destructive'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  };

  return (
    <span
      className={clsx(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        className
      )}
    >
      {children}
    </span>
  );
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centerContent?: boolean;
  fluid?: boolean;
}

/**
 * Responsive container component with consistent max-widths and centering
 */
export function ResponsiveContainer({
  children,
  className,
  size = 'full',
  centerContent = true,
  fluid = false
}: ResponsiveContainerProps) {
  const sizeClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full'
  };

  return (
    <div
      className={clsx(
        'w-full',
        !fluid && sizeClasses[size],
        centerContent && 'mx-auto',
        'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}

// Export all components
export {
  ResponsiveLayout as default,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveText,
  ResponsiveContainer
};