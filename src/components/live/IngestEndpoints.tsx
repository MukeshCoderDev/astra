import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Copy, 
  Check,
  Server,
  Info,
  ExternalLink,
  Settings,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import type { IngestEndpoints as IngestEndpointsType } from '../../types/live';

/**
 * Props for IngestEndpoints component
 */
interface IngestEndpointsProps {
  /** Ingest endpoints configuration */
  ingest: IngestEndpointsType;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback for errors */
  onError?: (error: string) => void;
}

/**
 * Ingest endpoints component
 * Displays RTMP and SRT ingest URLs with copy functionality and setup instructions
 */
export default function IngestEndpoints({
  ingest,
  isLoading = false,
  className,
  onError
}: IngestEndpointsProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<'rtmp' | 'srt' | null>(null);

  /**
   * Copy endpoint to clipboard
   */
  const copyToClipboard = async (url: string, type: 'rtmp' | 'srt') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedEndpoint(type);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (error) {
      onError?.('Failed to copy to clipboard');
    }
  };

  /**
   * Render endpoint row
   */
  const renderEndpointRow = (
    label: string,
    url: string,
    type: 'rtmp' | 'srt',
    description: string,
    isRecommended: boolean = false
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {isRecommended && (
            <Badge variant="secondary" className="text-xs">
              Recommended
            </Badge>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(url, type)}
          className="gap-1 h-7 px-2"
          disabled={isLoading}
        >
          {copiedEndpoint === type ? (
            <>
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>
      
      <div className="relative">
        <code className={clsx(
          'block w-full p-3 rounded-md text-sm font-mono',
          'bg-muted border border-border',
          'break-all select-all text-foreground'
        )}>
          {url}
        </code>
      </div>
      
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Ingest Endpoints</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your streaming software with these server URLs
          </p>
        </div>

        {/* RTMP Endpoint */}
        <div className="space-y-4">
          {renderEndpointRow(
            'RTMP Server',
            ingest.rtmp,
            'rtmp',
            'Standard RTMP protocol - compatible with most streaming software',
            true
          )}
        </div>

        {/* SRT Endpoint (if available) */}
        {ingest.srt && (
          <div className="space-y-4">
            {renderEndpointRow(
              'SRT Server',
              ingest.srt,
              'srt',
              'Secure Reliable Transport - better for unstable connections'
            )}
          </div>
        )}

        {/* Setup Instructions */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Encoder Setup Instructions
          </h4>

          {/* OBS Studio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                OBS Studio
              </Badge>
              <span className="text-sm font-medium">Most Popular</span>
            </div>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-4">
              <li>Open OBS Studio and go to Settings → Stream</li>
              <li>Set Service to "Custom..."</li>
              <li>Copy and paste the RTMP server URL above</li>
              <li>Enter your stream key (from Stream Keys section)</li>
              <li>Click "OK" and start streaming</li>
            </ol>
          </div>

          {/* XSplit */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                XSplit
              </Badge>
            </div>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-4">
              <li>Open XSplit and click "Broadcast"</li>
              <li>Select "Set up a new output"</li>
              <li>Choose "Custom RTMP"</li>
              <li>Enter the RTMP server URL and your stream key</li>
              <li>Start broadcasting</li>
            </ol>
          </div>

          {/* FFmpeg */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                FFmpeg
              </Badge>
              <span className="text-xs text-muted-foreground">Advanced</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Command line example:
              </p>
              <code className="block w-full p-3 rounded-md text-xs font-mono bg-muted border border-border break-all">
                ffmpeg -i input.mp4 -c:v libx264 -c:a aac -f flv {ingest.rtmp}/YOUR_STREAM_KEY
              </code>
            </div>
          </div>
        </div>

        {/* Recommended Settings */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Recommended Streaming Settings
              </h4>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Video:</strong>
                    <ul className="mt-1 space-y-0.5">
                      <li>• Resolution: 1920x1080 or 1280x720</li>
                      <li>• Frame Rate: 30 or 60 FPS</li>
                      <li>• Bitrate: 2500-6000 kbps</li>
                      <li>• Encoder: x264 or Hardware (NVENC/AMF)</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Audio:</strong>
                    <ul className="mt-1 space-y-0.5">
                      <li>• Codec: AAC</li>
                      <li>• Bitrate: 128-320 kbps</li>
                      <li>• Sample Rate: 44.1 or 48 kHz</li>
                      <li>• Channels: Stereo</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Need Help?
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <ExternalLink className="h-3 w-3" />
              <span className="text-xs">OBS Setup Guide</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <ExternalLink className="h-3 w-3" />
              <span className="text-xs">Streaming Best Practices</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <ExternalLink className="h-3 w-3" />
              <span className="text-xs">Troubleshooting</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}