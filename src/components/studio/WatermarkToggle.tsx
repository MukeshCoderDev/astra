import React from 'react';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Shield, Eye, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WatermarkSettings {
  enabled: boolean;
  accountDefault: boolean;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

interface WatermarkToggleProps {
  settings: WatermarkSettings;
  onUpdate: (settings: WatermarkSettings) => void;
  disabled?: boolean;
  isAccountLevel?: boolean;
  videoTitle?: string;
}

const POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left', icon: '↖' },
  { value: 'top-right', label: 'Top Right', icon: '↗' },
  { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
  { value: 'bottom-right', label: 'Bottom Right', icon: '↘' },
  { value: 'center', label: 'Center', icon: '⊙' },
] as const;

const OPACITY_OPTIONS = [
  { value: 10, label: 'Very Light (10%)' },
  { value: 25, label: 'Light (25%)' },
  { value: 50, label: 'Medium (50%)' },
  { value: 75, label: 'Strong (75%)' },
  { value: 90, label: 'Very Strong (90%)' },
];

export function WatermarkToggle({ 
  settings, 
  onUpdate, 
  disabled = false,
  isAccountLevel = false,
  videoTitle 
}: WatermarkToggleProps) {
  const handleToggle = (enabled: boolean) => {
    onUpdate({ ...settings, enabled });
  };

  const handleAccountDefaultToggle = (accountDefault: boolean) => {
    onUpdate({ ...settings, accountDefault });
  };

  const handleOpacityChange = (opacity: number) => {
    onUpdate({ ...settings, opacity });
  };

  const handlePositionChange = (position: WatermarkSettings['position']) => {
    onUpdate({ ...settings, position });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Forensic Watermarking</h3>
          <p className="text-sm text-muted-foreground">
            {isAccountLevel 
              ? 'Set default watermark settings for all new uploads'
              : `Configure watermark for ${videoTitle || 'this video'}`
            }
          </p>
        </div>
      </div>

      {/* Information Banner */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              What is forensic watermarking?
            </p>
            <p className="text-blue-700 dark:text-blue-300 mb-2">
              Forensic watermarks embed unique, invisible identifiers into each viewer's video stream. 
              This helps track unauthorized distribution while maintaining video quality.
            </p>
            <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1">
              <li>• Each viewer gets a unique watermark tied to their session</li>
              <li>• Watermarks are invisible during normal playback</li>
              <li>• Helps identify the source of leaked content</li>
              <li>• Minimal impact on video quality and loading times</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Switch
            id="watermark-enabled"
            checked={settings.enabled}
            onCheckedChange={handleToggle}
            disabled={disabled}
          />
          <Label htmlFor="watermark-enabled" className="text-base font-medium">
            Enable Forensic Watermarking
          </Label>
        </div>
        {settings.enabled && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
        )}
      </div>

      {/* Account Default Toggle (only for account level) */}
      {isAccountLevel && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Switch
                id="watermark-default"
                checked={settings.accountDefault}
                onCheckedChange={handleAccountDefaultToggle}
                disabled={disabled || !settings.enabled}
              />
              <Label htmlFor="watermark-default" className="text-base">
                Enable by default for new uploads
              </Label>
            </div>
          </div>
          <Separator className="mb-6" />
        </>
      )}

      {/* Configuration Options */}
      {settings.enabled && (
        <div className="space-y-6">
          {/* Opacity Settings */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Watermark Strength
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {OPACITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOpacityChange(option.value)}
                  disabled={disabled}
                  className={cn(
                    "p-3 text-left border rounded-lg transition-colors",
                    "hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed",
                    settings.opacity === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border"
                  )}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.value === 10 && "Barely visible, maximum quality"}
                    {option.value === 25 && "Light protection, good quality"}
                    {option.value === 50 && "Balanced protection and quality"}
                    {option.value === 75 && "Strong protection, slight quality impact"}
                    {option.value === 90 && "Maximum protection, visible impact"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Position Settings */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Watermark Position
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {POSITION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePositionChange(option.value)}
                  disabled={disabled}
                  className={cn(
                    "p-3 text-center border rounded-lg transition-colors",
                    "hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed",
                    settings.position === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border"
                  )}
                >
                  <div className="text-lg mb-1">{option.icon}</div>
                  <div className="text-xs font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Preview
            </Label>
            <div className="relative bg-muted rounded-lg aspect-video max-w-md">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Video Preview</p>
                </div>
              </div>
              
              {/* Watermark Position Indicator */}
              <div 
                className={cn(
                  "absolute w-16 h-8 bg-primary/20 border border-primary/40 rounded flex items-center justify-center",
                  settings.position === 'top-left' && "top-2 left-2",
                  settings.position === 'top-right' && "top-2 right-2",
                  settings.position === 'bottom-left' && "bottom-2 left-2",
                  settings.position === 'bottom-right' && "bottom-2 right-2",
                  settings.position === 'center' && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                )}
                style={{ opacity: settings.opacity / 100 }}
              >
                <span className="text-xs text-primary font-mono">WM</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Watermark opacity: {settings.opacity}% • Position: {POSITION_OPTIONS.find(p => p.value === settings.position)?.label}
            </p>
          </div>

          {/* Warning for High Opacity */}
          {settings.opacity > 50 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  High watermark strength may impact viewer experience
                </span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                Consider using lower opacity (25-50%) for better balance between protection and quality.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Disabled State Message */}
      {!settings.enabled && (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            Forensic watermarking is disabled for this {isAccountLevel ? 'account' : 'video'}
          </p>
          <p className="text-xs mt-1">
            Enable to add unique tracking identifiers to each viewer's stream
          </p>
        </div>
      )}
    </Card>
  );
}