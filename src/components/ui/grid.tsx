import * as React from "react";
import { clsx } from "clsx";

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: "sm" | "md" | "lg" | "xl";
  responsive?: boolean;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = "md", responsive = true, ...props }, ref) => {
    const colsClasses = {
      1: "grid-cols-1",
      2: responsive ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2",
      3: responsive ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-3",
      4: responsive ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-4",
      5: responsive ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" : "grid-cols-5",
      6: responsive ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6" : "grid-cols-6",
      12: responsive ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12" : "grid-cols-12"
    };

    const gapClasses = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8"
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "grid",
          colsClasses[cols],
          gapClasses[gap],
          className
        )}
        {...props}
      />
    );
  }
);
Grid.displayName = "Grid";

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  gap?: "sm" | "md" | "lg" | "xl";
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ 
    className, 
    direction = "row", 
    align = "start", 
    justify = "start", 
    wrap = false,
    gap = "md",
    ...props 
  }, ref) => {
    const directionClasses = {
      row: "flex-row",
      col: "flex-col"
    };

    const alignClasses = {
      start: "items-start",
      center: "items-center", 
      end: "items-end",
      stretch: "items-stretch"
    };

    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end", 
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly"
    };

    const gapClasses = {
      sm: "gap-2",
      md: "gap-4", 
      lg: "gap-6",
      xl: "gap-8"
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "flex",
          directionClasses[direction],
          alignClasses[align],
          justifyClasses[justify],
          wrap && "flex-wrap",
          gapClasses[gap],
          className
        )}
        {...props}
      />
    );
  }
);
Flex.displayName = "Flex";

export { Grid, Flex };