import { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Shield, 
  Timer,
  Ban,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { liveApi } from '../../lib/api';
import type { ModerationAction, ModerationRequest } from '../../types/live';

/**
 * Props for ModerationPanel component
 */
interface ModerationPanelProps {
  /** Stream ID */
  streamId: string;
  /** Callback when moderation action is completed */
  onModerationComplete?: (action: ModerationRequest) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Predefined timeout durations in seconds
 */
const TIMEOUT_DURATIONS = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '24 hours' },
];

/**
 * ModerationPanel component
 * Provides interface for quick moderation actions with confirmation dialogs
 */
export default function ModerationPanel({
  streamId,
  onModerationComplete,
  className
}: ModerationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ModerationAction | null>(null);

  // Form state
  const [targetUserId, setTargetUserId] = useState('');
  const [messageId, setMessageId] = useState('');
  const [durationSec, setDurationSec] = useState(300); // Default 5 minutes
  const [reason, setReason] = useState('');

  /**
   * Clear status messages after delay
   */
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  }, []);

  /**
   * Execute moderation action
   */
  const executeModerationAction = useCallback(async (request: ModerationRequest) => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await liveApi.moderate(streamId, request);
      
      if (response.ok) {
        setSuccess(`${request.action} action completed successfully`);
        onModerationComplete?.(request);
        
        // Reset form
        setTargetUserId('');
        setMessageId('');
        setReason('');
        setShowForm(false);
        setSelectedAction(null);
      } else {
        throw new Error(response.error || 'Moderation action failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Moderation action failed';
      setError(errorMessage);
      console.error('Moderation action failed:', err);
    } finally {
      setLoading(false);
      clearMessages();
    }
  }, [streamId, loading, onModerationComplete, clearMessages]);

  /**
   * Handle quick action button click
   */
  const handleQuickAction = useCallback((action: ModerationAction) => {
    setSelectedAction(action);
    setShowForm(true);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAction || !targetUserId.trim()) {
      setError('Please provide a valid user ID');
      clearMessages();
      return;
    }

    const request: ModerationRequest = {
      action: selectedAction,
      targetUserId: targetUserId.trim(),
      ...(selectedAction === 'delete' && messageId.trim() && { messageId: messageId.trim() }),
      ...(selectedAction === 'timeout' && { durationSec }),
      ...(reason.trim() && { reason: reason.trim() }),
    };

    executeModerationAction(request);
  }, [selectedAction, targetUserId, messageId, durationSec, reason, executeModerationAction, clearMessages]);

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Moderation Tools</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Quick actions for managing chat behavior
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {success && <CheckCircle className="h-4 w-4 text-green-600" />}
            {error && <AlertTriangle className="h-4 w-4 text-red-600" />}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Actions</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('timeout')}
              disabled={loading}
              className="flex items-center gap-2 h-auto py-3 px-4 text-yellow-600"
            >
              <Timer className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium text-sm">Timeout User</div>
                <div className="text-xs opacity-70">Temporarily prevent user from chatting</div>
              </div>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleQuickAction('ban')}
              disabled={loading}
              className="flex items-center gap-2 h-auto py-3 px-4"
            >
              <Ban className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium text-sm">Ban User</div>
                <div className="text-xs opacity-70">Permanently block user from this stream</div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('delete')}
              disabled={loading}
              className="flex items-center gap-2 h-auto py-3 px-4 text-orange-600"
            >
              <Trash2 className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium text-sm">Delete Message</div>
                <div className="text-xs opacity-70">Remove specific message from chat</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Moderation Form */}
        {showForm && selectedAction && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">
              {selectedAction === 'timeout' && 'Timeout User'}
              {selectedAction === 'ban' && 'Ban User'}
              {selectedAction === 'delete' && 'Delete Message'}
            </h4>

            {/* Target User ID */}
            <div className="space-y-2">
              <Label htmlFor="target-user">User ID or Handle *</Label>
              <Input
                id="target-user"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter user ID or @handle"
                required
                disabled={loading}
              />
            </div>

            {/* Message ID (for delete action) */}
            {selectedAction === 'delete' && (
              <div className="space-y-2">
                <Label htmlFor="message-id">Message ID (optional)</Label>
                <Input
                  id="message-id"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  placeholder="Specific message ID to delete"
                  disabled={loading}
                />
              </div>
            )}

            {/* Timeout Duration (for timeout action) */}
            {selectedAction === 'timeout' && (
              <div className="space-y-2">
                <Label htmlFor="duration">Timeout Duration</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIMEOUT_DURATIONS.map((duration) => (
                    <Button
                      key={duration.value}
                      type="button"
                      variant={durationSec === duration.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDurationSec(duration.value)}
                      disabled={loading}
                      className="text-xs"
                    >
                      {duration.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the reason for this action..."
                disabled={loading}
              />
            </div>

            {/* Warning for destructive actions */}
            {selectedAction === 'ban' && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-900 dark:text-red-100">
                    <strong>Warning:</strong> Banning a user is permanent and cannot be undone. 
                    The user will be blocked from participating in this stream.
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={selectedAction === 'ban' ? 'destructive' : 'default'}
                disabled={loading || !targetUserId.trim()}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {selectedAction === 'timeout' && 'Timeout User'}
                {selectedAction === 'ban' && 'Ban User'}
                {selectedAction === 'delete' && 'Delete Message'}
              </Button>
            </div>
          </form>
        )}

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-900 dark:text-red-100">
                {error}
              </span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-900 dark:text-green-100">
                {success}
              </span>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium">Moderation Guidelines</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Timeout:</strong> Temporarily prevents user from chatting (reversible)</li>
            <li>• <strong>Ban:</strong> Permanently blocks user from this stream (irreversible)</li>
            <li>• <strong>Delete:</strong> Removes specific message from chat history</li>
            <li>• Always provide a reason for moderation actions when possible</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}