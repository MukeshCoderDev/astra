import * as React from "react";
import { clsx } from "clsx";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6", 
      lg: "h-8 w-8"
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "animate-spin rounded-full border-2 border-muted border-t-primary",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = "md", 
  text = "Loading...", 
  className 
}) => {
  return (
    <div className={clsx("flex items-center justify-center gap-2", className)}>
      <LoadingSpinner size={size} />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
};

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "animate-pulse rounded-md bg-muted",
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

export { Loading, LoadingSpinner, Skeleton };