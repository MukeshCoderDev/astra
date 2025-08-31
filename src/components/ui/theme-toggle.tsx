import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "../../providers/ThemeProvider";

const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      {...props}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
});
ThemeToggle.displayName = "ThemeToggle";

export { ThemeToggle };