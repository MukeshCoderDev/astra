import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoPlayer } from '../../components/player/VideoPlayer';
import { VideoMetadata } from '../../components/player/VideoMetadata';
import { FeedList } from '../../components/feed';
import { CommentList } from '../../components/comments/CommentList';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Loading } from '../../components/ui/loading';
import { useComments } from '../../hooks/useComments';
import { 
  Heart, 
  Share2, 
  DollarSign, 
  UserPlus, 
  Flag,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';
import { mockApi } from '../../lib/mockData';
import { Video } from '../../types';

function Watch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  // Comments hook
  const {
    comments,
    addComment,
    likeComment,
    reportComment,
    isLoading: commentsLoading
  } = useComments(id || '');

  useEffect(() => {
    const loadVideo = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        const videoData = await mockApi.getVideoById(id);
        if (!videoData) {
          setError('Video not found');
          return;
        }

        setVideo(videoData);

        // Load related videos (excluding current video)
        const feedResponse = await mockApi.getFeed(1, 8);
        const related = feedResponse.videos.filter(v => v.id !== id);
        setRelatedVideos(related);

      } catch (err) {
        setError('Failed to load video');
        console.error('Error loading video:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [id]);

  const handleCreatorClick = () => {
    if (video) {
      navigate(`/@${video.creator.handle}`);
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-4">
          {error || 'Video not found'}
        </div>
        <Button onClick={() => navigate('/')} variant="outline">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Video Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <VideoPlayer
            src={video.hlsUrl}
            poster={video.poster}
            autoPlay
            controls
            className="w-full h-full"
          />
        </div>

        {/* Video Title */}
        <div>
          <h1 className="text-xl font-semibold mb-2">
            {video.title}
          </h1>
          
          {/* Video Stats and Actions */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{formatTimeAgo(video.createdAt)}</span>
              {video.adultContent && (
                <>
                  <span>•</span>
                  <Badge variant="destructive" className="text-xs">18+</Badge>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={hasLiked ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setHasLiked(!hasLiked)}
              >
                <ThumbsUp className="h-4 w-4" />
                {formatViews(video.likes + (hasLiked ? 1 : 0))}
              </Button>
              
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              
              <Button variant="outline" size="sm" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Tip
              </Button>
              
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Creator Info */}
        <div className="flex items-start justify-between">
          <div 
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleCreatorClick}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={video.creator.avatar} alt={video.creator.displayName} />
              <AvatarFallback>
                {video.creator.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
                  {video.creator.displayName}
                </h3>
                {video.creator.verified && (
                  <Badge variant="secondary" className="text-xs">✓</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatViews(video.creator.followerCount)} followers
              </div>
            </div>
          </div>

          <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            className="gap-2"
            onClick={() => setIsFollowing(!isFollowing)}
          >
            <UserPlus className="h-4 w-4" />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>

        {/* Video Description */}
        {video.description && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap">
              {video.description}
            </p>
            
            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {video.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Comments Section */}
        <CommentList
          videoId={video.id}
          comments={comments}
          onAddComment={addComment}
          onLikeComment={likeComment}
          onReplyToComment={(parentId, content) => addComment(content, parentId)}
          onReportComment={reportComment}
          isLoading={commentsLoading}
        />
      </div>

      {/* Sidebar - Related Videos */}
      <div className="space-y-4">
        <h3 className="font-medium">Up Next</h3>
        
        {relatedVideos.length > 0 ? (
          <FeedList
            videos={relatedVideos}
            layout="list"
            className="space-y-3"
          />
        ) : (
          <div className="text-muted-foreground text-sm">
            No related videos available
          </div>
        )}
      </div>
    </div>
  );
}

export default Watch;