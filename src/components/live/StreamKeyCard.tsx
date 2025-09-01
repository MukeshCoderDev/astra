import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw,
  Key,
  Shield,
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { liveApi } from '../../lib/api';
import type { StreamKeys } from '../../types/live';

/**
 * Props for StreamKeyCard component
 */
interface StreamKeyCardProps {
  /** Stream ID */
  streamId: string;
  /** Stream keys */
  streamKeys: StreamKeys;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when keys are rotated */
  onKeysRotated?: (newKeys: StreamKeys) => void;
  /** Callback for errors */
  onError?: (error: string) => void;
}

/**
 * Stream key card component
 * Displays stream keys with masking, copy functionality, and rotation
 */
export default function StreamKeyCard({
  streamId,
  streamKeys,
  isLoading = false,
  className,
  onKeysRotated,
  onError
}: StreamKeyCardProps) {
  const [showKeys, setShowKeys] = useState(false);
  const [rotateLoading, setRotateLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'primary' | 'backup' | null>(null);

  /**
   * Toggle key visibility
   */
  const toggleKeyVisibility = () => {
    setShowKeys(!showKeys);
  };

  /**
   * Copy key to clipboard
   */
  const copyToClipboard = async (key: string, keyType: 'primary' | 'backup') => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(keyType);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      onError?.('Failed to copy to clipboard');
    }
  };

  /**
   * Rotate stream keys
   */
  const rotateKeys = async () => {
    if (rotateLoading) return;

    setRotateLoading(true);
    try {
      const response = await liveApi.rotateKeys(streamId);
      
      if (response.ok && response.data) {
        onKeysRotated?.(response.data);
      } else {
        onError?.(response.error || 'Failed to rotate keys');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to rotate keys');
    } finally {
      setRotateLoading(false);
    }
  };

  /**
   * Mask stream key for display
   */
  const maskKey = (key: string) => {
    if (showKeys) return key;
    return `${key.slice(0, 8)}${'•'.repeat(Math.max(0, key.length - 16))}${key.slice(-8)}`;
  };

  /**
   * Get key display with copy button
   */
  const renderKeyRow = (
    label: string, 
    key: string, 
    keyType: 'primary' | 'backup',
    isPrimary: boolean = false
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {isPrimary && (
            <Badge variant="secondary" className="text-xs">
              Primary
            </Badge>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(key, keyType)}
          className="gap-1 h-7 px-2"
          disabled={isLoading}
        >
          {copiedKey === keyType ? (
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
          'break-all select-all',
          showKeys ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {maskKey(key)}
        </code>
      </div>
    </div>
  );

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Stream Keys</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Use these keys to connect your streaming software
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleKeyVisibility}
              className="gap-2"
              disabled={isLoading}
            >
              {showKeys ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={rotateKeys}
              disabled={rotateLoading || isLoading}
              className="gap-2"
            >
              {rotateLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Rotate
            </Button>
          </div>
        </div>

        {/* Stream Keys */}
        <div className="space-y-4">
          {renderKeyRow(
            'Primary Stream Key', 
            streamKeys.primary, 
            'primary',
            true
          )}
          
          {renderKeyRow(
            'Backup Stream Key', 
            streamKeys.backup, 
            'backup'
          )}
        </div>

        {/* Security Warning */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Security Best Practices
              </h4>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <li>• Never share your stream keys publicly</li>
                <li>• Rotate keys regularly for security</li>
                <li>• Use the backup key if the primary key is compromised</li>
                <li>• Keep your streaming software updated</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Rotation Warning */}
        {rotateLoading && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Rotating Stream Keys
                </h4>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Your stream keys are being rotated. You'll need to update your streaming software with the new keys.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium">How to use:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Copy your primary stream key</li>
            <li>Open your streaming software (OBS, XSplit, etc.)</li>
            <li>Paste the key in the stream key field</li>
            <li>Set your RTMP server URL (check ingest endpoints)</li>
            <li>Start streaming from your software</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}