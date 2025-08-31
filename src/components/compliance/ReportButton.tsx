import { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface ReportButtonProps {
  contentId: string;
  contentType: 'video' | 'comment' | 'profile';
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

interface ReportData {
  contentId: string;
  contentType: string;
  reason: string;
  details: string;
}

const REPORT_REASONS = [
  {
    value: 'csam',
    label: 'Child Sexual Abuse Material',
    description: 'Content involving minors in sexual situations',
  },
  {
    value: 'non-consensual',
    label: 'Non-consensual Content',
    description: 'Content shared without consent of participants',
  },
  {
    value: 'copyright',
    label: 'Copyright Infringement',
    description: 'Unauthorized use of copyrighted material',
  },
  {
    value: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Content that harasses or bullies individuals',
  },
  {
    value: 'spam',
    label: 'Spam or Misleading',
    description: 'Spam, scam, or misleading content',
  },
  {
    value: 'violence',
    label: 'Violence or Harm',
    description: 'Content depicting violence or promoting harm',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other policy violations',
  },
];

export function ReportButton({ 
  contentId, 
  contentType, 
  className = '', 
  variant = 'ghost',
  size = 'sm' 
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');

  const reportMutation = useMutation({
    mutationFn: async (data: ReportData) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/bff/compliance/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Report submitted successfully', {
        description: 'Thank you for helping keep our community safe. We will review your report.',
      });
      setIsOpen(false);
      setSelectedReason('');
      setDetails('');
    },
    onError: (error) => {
      toast.error('Failed to submit report', {
        description: 'Please try again later or contact support if the problem persists.',
      });
      console.error('Report submission error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    if (selectedReason === 'other' && !details.trim()) {
      toast.error('Please provide details for your report');
      return;
    }

    reportMutation.mutate({
      contentId,
      contentType,
      reason: selectedReason,
      details: details.trim(),
    });
  };

  const selectedReasonData = REPORT_REASONS.find(r => r.value === selectedReason);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          aria-label={`Report this ${contentType}`}
        >
          <Flag className="h-4 w-4" />
          <span className="sr-only">Report</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Report Content</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Why are you reporting this {contentType}?
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="space-y-3"
            >
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={reason.value}
                    id={reason.value}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={reason.value}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {reason.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {(selectedReason === 'other' || selectedReason === 'harassment' || selectedReason === 'copyright') && (
            <div>
              <Label htmlFor="details" className="text-sm font-medium">
                Additional Details {selectedReason === 'other' ? '(Required)' : '(Optional)'}
              </Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide more information about this report..."
                className="mt-2 min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {details.length}/500 characters
              </p>
            </div>
          )}

          {selectedReasonData && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Important
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    {selectedReasonData.value === 'csam' && 
                      'Reports of CSAM are treated with the highest priority and may be forwarded to law enforcement.'
                    }
                    {selectedReasonData.value === 'non-consensual' && 
                      'Non-consensual content reports are reviewed immediately and content may be removed pending investigation.'
                    }
                    {selectedReasonData.value === 'copyright' && 
                      'Copyright reports should include specific details about the copyrighted work and your relationship to it.'
                    }
                    {!['csam', 'non-consensual', 'copyright'].includes(selectedReasonData.value) && 
                      'All reports are reviewed by our moderation team within 24 hours.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={reportMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedReason || reportMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}