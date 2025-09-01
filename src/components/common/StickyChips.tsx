import { clsx } from 'clsx';
import { useKeyboardNavigation } from '../../hooks/useAccessibility';
import { useRef, useEffect } from 'react';

export interface Chip {
  id: string;
  label: string;
  value: string;
}

interface StickyChipsProps {
  chips: Chip[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function StickyChips({ 
  chips, 
  active, 
  onChange, 
  className,
  ariaLabel = "Filter options"
}: StickyChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = chips.findIndex(chip => chip.value === active);

  // Keyboard navigation for horizontal chip selection
  const handleArrowLeft = () => {
    const currentIndex = chips.findIndex(chip => chip.value === active);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : chips.length - 1;
    onChange(chips[newIndex].value);
  };

  const handleArrowRight = () => {
    const currentIndex = chips.findIndex(chip => chip.value === active);
    const newIndex = currentIndex < chips.length - 1 ? currentIndex + 1 : 0;
    onChange(chips[newIndex].value);
  };

  useKeyboardNavigation(
    undefined, // onEnter
    undefined, // onEscape
    undefined, // onArrowUp
    undefined, // onArrowDown
    handleArrowLeft,
    handleArrowRight
  );

  // Scroll active chip into view
  useEffect(() => {
    if (containerRef.current && activeIndex >= 0) {
      const activeButton = containerRef.current.children[activeIndex] as HTMLElement;
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeIndex]);

  return (
    <div className={clsx(
      'sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b',
      className
    )}>
      <div className="container mx-auto px-4 py-3">
        <div 
          ref={containerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label={ariaLabel}
        >
          {chips.map((chip, index) => (
            <button
              key={chip.id}
              onClick={() => onChange(chip.value)}
              className={clsx(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                active === chip.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}
              role="tab"
              aria-selected={active === chip.value}
              aria-controls={`content-${chip.value}`}
              tabIndex={active === chip.value ? 0 : -1}
              aria-label={`Filter by ${chip.label}${active === chip.value ? ', currently selected' : ''}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}