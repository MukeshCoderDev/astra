import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { liveApi } from '../../lib/api';
import { CreateStreamRequest } from '../../types/live';
import { 
  ArrowLeft,
  Calendar,
  Settings,
  Shield,
  Clock,
  Droplets
} from 'lucide-react';

interface NewLiveProps {}

function NewLive({}: NewLiveProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const isScheduled = searchParams.get('scheduled') === 'true';
  
  const [formData, setFormData] = useState<CreateStreamRequest & { startAt?: string }>({
    title: '',
    privacy: 'public',
    dvrWindowSec: 7200, // 2 hours default
    watermark: false,
    ageRestricted: false,
    startAt: isScheduled ? '' : undefined,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Stream title is required');
      return;
    }
    
    if (isScheduled && !formData.startAt) {
      setError('Start time is required for scheduled streams');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const payload: CreateStreamRequest = {
        title: formData.title.trim(),
        privacy: formData.privacy,
        dvrWindowSec: formData.dvrWindowSec,
        watermark: formData.watermark,
        ageRestricted: formData.ageRestricted,
      };
      
      if (isScheduled && formData.startAt) {
        payload.startAt = formData.startAt;
      }
      
      const response = await liveApi.createStream(payload);
      
      if (response.ok && response.data) {
        // Redirect to control room
        navigate(`/studio/live/${response.data.id}`);
      } else {
        setError(response.error || 'Failed to create stream');
      }
    } catch (err) {
      console.error('Error creating stream:', err);
      setError('Failed to create stream');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/studio/live');
  };

  const getDvrWindowLabel = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    if (hours === 0) return 'Disabled';
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isScheduled ? 'Schedule Live Stream' : 'Create Live Stream'}
          </h1>
          <p className="text-muted-foreground">
            {isScheduled 
              ? 'Set up a scheduled live stream for later broadcast'
              : 'Set up a new live stream and get your streaming keys'
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stream Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Stream Title *</Label>
            <Input
              id="title"
              placeholder="Enter your stream title..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              maxLength={100}
              required
            />
            <p className="text-sm text-muted-foreground">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Scheduled Start Time */}
          {isScheduled && (
            <div className="space-y-2">
              <Label htmlFor="startAt" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Time *
              </Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => handleInputChange('startAt', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          )}

          {/* Privacy Settings */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </Label>
            <Select 
              value={formData.privacy} 
              onValueChange={(value: 'public' | 'unlisted' | 'private') => 
                handleInputChange('privacy', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can find and watch</SelectItem>
                <SelectItem value="unlisted">Unlisted - Only people with the link</SelectItem>
                <SelectItem value="private">Private - Only you can watch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DVR Window */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              DVR Window
            </Label>
            <Select 
              value={formData.dvrWindowSec?.toString()} 
              onValueChange={(value) => handleInputChange('dvrWindowSec', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Disabled</SelectItem>
                <SelectItem value="3600">1 hour</SelectItem>
                <SelectItem value="7200">2 hours</SelectItem>
                <SelectItem value="14400">4 hours</SelectItem>
                <SelectItem value="28800">8 hours</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Allow viewers to seek back in time during your live stream
            </p>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced Settings
            </Label>
            
            {/* Watermark */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Forensic Watermark
                </Label>
                <p className="text-sm text-muted-foreground">
                  Add invisible watermark for content protection
                </p>
              </div>
              <Switch
                checked={formData.watermark}
                onCheckedChange={(checked) => handleInputChange('watermark', checked)}
              />
            </div>

            {/* Age Restriction */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Age Restricted
                </Label>
                <p className="text-sm text-muted-foreground">
                  Require age verification to view this stream
                </p>
              </div>
              <Switch
                checked={formData.ageRestricted}
                onCheckedChange={(checked) => handleInputChange('ageRestricted', checked)}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : isScheduled ? 'Schedule Stream' : 'Create Stream'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Info Card */}
      <Card className="p-6">
        <h3 className="font-medium mb-3">What happens next?</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Your stream will be created with unique streaming keys</p>
          <p>• You'll be redirected to the control room to manage your stream</p>
          <p>• Configure your streaming software with the provided RTMP URL and key</p>
          {isScheduled && <p>• Your stream will automatically go live at the scheduled time</p>}
          <p>• Start broadcasting when you're ready!</p>
        </div>
      </Card>
    </div>
  );
}

export default NewLive;