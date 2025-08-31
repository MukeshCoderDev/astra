import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { VideoCard } from '../feed/VideoCard';
import { 
  Video,
  Zap,
  Info,
  Grid3X3,
  List
} from 'lucide-react';
import { Video as VideoType, Creator } from '../../types';

interface ProfileTabsProps {
  creator: Creator;
  videos: VideoType[];
  shorts: VideoType[];
  onVideoClick: (video: VideoType) => void;
  onVideoLike: (video: VideoType) => void;
  onVideoTip: (video: VideoType) => void;
}

export function ProfileTabs({
  creator,
  videos,
  shorts,
  onVideoClick,
  onVideoLike,
  onVideoTip
}: ProfileTabsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const renderVideoGrid = (videoList: VideoType[]) => {
    if (videoList.length === 0) {
      return (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No videos yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            This creator hasn't uploaded any videos in this category.
          </p>
        </div>
      );
    }

    return (
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {videoList.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            layout={viewMode}
            showCreator={false}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="videos" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="shorts" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Shorts
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              About
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <TabsContent value="videos" className="mt-6">
          {renderVideoGrid(videos)}
        </TabsContent>

        <TabsContent value="shorts" className="mt-6">
          {renderVideoGrid(shorts)}
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {creator.bio || "This creator hasn't added a bio yet."}
                </p>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Channel Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                    <span className="ml-2">January 2024</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Location:</span>
                    <span className="ml-2">Not specified</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Videos:</span>
                    <span className="ml-2">{videos.length + shorts.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Content Type:</span>
                    <span className="ml-2">Mixed</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}