import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadDropzone, UploadProgress, VideoDetailsForm } from '../../components/upload';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useUploader } from '../../hooks/useUploader';
import { VideoMetadata } from '../../types';

type UploadStep = 'select' | 'upload' | 'details' | 'complete';

function Upload() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<Partial<VideoMetadata>>({});

  const {
    uploadSession,
    isUploading,
    isPaused,
    progress,
    error,
    uploadStats,
    startUpload,
    resumeUpload,
    pauseUpload,
    cancelUpload,
    retryUpload
  } = useUploader({
    onProgress: (progress) => {
      console.log('Upload progress:', progress);
    },
    onSuccess: (uploadUrl) => {
      console.log('Upload completed:', uploadUrl);
      setCurrentStep('details');
    },
    onError: (error) => {
      console.error('Upload error:', error);
    }
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCurrentStep('upload');
    
    // Start upload immediately with basic metadata
    startUpload(file, {
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      visibility: 'draft'
    });
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setCurrentStep('select');
    cancelUpload();
  };

  const handleVideoDetailsSubmit = async (data: any) => {
    try {
      // In a real implementation, this would submit the video metadata
      // along with the upload URL to your backend
      console.log('Publishing video with metadata:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVideoMetadata(data);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Failed to publish video:', error);
    }
  };

  const handleSaveDraft = async (data: any) => {
    try {
      console.log('Saving draft:', data);
      // Save draft logic here
      setVideoMetadata(data);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'select':
        return 'Select Video File';
      case 'upload':
        return 'Uploading Video';
      case 'details':
        return 'Video Details';
      case 'complete':
        return 'Upload Complete';
      default:
        return 'Upload Video';
    }
  };

  const canGoBack = currentStep !== 'select' && !isUploading;

  const handleGoBack = () => {
    switch (currentStep) {
      case 'upload':
        if (!isUploading) {
          setCurrentStep('select');
          setSelectedFile(null);
          cancelUpload();
        }
        break;
      case 'details':
        // Can't go back during upload, but can go back to upload step if completed
        if (uploadSession?.status === 'completed') {
          setCurrentStep('upload');
        }
        break;
      case 'complete':
        navigate('/studio');
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {canGoBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{getStepTitle()}</h1>
          <p className="text-muted-foreground">
            {currentStep === 'select' && 'Choose a video file to upload'}
            {currentStep === 'upload' && 'Your video is being uploaded'}
            {currentStep === 'details' && 'Add details to publish your video'}
            {currentStep === 'complete' && 'Your video has been uploaded successfully'}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${
              currentStep === 'select' ? 'text-primary' : 
              ['upload', 'details', 'complete'].includes(currentStep) ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'select' ? 'bg-primary text-primary-foreground' :
                ['upload', 'details', 'complete'].includes(currentStep) ? 'bg-green-600 text-white' : 'bg-muted'
              }`}>
                {['upload', 'details', 'complete'].includes(currentStep) ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium">Select File</span>
            </div>

            <Separator orientation="horizontal" className="w-12" />

            <div className={`flex items-center gap-2 ${
              currentStep === 'upload' ? 'text-primary' : 
              ['details', 'complete'].includes(currentStep) ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'upload' ? 'bg-primary text-primary-foreground' :
                ['details', 'complete'].includes(currentStep) ? 'bg-green-600 text-white' : 'bg-muted'
              }`}>
                {['details', 'complete'].includes(currentStep) ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>

            <Separator orientation="horizontal" className="w-12" />

            <div className={`flex items-center gap-2 ${
              currentStep === 'details' ? 'text-primary' : 
              currentStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'details' ? 'bg-primary text-primary-foreground' :
                currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-muted'
              }`}>
                {currentStep === 'complete' ? '✓' : '3'}
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>

            <Separator orientation="horizontal" className="w-12" />

            <div className={`flex items-center gap-2 ${
              currentStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-muted'
              }`}>
                {currentStep === 'complete' ? '✓' : '4'}
              </div>
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: File Selection */}
        {currentStep === 'select' && (
          <UploadDropzone
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            error={error}
          />
        )}

        {/* Step 2: Upload Progress */}
        {currentStep === 'upload' && selectedFile && (
          <div className="space-y-4">
            <UploadProgress
              file={selectedFile}
              progress={progress}
              status={
                error ? 'failed' :
                isPaused ? 'paused' :
                isUploading ? 'uploading' :
                progress === 100 ? 'completed' : 'uploading'
              }
              speed={uploadStats?.speed}
              timeRemaining={uploadStats?.timeRemaining}
              error={error}
              onPause={pauseUpload}
              onResume={resumeUpload}
              onCancel={handleFileRemove}
              onRetry={retryUpload}
            />

            {/* Upload Tips */}
            <Card className="p-4">
              <h3 className="font-medium mb-2">Upload Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep this tab open during upload</li>
                <li>• Upload will resume automatically if interrupted</li>
                <li>• You can pause and resume the upload at any time</li>
                <li>• Larger files may take longer to process after upload</li>
              </ul>
            </Card>
          </div>
        )}

        {/* Step 3: Video Details */}
        {currentStep === 'details' && (
          <VideoDetailsForm
            initialData={videoMetadata}
            onSubmit={handleVideoDetailsSubmit}
            onSaveDraft={handleSaveDraft}
          />
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Upload Complete!</h2>
                <p className="text-muted-foreground">
                  Your video has been uploaded and published successfully.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button onClick={() => navigate('/studio')}>
                  Go to Studio
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default Upload;