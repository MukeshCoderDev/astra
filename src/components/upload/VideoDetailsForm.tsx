import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Eye, 
  EyeOff, 
  Globe, 
  Lock, 
  FileText,
  Shield,
  MapPin,
  Droplets
} from 'lucide-react';
import { VideoMetadata } from '../../types';

const videoDetailsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  visibility: z.enum(['public', 'unlisted', 'draft']),
  adultContent: z.boolean().optional(),
  forensicWatermark: z.boolean().optional(),
  geoBlocked: z.array(z.string()).optional()
});

type VideoDetailsFormData = z.infer<typeof videoDetailsSchema>;

interface VideoDetailsFormProps {
  initialData?: Partial<VideoMetadata>;
  onSubmit: (data: VideoDetailsFormData) => void;
  onSaveDraft?: (data: VideoDetailsFormData) => void;
  isSubmitting?: boolean;
  className?: string;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VA', name: 'Virginia' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' }
];

export function VideoDetailsForm({
  initialData,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  className
}: VideoDetailsFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialData?.geoBlocked || []
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<VideoDetailsFormData>({
    resolver: zodResolver(videoDetailsSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      tags: initialData?.tags || [],
      visibility: initialData?.visibility || 'public',
      adultContent: initialData?.adultContent || false,
      forensicWatermark: initialData?.forensicWatermark || false,
      geoBlocked: initialData?.geoBlocked || []
    }
  });

  const watchedTags = watch('tags');
  const watchedVisibility = watch('visibility');
  const watchedAdultContent = watch('adultContent');
  const watchedForensicWatermark = watch('forensicWatermark');

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !watchedTags.includes(tag) && watchedTags.length < 10) {
      setValue('tags', [...watchedTags, tag], { shouldDirty: true });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove), { shouldDirty: true });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const toggleCountry = (countryCode: string) => {
    const newSelection = selectedCountries.includes(countryCode)
      ? selectedCountries.filter(code => code !== countryCode)
      : [...selectedCountries, countryCode];
    
    setSelectedCountries(newSelection);
    setValue('geoBlocked', newSelection, { shouldDirty: true });
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'unlisted':
        return <EyeOff className="h-4 w-4" />;
      case 'draft':
        return <Lock className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getVisibilityDescription = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Anyone can search for and view this video';
      case 'unlisted':
        return 'Only people with the link can view this video';
      case 'draft':
        return 'Only you can view this video';
      default:
        return '';
    }
  };

  return (
    <Card className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Video Details</h3>
          
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter video title..."
              {...register('title')}
              error={errors.title?.message}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Tell viewers about your video..."
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={addTag}
                disabled={!tagInput.trim() || watchedTags.length >= 10}
              >
                Add
              </Button>
            </div>
            
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedTags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              {watchedTags.length}/10 tags used
            </p>
          </div>
        </div>

        <Separator />

        {/* Visibility Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Privacy & Visibility</h3>
          
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select 
              value={watchedVisibility} 
              onValueChange={(value) => setValue('visibility', value as any, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getVisibilityIcon(watchedVisibility)}
                    <span className="capitalize">{watchedVisibility}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <div>Public</div>
                      <div className="text-xs text-muted-foreground">
                        Anyone can search for and view
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="unlisted">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    <div>
                      <div>Unlisted</div>
                      <div className="text-xs text-muted-foreground">
                        Only people with the link can view
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <div>
                      <div>Draft</div>
                      <div className="text-xs text-muted-foreground">
                        Only you can view
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getVisibilityDescription(watchedVisibility)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Content Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Content Settings</h3>
          
          {/* Adult Content */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <Label>Adult Content</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Mark if this video contains adult content (18+)
              </p>
            </div>
            <Switch
              checked={watchedAdultContent}
              onCheckedChange={(checked) => setValue('adultContent', checked, { shouldDirty: true })}
            />
          </div>

          {/* Forensic Watermark */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                <Label>Forensic Watermark</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Add unique watermarks for content protection
              </p>
            </div>
            <Switch
              checked={watchedForensicWatermark}
              onCheckedChange={(checked) => setValue('forensicWatermark', checked, { shouldDirty: true })}
            />
          </div>
        </div>

        <Separator />

        {/* Geographic Restrictions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <h3 className="text-lg font-medium">Geographic Restrictions</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Select countries where this video should be blocked
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COUNTRIES.map((country) => (
              <Button
                key={country.code}
                type="button"
                variant={selectedCountries.includes(country.code) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCountry(country.code)}
                className="justify-start"
              >
                {country.name}
              </Button>
            ))}
          </div>
          
          {selectedCountries.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Video will be blocked in: {selectedCountries.join(', ')}
            </div>
          )}
        </div>

        <Separator />

        {/* Legal Acknowledgments */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Legal Acknowledgments</h3>
          
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms-agreement"
                className="mt-1"
                required
              />
              <label htmlFor="terms-agreement" className="text-sm">
                I have read and agree to the{' '}
                <a 
                  href="/legal/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Terms of Service
                </a>
                {' '}and confirm that I am at least 18 years old.
              </label>
            </div>
            
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="privacy-agreement"
                className="mt-1"
                required
              />
              <label htmlFor="privacy-agreement" className="text-sm">
                I acknowledge that I have read the{' '}
                <a 
                  href="/legal/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
                {' '}and understand how my data will be processed.
              </label>
            </div>
            
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="dmca-agreement"
                className="mt-1"
                required
              />
              <label htmlFor="dmca-agreement" className="text-sm">
                I understand the{' '}
                <a 
                  href="/legal/dmca" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  DMCA Policy
                </a>
                {' '}and confirm that I own or have proper licensing for this content.
              </label>
            </div>
            
            {watchedAdultContent && (
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="adult-content-agreement"
                  className="mt-1"
                  required
                />
                <label htmlFor="adult-content-agreement" className="text-sm">
                  I confirm that all performers in this adult content are at least 18 years old 
                  and I have proper documentation as required by 18 USC §2257.
                </label>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isDirty && 'You have unsaved changes'}
          </div>
          
          <div className="flex gap-2">
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onSaveDraft(watch())}
                disabled={isSubmitting}
              >
                <FileText className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            )}
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Video'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}