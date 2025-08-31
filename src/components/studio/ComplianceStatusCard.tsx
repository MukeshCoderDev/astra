import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Compliance2257Step } from '../compliance/Compliance2257Step';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ComplianceStatus {
  idVerification: {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    documentType?: string;
    verificationDate?: string;
    expiryDate?: string;
    rejectionReason?: string;
  };
  modelRelease: {
    status: 'none' | 'pending' | 'signed' | 'expired';
    signedDate?: string;
    expiryDate?: string;
  };
  overallStatus: 'not_started' | 'in_progress' | 'compliant' | 'expired' | 'rejected';
  nextRenewalDate?: string;
}

export function ComplianceStatusCard() {
  const [showComplianceFlow, setShowComplianceFlow] = useState(false);
  const queryClient = useQueryClient();

  const { data: complianceStatus, isLoading } = useQuery<ComplianceStatus>({
    queryKey: ['studio', 'compliance', '2257'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/bff/studio/compliance/2257`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch compliance status');
      return response.json();
    },
  });

  const renewalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/bff/studio/compliance/2257/renew`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to initiate renewal');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Compliance renewal initiated');
      queryClient.invalidateQueries({ queryKey: ['studio', 'compliance', '2257'] });
      setShowComplianceFlow(true);
    },
    onError: (error) => {
      toast.error('Failed to initiate renewal', {
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!complianceStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Compliance Status Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load compliance status. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Compliant</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Expired</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isNearExpiry = complianceStatus.nextRenewalDate && 
    new Date(complianceStatus.nextRenewalDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000; // 30 days

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(complianceStatus.overallStatus)}
              <span>2257 Compliance Status</span>
            </div>
            {getStatusBadge(complianceStatus.overallStatus)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Status Message */}
          {complianceStatus.overallStatus === 'compliant' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                Your account is fully compliant with 18 USC §2257 requirements. You can upload adult content.
              </p>
              {isNearExpiry && (
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  ⚠️ Renewal required by {formatDate(complianceStatus.nextRenewalDate)}
                </p>
              )}
            </div>
          )}

          {complianceStatus.overallStatus === 'rejected' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                Your compliance verification was rejected. Please review the requirements and resubmit.
              </p>
              {complianceStatus.idVerification.rejectionReason && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Reason: {complianceStatus.idVerification.rejectionReason}
                </p>
              )}
            </div>
          )}

          {complianceStatus.overallStatus === 'expired' && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Your compliance verification has expired. Please renew to continue uploading adult content.
              </p>
            </div>
          )}

          {complianceStatus.overallStatus === 'in_progress' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your compliance verification is being processed. This typically takes 1-3 business days.
              </p>
            </div>
          )}

          {complianceStatus.overallStatus === 'not_started' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Complete 2257 compliance verification to upload adult content on the platform.
              </p>
            </div>
          )}

          {/* Detailed Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(complianceStatus.idVerification.status)}
                <span className="text-sm font-medium">ID Verification</span>
              </div>
              <div className="text-right">
                {getStatusBadge(complianceStatus.idVerification.status)}
                {complianceStatus.idVerification.verificationDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Verified: {formatDate(complianceStatus.idVerification.verificationDate)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(complianceStatus.modelRelease.status)}
                <span className="text-sm font-medium">Model Release</span>
              </div>
              <div className="text-right">
                {getStatusBadge(complianceStatus.modelRelease.status)}
                {complianceStatus.modelRelease.signedDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Signed: {formatDate(complianceStatus.modelRelease.signedDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            {(complianceStatus.overallStatus === 'not_started' || 
              complianceStatus.overallStatus === 'rejected') && (
              <Dialog open={showComplianceFlow} onOpenChange={setShowComplianceFlow}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Start Verification
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>2257 Compliance Verification</DialogTitle>
                  </DialogHeader>
                  <Compliance2257Step
                    onComplete={() => {
                      setShowComplianceFlow(false);
                      queryClient.invalidateQueries({ queryKey: ['studio', 'compliance', '2257'] });
                    }}
                    isRequired={true}
                  />
                </DialogContent>
              </Dialog>
            )}

            {(complianceStatus.overallStatus === 'expired' || isNearExpiry) && (
              <Button
                variant="outline"
                onClick={() => renewalMutation.mutate()}
                disabled={renewalMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${renewalMutation.isPending ? 'animate-spin' : ''}`} />
                {renewalMutation.isPending ? 'Initiating...' : 'Renew'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['studio', 'compliance', '2257'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Next Renewal Date */}
          {complianceStatus.nextRenewalDate && complianceStatus.overallStatus === 'compliant' && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Next renewal required by: {formatDate(complianceStatus.nextRenewalDate)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Flow Dialog */}
      <Dialog open={showComplianceFlow} onOpenChange={setShowComplianceFlow}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>2257 Compliance Verification</DialogTitle>
          </DialogHeader>
          <Compliance2257Step
            onComplete={() => {
              setShowComplianceFlow(false);
              queryClient.invalidateQueries({ queryKey: ['studio', 'compliance', '2257'] });
            }}
            isRequired={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}