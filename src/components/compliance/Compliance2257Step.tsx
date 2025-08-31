import { useState } from 'react';
import { AlertTriangle, Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';

interface Compliance2257StepProps {
  onComplete: (complianceData: ComplianceData) => void;
  onSkip?: () => void;
  isRequired?: boolean;
}

interface ComplianceData {
  idVerificationStatus: 'pending' | 'approved' | 'rejected';
  modelReleaseStatus: 'pending' | 'signed' | 'expired';
  verificationId?: string;
  modelReleaseId?: string;
}

interface VerificationStatus {
  idVerification: {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    documentType?: string;
    verificationDate?: string;
    expiryDate?: string;
  };
  modelRelease: {
    status: 'none' | 'pending' | 'signed' | 'expired';
    signedDate?: string;
    expiryDate?: string;
  };
}

export function Compliance2257Step({ onComplete, onSkip, isRequired = false }: Compliance2257StepProps) {
  const [step, setStep] = useState<'overview' | 'id-verification' | 'model-release' | 'complete'>('overview');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch current verification status
  const { data: verificationStatus, isLoading } = useQuery<VerificationStatus>({
    queryKey: ['compliance', '2257', 'status'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/bff/compliance/2257/status`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch verification status');
      return response.json();
    },
  });

  // ID Verification mutation
  const idVerificationMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', 'government_id');

      const response = await fetch(`${import.meta.env.VITE_API_BASE}/bff/compliance/2257/id-verification`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('ID verification upload failed');
      return response.json();
    },
    onSuccess: () => {
      toast.success('ID verification submitted successfully');
      setStep('model-release');
    },
    onError: (error) => {
      toast.error('ID verification failed', {
        description: error.message,
      });
    },
  });

  // Model Release mutation
  const modelReleaseMutation = useMutation({
    mutationFn: async (signatureData: { signature: string; agreementText: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/bff/compliance/2257/model-release`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signatureData),
      });

      if (!response.ok) throw new Error('Model release signing failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Model release signed successfully');
      onComplete({
        idVerificationStatus: 'pending',
        modelReleaseStatus: 'signed',
        verificationId: data.verificationId,
        modelReleaseId: data.modelReleaseId,
      });
      setStep('complete');
    },
    onError: (error) => {
      toast.error('Model release signing failed', {
        description: error.message,
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload a JPEG, PNG, WebP, or PDF file.',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please upload a file smaller than 10MB.',
      });
      return;
    }

    idVerificationMutation.mutate(file);
  };

  const handleModelReleaseSign = () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the terms before signing');
      return;
    }

    const agreementText = `I hereby grant permission for the use of my likeness in adult content and confirm that I am 18 years of age or older. I understand that this content may be distributed and monetized on this platform.`;
    
    modelReleaseMutation.mutate({
      signature: `Digital signature - ${new Date().toISOString()}`,
      agreementText,
    });
  };

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

  const isIdVerified = verificationStatus?.idVerification.status === 'approved';
  const isModelReleaseSigned = verificationStatus?.modelRelease.status === 'signed';
  const isFullyCompliant = isIdVerified && isModelReleaseSigned;

  if (isFullyCompliant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>2257 Compliance Complete</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your account is fully compliant with 18 USC §2257 requirements.
          </p>
          <Button onClick={() => onComplete({
            idVerificationStatus: 'approved',
            modelReleaseStatus: 'signed',
          })}>
            Continue with Upload
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'overview') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>Adult Content Compliance Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              To upload adult content, you must complete 18 USC §2257 compliance verification. 
              This includes ID verification and signing a model release.
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              By proceeding, you agree to our{' '}
              <a 
                href="/legal/terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Terms of Service
              </a>
              {' '}and{' '}
              <a 
                href="/legal/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {isIdVerified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">Government ID Verification</p>
                <p className="text-sm text-muted-foreground">
                  {isIdVerified ? 'Verified' : 'Upload a government-issued photo ID'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isModelReleaseSigned ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">Model Release Agreement</p>
                <p className="text-sm text-muted-foreground">
                  {isModelReleaseSigned ? 'Signed' : 'Digital signature required'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={() => setStep(isIdVerified ? 'model-release' : 'id-verification')}
              className="flex-1"
            >
              Start Verification
            </Button>
            {!isRequired && onSkip && (
              <Button variant="outline" onClick={onSkip}>
                Skip for Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'id-verification') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Government ID Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Upload a clear photo of your government-issued ID (driver's license, passport, or national ID). 
              Your personal information will be encrypted and used only for age verification.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id-upload">Upload ID Document</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, WebP, or PDF (max 10MB)
              </p>
              <input
                id="id-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => document.getElementById('id-upload')?.click()}
                disabled={idVerificationMutation.isPending}
              >
                {idVerificationMutation.isPending ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </div>

          {idVerificationMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setStep('overview')}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'model-release') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Release Agreement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4 max-h-60 overflow-y-auto">
            <h4 className="font-medium mb-2">Model Release Agreement</h4>
            <div className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                I hereby grant permission for the use of my likeness in adult content and confirm that:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>I am 18 years of age or older</li>
                <li>I consent to the creation and distribution of this content</li>
                <li>I understand this content may be monetized on this platform</li>
                <li>I have the right to revoke this consent with 30 days notice</li>
                <li>I understand the compliance requirements under 18 USC §2257</li>
              </ul>
              <p className="mt-4">
                This agreement is governed by the laws of [Jurisdiction] and any disputes will be resolved through binding arbitration.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="agree-terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <Label htmlFor="agree-terms" className="text-sm">
              I have read and agree to the model release agreement above
            </Label>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setStep('overview')}>
              Back
            </Button>
            <Button
              onClick={handleModelReleaseSign}
              disabled={!agreedToTerms || modelReleaseMutation.isPending}
              className="flex-1"
            >
              {modelReleaseMutation.isPending ? 'Signing...' : 'Sign Agreement'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Compliance Complete</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your 2257 compliance verification is complete. You can now upload adult content.
          </p>
          <Button onClick={() => onComplete({
            idVerificationStatus: 'pending',
            modelReleaseStatus: 'signed',
          })}>
            Continue with Upload
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}