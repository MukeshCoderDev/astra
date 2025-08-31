import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { AlertTriangle, FileText, MessageSquare, Clock } from 'lucide-react';

interface DisputeResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dispute: DisputeData) => void;
  transactionId: string;
  transactionAmount: number;
  isSubmitting?: boolean;
}

interface DisputeData {
  reason: string;
  category: 'unauthorized' | 'technical' | 'content' | 'other';
  description: string;
  evidence?: string;
}

const DISPUTE_CATEGORIES = [
  {
    value: 'unauthorized',
    label: 'Unauthorized Transaction',
    description: 'This tip was sent without my permission or knowledge',
  },
  {
    value: 'technical',
    label: 'Technical Issue',
    description: 'There was a technical problem with the transaction',
  },
  {
    value: 'content',
    label: 'Content Issue',
    description: 'The content did not match what was expected',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Another reason not listed above',
  },
];

export function DisputeResolutionDialog({
  isOpen,
  onClose,
  onSubmit,
  transactionId,
  transactionAmount,
  isSubmitting = false,
}: DisputeResolutionDialogProps) {
  const [category, setCategory] = useState<DisputeData['category']>('unauthorized');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) return;

    const disputeData: DisputeData = {
      reason: DISPUTE_CATEGORIES.find(c => c.value === category)?.label || 'Other',
      category,
      description: description.trim(),
      evidence: evidence.trim() || undefined,
    };

    onSubmit(disputeData);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCategory('unauthorized');
      setDescription('');
      setEvidence('');
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const isValid = description.trim().length >= 10;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Report Transaction Issue
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Transaction Amount</span>
              <span className="font-medium">{formatCurrency(transactionAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs">{transactionId.slice(0, 8)}...</span>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                  Important Notice
                </p>
                <p className="text-orange-700 dark:text-orange-300">
                  Filing a dispute will freeze this transaction pending review. 
                  False disputes may result in account restrictions.
                </p>
              </div>
            </div>
          </div>

          {/* Dispute Category */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              What type of issue are you reporting?
            </Label>
            <RadioGroup value={category} onValueChange={(value) => setCategory(value as DisputeData['category'])}>
              <div className="space-y-3">
                {DISPUTE_CATEGORIES.map((cat) => (
                  <div key={cat.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={cat.value} id={cat.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={cat.value} className="font-medium cursor-pointer">
                        {cat.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-base font-medium mb-2 block">
              Describe the issue in detail
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide a detailed explanation of the issue you're experiencing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </span>
              <span className="text-xs text-muted-foreground">
                {description.length}/500
              </span>
            </div>
          </div>

          {/* Evidence */}
          <div>
            <Label htmlFor="evidence" className="text-base font-medium mb-2 block">
              Additional Evidence (Optional)
            </Label>
            <Textarea
              id="evidence"
              placeholder="Include any additional information, screenshots descriptions, or relevant details..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="min-h-20"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Providing additional evidence can help resolve your dispute faster
            </p>
          </div>

          {/* Process Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  What happens next?
                </p>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                  <li>• Your transaction will be frozen immediately</li>
                  <li>• Our team will review your dispute within 24-48 hours</li>
                  <li>• You'll receive updates via email and in your dashboard</li>
                  <li>• Resolution typically takes 3-5 business days</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Dispute
                </>
              )}
            </Button>
          </div>

          {/* Contact Info */}
          <div className="text-center text-xs text-muted-foreground">
            <p>
              Need immediate assistance? Contact support at{' '}
              <a href="mailto:support@example.com" className="text-primary hover:underline">
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}