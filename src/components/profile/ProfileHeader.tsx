import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { 
  UserPlus,
  UserMinus,
  Settings,
  Share,
  MoreHorizontal,
  Check,
  Users,
  Eye,
  Video
} from 'lucide-react';
import { Creator } from '../../types';

interface ProfileHeaderProps {
  creator: Creator;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onShare: () => void;
  onEdit?: () => void;
}

export function ProfileHeader({
  creator,
  isOwnProfile,
  isFollowing,
  onFollow,
  onUnfollow,
  onShare,
  onEdit
}: ProfileHeaderProps) {
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const handleFollowClick = async () => {
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow();
      } else {
        await onFollow();
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Cover/Banner area - could be added later */}
      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
      
      {/* Profile info */}
      <div className="relative -mt-16 px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-900">
                <img 
                  src={creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.handle}`}
                  alt={creator.displayName}
                  className="w-full h-full object-cover"
                />
              </Avatar>
              {creator.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Name and handle */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{creator.displayName}</h1>
                {creator.verified && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Check className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">@{creator.handle}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <>
                <Button variant="outline" onClick={onEdit} className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  Share
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleFollowClick}
                  disabled={isFollowLoading}
                  className={`flex items-center gap-2 ${
                    isFollowing 
                      ? 'bg-gray-200 text-gray-800 hover:bg-red-100 hover:text-red-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-red-900 dark:hover:text-red-200' 
                      : ''
                  }`}
                  variant={isFollowing ? 'outline' : 'default'}
                >
                  {isFollowLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <UserMinus className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{formatNumber(creator.followerCount)}</span>
            <span className="text-gray-600 dark:text-gray-400">followers</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{formatNumber(creator.totalViews)}</span>
            <span className="text-gray-600 dark:text-gray-400">views</span>
          </div>
          <div className="flex items-center gap-1">
            <Video className="w-4 h-4 text-gray-500" />
            <span className="font-medium">0</span>
            <span className="text-gray-600 dark:text-gray-400">videos</span>
          </div>
        </div>
      </div>
    </div>
  );
}