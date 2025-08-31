import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Shield,
  Check,
  AlertTriangle,
  Clock,
  FileText,
  Upload
} from 'lucide-react';
import { KYCVerification } from '../../types';

interface KYCStatusCardProps {
  kycData: KYCVerification;
  onStartVerification: () => void;
  onUploadDocument: () => void;
  onSignModelRelease: () => void;
}

export function KYCStatusCard({ 
  kycData, 
  onStartVerification, 
  onUploadDocument,
  onSignModelRelease 
}: KYCStatusCardProps) {
  const getStatusBadge = (status: KYCVerification['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
  };

  const getModelReleaseStatus = (status: KYCVerification['modelReleaseStatus']) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Check className="w-3 h-3 mr-1" />Signed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
    }
  };

  const getVerificationProgress = () => {
    let progress = 0;
    if (kycData.status === 'approved') progress += 50;
    else if (kycData.status === 'pending') progress += 25;
    
    if (kycData.modelReleaseStatus === 'signed') progress += 50;
    else if (kycData.modelReleaseStatus === 'pending') progress += 25;
    
    return progress;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">KYC Verification</h3>
        </div>
        {getStatusBadge(kycData.status)}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Verification Progress</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{getVerificationProgress()}%</span>
          </div>
          <Progress value={getVerificationProgress()} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Identity Verification
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              {getStatusBadge(kycData.status)}
            </div>
            {kycData.documentType && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Document:</span>
                <span className="text-sm capitalize">{kycData.documentType.replace('_', ' ')}</span>
              </div>
            )}
            {kycData.verificationDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Verified:</span>
                <span className="text-sm">{new Date(kycData.verificationDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Model Release (2257)
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              {getModelReleaseStatus(kycData.modelReleaseStatus)}
            </div>
            {kycData.expiryDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Expires:</span>
                <span className="text-sm">{new Date(kycData.expiryDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          {kycData.status === 'pending' && (
            <Button variant="outline" onClick={onUploadDocument} className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
          )}
          
          {kycData.status === 'rejected' && (
            <Button onClick={onStartVerification} className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Restart Verification
            </Button>
          )}
          
          {kycData.status === 'approved' && kycData.modelReleaseStatus !== 'signed' && (
            <Button onClick={onSignModelRelease} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Sign Model Release
            </Button>
          )}
          
          {(kycData.status === 'pending' || kycData.status === 'rejected') && kycData.modelReleaseStatus === 'pending' && (
            <Button variant="outline" onClick={onSignModelRelease} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Complete Model Release
            </Button>
          )}
        </div>

        {kycData.status === 'rejected' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200">
              Your verification was rejected. Please ensure your document is clear, valid, and matches your account information.
            </p>
          </div>
        )}

        {kycData.modelReleaseStatus === 'expired' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your model release has expired. Please sign a new release to continue uploading adult content.
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
          <p>
            KYC verification is required for compliance with our{' '}
            <a 
              href="/legal/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Terms of Service
            </a>
            {' '}and applicable regulations. Your data is protected according to our{' '}
            <a 
              href="/legal/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </Card>
  );
}