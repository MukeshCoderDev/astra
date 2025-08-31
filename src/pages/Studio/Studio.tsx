import { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { EarningsSummary } from '../../components/studio/EarningsSummary';
import { ContentTable } from '../../components/studio/ContentTable';
import { KYCStatusCard } from '../../components/studio/KYCStatusCard';
import { PayoutHistoryTable } from '../../components/studio/PayoutHistoryTable';
import { PayoutRequestDialog } from '../../components/studio/PayoutRequestDialog';
import { useKYC } from '../../hooks/useKYC';
import { usePayout } from '../../hooks/usePayout';
import { useWallet } from '../../hooks/useWallet';
import { 
  BarChart3,
  Video,
  DollarSign,
  Upload,
  TrendingUp,
  Users,
  Eye
} from 'lucide-react';
import { Video as VideoType } from '../../types';

// Mock data - in real app this would come from API
const mockEarningsData = {
  totalEarnings: 2847.50,
  monthlyEarnings: 1250.00,
  weeklyEarnings: 320.00,
  dailyEarnings: 45.00,
  pendingPayouts: 890.00,
  totalViews: 125000,
  totalTips: 1420,
  averageTipAmount: 8.50,
  topPerformingVideo: {
    id: '1',
    title: 'My Best Content Ever',
    earnings: 450.00,
    views: 15000
  },
  earningsHistory: [
    { date: '2024-01-15', amount: 125.00, type: 'tip' as const },
    { date: '2024-01-14', amount: 89.50, type: 'tip' as const },
    { date: '2024-01-13', amount: 200.00, type: 'payout' as const }
  ]
};

const mockVideos: VideoType[] = [
  {
    id: '1',
    title: 'Amazing Content Video',
    description: 'This is an amazing piece of content that viewers love',
    hlsUrl: 'https://example.com/video1.m3u8',
    poster: 'https://picsum.photos/320/180?random=1',
    durationSec: 1245,
    durationLabel: '20:45',
    views: 15000,
    likes: 1200,
    tips: 85,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    creator: {
      id: 'creator1',
      handle: '@creator',
      displayName: 'Creator Name',
      verified: true,
      followerCount: 5000,
      totalViews: 125000
    },
    tags: ['entertainment', 'lifestyle'],
    visibility: 'public',
    type: 'long'
  },
  {
    id: '2',
    title: 'Quick Short Video',
    description: 'A fun short video',
    hlsUrl: 'https://example.com/video2.m3u8',
    poster: 'https://picsum.photos/320/180?random=2',
    durationSec: 45,
    durationLabel: '0:45',
    views: 8500,
    likes: 650,
    tips: 32,
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
    creator: {
      id: 'creator1',
      handle: '@creator',
      displayName: 'Creator Name',
      verified: true,
      followerCount: 5000,
      totalViews: 125000
    },
    tags: ['shorts', 'funny'],
    visibility: 'public',
    type: 'short'
  },
  {
    id: '3',
    title: 'Draft Video in Progress',
    description: 'This video is still being worked on',
    hlsUrl: '',
    poster: 'https://picsum.photos/320/180?random=3',
    durationSec: 890,
    durationLabel: '14:50',
    views: 0,
    likes: 0,
    tips: 0,
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T09:00:00Z',
    creator: {
      id: 'creator1',
      handle: '@creator',
      displayName: 'Creator Name',
      verified: true,
      followerCount: 5000,
      totalViews: 125000
    },
    tags: ['draft'],
    visibility: 'draft',
    type: 'long'
  }
];



function Studio() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  
  // Hooks for data fetching
  const { kycData, startVerification, uploadDocument, signModelRelease } = useKYC();
  const { payouts, settings, requestPayout } = usePayout();
  const { balance } = useWallet();

  const handleVideoEdit = (video: VideoType) => {
    console.log('Edit video:', video.id);
    // In real app, navigate to edit page or open modal
  };

  const handleVideoDelete = (video: VideoType) => {
    console.log('Delete video:', video.id);
    // In real app, show confirmation dialog and delete
  };

  const handleVideoView = (video: VideoType) => {
    console.log('View video:', video.id);
    // In real app, navigate to watch page
  };

  const handleVideoAnalytics = (video: VideoType) => {
    console.log('View analytics for video:', video.id);
    // In real app, navigate to analytics page
  };

  const handleRequestPayout = () => {
    setShowPayoutDialog(true);
  };

  const handlePayoutSubmit = async (amount: number, walletAddress: string) => {
    await requestPayout({ amount, walletAddress });
    setShowPayoutDialog(false);
  };

  const handleStartVerification = () => {
    startVerification();
  };

  const handleUploadDocument = () => {
    // In real app, open file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadDocument(file);
      }
    };
    input.click();
  };

  const handleSignModelRelease = () => {
    // In real app, open model release signing interface
    const signature = `${Date.now()}-signature`;
    signModelRelease(signature);
  };

  const handleViewDetails = () => {
    console.log('View detailed analytics');
    // In real app, navigate to detailed analytics page
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Studio</h1>
          <p className="text-muted-foreground">
            Manage your content, track earnings, and grow your audience
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Video
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{mockVideos.length}</div>
              <div className="text-sm text-muted-foreground">Total Videos</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">125K</div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">5.0K</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">$2.8K</div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </div>
          </div>
        </Card>
      </div>



      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Video className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EarningsSummary
            data={mockEarningsData}
            onViewDetails={handleViewDetails}
            onRequestPayout={handleRequestPayout}
          />
          
          {/* KYC Status */}
          {kycData && (
            <KYCStatusCard
              kycData={kycData}
              onStartVerification={handleStartVerification}
              onUploadDocument={handleUploadDocument}
              onSignModelRelease={handleSignModelRelease}
            />
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentTable
            videos={mockVideos}
            onEdit={handleVideoEdit}
            onDelete={handleVideoDelete}
            onView={handleVideoView}
            onAnalytics={handleVideoAnalytics}
          />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          {settings && balance && (
            <PayoutHistoryTable
              payouts={payouts}
              onRequestPayout={handleRequestPayout}
              availableBalance={balance.availableForWithdraw}
              minimumPayout={settings.minimumPayout}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Detailed Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Advanced analytics and insights will be available here
              </p>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Request Dialog */}
      {settings && balance && (
        <PayoutRequestDialog
          isOpen={showPayoutDialog}
          onClose={() => setShowPayoutDialog(false)}
          onSubmit={handlePayoutSubmit}
          availableBalance={balance.availableForWithdraw}
          minimumPayout={settings.minimumPayout}
          estimatedFees={settings.estimatedFees}
        />
      )}
    </div>
  );
}

export default Studio;