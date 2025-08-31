import { Eye, EyeOff, AlertTriangle, Ban } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ContentVisibilityBadgeProps {
  status: 'public' | 'unlisted' | 'under_review' | 'dmca_hidden' | 'draft';
  className?: string;
}

const STATUS_CONFIG = {
  public: {
    label: 'Public',
    icon: Eye,
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  unlisted: {
    label: 'Unlisted',
    icon: EyeOff,
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
  draft: {
    label: 'Draft',
    icon: EyeOff,
    variant: 'outline' as const,
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  },
  under_review: {
    label: 'Under Review',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  },
  dmca_hidden: {
    label: 'DMCA Hidden',
    icon: Ban,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  },
};

export function ContentVisibilityBadge({ status, className = '' }: ContentVisibilityBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} flex items-center space-x-1`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}

interface ContentModerationNoticeProps {
  status: 'under_review' | 'dmca_hidden';
  reason?: string;
  appealUrl?: string;
  className?: string;
}

export function ContentModerationNotice({ 
  status, 
  reason, 
  appealUrl, 
  className = '' 
}: ContentModerationNoticeProps) {
  if (status === 'under_review') {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              Content Under Review
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              This content has been flagged for review and is temporarily hidden from public view.
              {reason && ` Reason: ${reason}`}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
              Our moderation team will review this content within 24 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'dmca_hidden') {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <Ban className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">
              Content Removed - DMCA
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              This content has been removed due to a valid DMCA takedown notice.
            </p>
            {appealUrl && (
              <a
                href={appealUrl}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline mt-2 inline-block"
              >
                Learn about the appeals process
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}