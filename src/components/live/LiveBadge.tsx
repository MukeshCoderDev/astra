import { clsx } from 'clsx';

/**
 * Props for LiveBadge component
 */
interface LiveBadgeProps {
  /** Badge variant - determines color and text */
  variant?: 'live' | 'upcoming' | 'ended';
  /** Additional CSS classes */
  className?: string;
  /** Custom text override */
  text?: string;
}

/**
 * Live status badge component
 * Displays status indicators for live streams with appropriate colors
 */
export default function LiveBadge({ 
  variant = 'live', 
  className,
  text 
}: LiveBadgeProps) {
  const getBadgeConfig = () => {
    switch (variant) {
      case 'live':
        return {
          text: text || 'LIVE',
          bgColor: 'bg-red-600',
          textColor: 'text-white',
          ariaLabel: 'Currently live streaming'
        };
      case 'upcoming':
        return {
          text: text || 'UPCOMING',
          bgColor: 'bg-amber-500',
          textColor: 'text-white',
          ariaLabel: 'Scheduled live stream'
        };
      case 'ended':
        return {
          text: text || 'ENDED',
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          ariaLabel: 'Live stream has ended'
        };
      default:
        return {
          text: text || 'LIVE',
          bgColor: 'bg-red-600',
          textColor: 'text-white',
          ariaLabel: 'Live stream status'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span 
      className={clsx(
        'inline-flex items-center justify-center',
        'text-[10px] font-semibold',
        'rounded px-1.5 py-0.5',
        'leading-none',
        config.bgColor,
        config.textColor,
        className
      )}
      aria-label={config.ariaLabel}
      role="status"
    >
      {config.text}
    </span>
  );
}