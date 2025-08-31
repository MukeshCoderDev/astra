import * as React from "react";
import { clsx } from "clsx";

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  caption?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, caption, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, children, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={clsx("w-full caption-bottom text-sm", className)}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        {...props}
      >
        {caption && <caption className="mt-4 text-sm text-muted-foreground">{caption}</caption>}
        {children}
      </table>
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={clsx("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={clsx("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={clsx(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={clsx(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | 'none';
  onSort?: () => void;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable = false, sortDirection = 'none', onSort, children, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (sortable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onSort?.();
      }
    };

    const content = (
      <>
        {children}
        {sortable && (
          <span className="ml-2 inline-flex flex-col">
            <span 
              className={clsx(
                "text-xs leading-none",
                sortDirection === 'asc' ? 'text-foreground' : 'text-muted-foreground'
              )}
              aria-hidden="true"
            >
              ▲
            </span>
            <span 
              className={clsx(
                "text-xs leading-none",
                sortDirection === 'desc' ? 'text-foreground' : 'text-muted-foreground'
              )}
              aria-hidden="true"
            >
              ▼
            </span>
          </span>
        )}
      </>
    );

    if (sortable) {
      return (
        <th
          ref={ref}
          className={clsx(
            "h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            className
          )}
          tabIndex={0}
          role="columnheader button"
          aria-sort={sortDirection === 'none' ? undefined : sortDirection === 'asc' ? 'ascending' : 'descending'}
          onClick={onSort}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {content}
        </th>
      );
    }

    return (
      <th
        ref={ref}
        className={clsx(
          "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
          className
        )}
        {...props}
      >
        {content}
      </th>
    );
  }
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={clsx("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  className?: string;
}

const TablePagination = React.forwardRef<HTMLDivElement, TablePaginationProps>(
  ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems, className }, ref) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div
        ref={ref}
        className={clsx("flex items-center justify-between px-2 py-4", className)}
        role="navigation"
        aria-label="Table pagination"
      >
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go to previous page"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go to next page"
          >
            Next
          </button>
        </div>
      </div>
    );
  }
);
TablePagination.displayName = "TablePagination";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TablePagination,
};