import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  DollarSign,
  Play,
  Clock,
  Globe,
  Lock,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { Video } from '../../types';

interface ContentTableProps {
  videos: Video[];
  isLoading?: boolean;
  className?: string;
  onEdit?: (video: Video) => void;
  onDelete?: (video: Video) => void;
  onView?: (video: Video) => void;
  onAnalytics?: (video: Video) => void;
}

type SortField = 'title' | 'createdAt' | 'views' | 'likes' | 'tips' | 'earnings';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'public' | 'unlisted' | 'draft' | 'under_review' | 'dmca_hidden';

export function ContentTable({
  videos,
  isLoading = false,
  className,
  onEdit,
  onDelete,
  onView,
  onAnalytics
}: ContentTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getVisibilityIcon = (visibility: Video['visibility']) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-600" />;
      case 'unlisted':
        return <Lock className="h-4 w-4 text-yellow-600" />;
      case 'draft':
        return <EyeOff className="h-4 w-4 text-gray-600" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'dmca_hidden':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <EyeOff className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVisibilityBadge = (visibility: Video['visibility']) => {
    const variants = {
      public: 'default',
      unlisted: 'secondary',
      draft: 'outline',
      under_review: 'secondary',
      dmca_hidden: 'destructive'
    } as const;

    return (
      <Badge variant={variants[visibility]} className="gap-1">
        {getVisibilityIcon(visibility)}
        {visibility.replace('_', ' ')}
      </Badge>
    );
  };

  // Filter and sort videos
  const filteredAndSortedVideos = videos
    .filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           video.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || video.visibility === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'likes':
          aValue = a.likes;
          bValue = b.likes;
          break;
        case 'tips':
          aValue = a.tips;
          bValue = b.tips;
          break;
        case 'earnings':
          // Mock earnings calculation based on tips
          aValue = a.tips * 5; // Assuming $5 average tip
          bValue = b.tips * 5;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return (
      <Card className={clsx('p-6', className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
            <div className="h-9 bg-muted rounded w-24 animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Content Management</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="unlisted">Unlisted</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="dmca_hidden">DMCA Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('title')}
                    className="font-medium"
                  >
                    Video
                    {sortField === 'title' && (
                      <TrendingUp className={clsx(
                        'h-4 w-4 ml-1',
                        sortDirection === 'desc' && 'rotate-180'
                      )} />
                    )}
                  </Button>
                </th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('views')}
                    className="font-medium"
                  >
                    Views
                    {sortField === 'views' && (
                      <TrendingUp className={clsx(
                        'h-4 w-4 ml-1',
                        sortDirection === 'desc' && 'rotate-180'
                      )} />
                    )}
                  </Button>
                </th>
                <th className="text-left py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('tips')}
                    className="font-medium"
                  >
                    Tips
                    {sortField === 'tips' && (
                      <TrendingUp className={clsx(
                        'h-4 w-4 ml-1',
                        sortDirection === 'desc' && 'rotate-180'
                      )} />
                    )}
                  </Button>
                </th>
                <th className="text-left py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('earnings')}
                    className="font-medium"
                  >
                    Earnings
                    {sortField === 'earnings' && (
                      <TrendingUp className={clsx(
                        'h-4 w-4 ml-1',
                        sortDirection === 'desc' && 'rotate-180'
                      )} />
                    )}
                  </Button>
                </th>
                <th className="text-left py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('createdAt')}
                    className="font-medium"
                  >
                    Date
                    {sortField === 'createdAt' && (
                      <TrendingUp className={clsx(
                        'h-4 w-4 ml-1',
                        sortDirection === 'desc' && 'rotate-180'
                      )} />
                    )}
                  </Button>
                </th>
                <th className="text-right py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedVideos.map((video) => (
                <tr key={video.id} className="border-b hover:bg-muted/50">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-12 bg-muted rounded overflow-hidden">
                        <img
                          src={video.poster}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {formatDuration(video.durationSec)}
                        </div>
                        {video.type === 'short' && (
                          <div className="absolute top-1 left-1">
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              Short
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{video.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {video.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    {getVisibilityBadge(video.visibility)}
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(video.views)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(video.tips)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className="font-medium text-green-600">
                      {formatCurrency(video.tips * 5)} {/* Mock earnings */}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(video.createdAt)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(video)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAnalytics?.(video)}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(video)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(video)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredAndSortedVideos.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No videos found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload your first video to get started'
              }
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            )}
          </div>
        )}

        {/* Results Summary */}
        {filteredAndSortedVideos.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedVideos.length} of {videos.length} videos
          </div>
        )}
      </div>
    </Card>
  );
}