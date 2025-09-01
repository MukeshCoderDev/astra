// Placeholder component for live streaming functionality
interface LiveBadgeProps {
  status?: 'live' | 'upcoming' | 'ended';
  variant?: 'live' | 'upcoming' | 'ended';
  isLive?: boolean;
  isUpcoming?: boolean;
  text?: string;
  className?: string;
}

function LiveBadge({ 
  status, 
  variant, 
  isLive, 
  isUpcoming, 
  text, 
  className 
}: LiveBadgeProps) {
  // Determine the actual status from various prop patterns
  let actualStatus: 'live' | 'upcoming' | 'ended' = 'ended';
  
  if (status) {
    actualStatus = status;
  } else if (variant) {
    actualStatus = variant;
  } else if (isLive) {
    actualStatus = 'live';
  } else if (isUpcoming) {
    actualStatus = 'upcoming';
  } else {
    actualStatus = 'live'; // Default to live when no props provided
  }

  const colors = {
    live: 'bg-red-500 text-white',
    upcoming: 'bg-amber-500 text-white',
    ended: 'bg-gray-500 text-white'
  };

  const displayText = text || actualStatus.toUpperCase();

  return (
    <span 
      className={`px-2 py-1 text-xs font-semibold rounded ${colors[actualStatus]} ${className || ''}`}
      role="status"
      aria-label={`Stream status: ${actualStatus}`}
    >
      {displayText}
    </span>
  );
}

export default LiveBadge;
export { LiveBadge };