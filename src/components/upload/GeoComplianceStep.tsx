import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { GeoRestrictionEditor } from '../studio/GeoRestrictionEditor';
import { WatermarkToggle } from '../studio/WatermarkToggle';
import { Globe, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGeoRestriction } from '../../hooks/useGeoRestriction';

interface GeoComplianceStepProps {
  videoTitle: string;
  initialGeoRestriction?: string[];
  initialWatermark?: {
    enabled: boolean;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  onUpdate: (settings: {
    geoRestriction: string[];
    watermark: {
      enabled: boolean;
      opacity: number;
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    };
  }) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

export function GeoComplianceStep({
  videoTitle,
  initialGeoRestriction = [],
  initialWatermark = {
    enabled: false,
    opacity: 25,
    position: 'bottom-right',
  },
  onUpdate,
  onNext,
  onBack,
  disabled = false,
}: GeoComplianceStepProps) {
  const { accountSettings } = useGeoRestriction();
  
  const [geoRestriction, setGeoRestriction] = useState<string[]>(
    initialGeoRestriction.length > 0 
      ? initialGeoRestriction 
      : accountSettings?.defaultGeoRestriction.blockedCountries || []
  );
  
  const [watermarkSettings, setWatermarkSettings] = useState({
    enabled: initialWatermark.enabled || accountSettings?.defaultWatermark.enabled || false,
    accountDefault: false,
    opacity: initialWatermark.opacity || accountSettings?.defaultWatermark.opacity || 25,
    position: initialWatermark.position || accountSettings?.defaultWatermark.position || 'bottom-right' as const,
  });

  const [hasConfiguredGeo, setHasConfiguredGeo] = useState(initialGeoRestriction.length > 0);
  const [hasConfiguredWatermark, setHasConfiguredWatermark] = useState(initialWatermark.enabled);

  const handleGeoRestrictionUpdate = (blockedCountries: string[]) => {
    setGeoRestriction(blockedCountries);
    setHasConfiguredGeo(true);
    
    const settings = {
      geoRestriction: blockedCountries,
      watermark: {
        enabled: watermarkSettings.enabled,
        opacity: watermarkSettings.opacity,
        position: watermarkSettings.position,
      },
    };
    
    onUpdate(settings);
  };

  const handleWatermarkUpdate = (settings: typeof watermarkSettings) => {
    setWatermarkSettings(settings);
    setHasConfiguredWatermark(true);
    
    const updateData = {
      geoRestriction,
      watermark: {
        enabled: settings.enabled,
        opacity: settings.opacity,
        position: settings.position,
      },
    };
    
    onUpdate(updateData);
  };

  const handleNext = () => {
    // Ensure settings are saved before proceeding
    const settings = {
      geoRestriction,
      watermark: {
        enabled: watermarkSettings.enabled,
        opacity: watermarkSettings.opacity,
        position: watermarkSettings.position,
      },
    };
    
    onUpdate(settings);
    onNext();
  };

  const isCompliant = hasConfiguredGeo && hasConfiguredWatermark;
  const hasRestrictions = geoRestriction.length > 0;
  const hasWatermark = watermarkSettings.enabled;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Content Compliance Settings</h2>
        <p className="text-muted-foreground">
          Configure geographic restrictions and forensic watermarking for "{videoTitle}"
        </p>
      </div>

      {/* Compliance Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCompliant ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <div>
              <h3 className="font-medium">
                {isCompliant ? 'Compliance Configured' : 'Compliance Setup Required'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isCompliant 
                  ? 'Your content compliance settings have been configured'
                  : 'Please review and configure your compliance settings'
                }
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className={hasRestrictions ? 'text-orange-600' : 'text-green-600'}>
                {hasRestrictions ? `${geoRestriction.length} blocked` : 'No restrictions'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className={hasWatermark ? 'text-green-600' : 'text-muted-foreground'}>
                {hasWatermark ? 'Watermark enabled' : 'No watermark'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Geographic Restrictions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Geographic Restrictions</h3>
          {hasConfiguredGeo && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </div>
        
        <GeoRestrictionEditor
          blockedCountries={geoRestriction}
          onUpdate={handleGeoRestrictionUpdate}
          disabled={disabled}
        />
      </div>

      <Separator />

      {/* Forensic Watermarking */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Forensic Watermarking</h3>
          {hasConfiguredWatermark && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </div>
        
        <WatermarkToggle
          settings={watermarkSettings}
          onUpdate={handleWatermarkUpdate}
          disabled={disabled}
          videoTitle={videoTitle}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={disabled}
        >
          Back
        </Button>
        
        <div className="flex items-center gap-3">
          {!isCompliant && (
            <div className="text-sm text-muted-foreground">
              Configure both settings to continue
            </div>
          )}
          
          <Button
            onClick={handleNext}
            disabled={disabled || !isCompliant}
          >
            Continue to Publish
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          These settings help ensure compliance with content distribution regulations.
          You can modify these settings later in your Studio dashboard.
        </p>
      </div>
    </div>
  );
}