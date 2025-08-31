import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileTabs } from '../../components/profile/ProfileTabs';
import { useProfile } from '../../hooks/useProfile';
import { useTip } from '../../hooks/useTip';
import { Loading } from '../../components/ui/loading';
import { Video } from '../../types';

function Profile() {
  const { handle: paramHandle } = useParams<{ handle: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get handle from params or extract from pathname if it starts with /@
  const handle = paramHandle || (location.pathname.startsWith('/@') ? location.pathname.slice(2) : '');
  
  const {
    creator,
    videos,
    shorts,
    isFollowing,
    isLoading,
    error,
    follow,
    unfollow,
    isFollowLoading
  } = useProfile(handle || '');

  const { sendTip } = useTip();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Profile not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The profile you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Go back to home
        </button>
      </div>
    );
  }

  const handleFollow = () => {
    follow(creator.id);
  };

  const handleUnfollow = () => {
    unfollow(creator.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${creator.displayName} (@${creator.handle})`,
        text: `Check out ${creator.displayName}'s profile`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // In a real app, show a toast notification here
    }
  };

  const handleVideoClick = (video: Video) => {
    navigate(`/watch/${video.id}`);
  };

  const handleVideoLike = (video: Video) => {
    // In a real app, implement like functionality
    console.log('Like video:', video.id);
  };

  const handleVideoTip = (video: Video) => {
    // Open tip modal or navigate to tip flow
    sendTip(video.id, 5); // Example: $5 tip
  };

  const handleEditProfile = () => {
    navigate('/settings/profile');
  };

  // Check if this is the current user's profile
  // In a real app, this would come from auth context
  const isOwnProfile = false; // Placeholder

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <ProfileHeader
        creator={creator}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onShare={handleShare}
        onEdit={handleEditProfile}
      />

      <ProfileTabs
        creator={creator}
        videos={videos}
        shorts={shorts}
        onVideoClick={handleVideoClick}
        onVideoLike={handleVideoLike}
        onVideoTip={handleVideoTip}
      />
    </div>
  );
}

export default Profile;