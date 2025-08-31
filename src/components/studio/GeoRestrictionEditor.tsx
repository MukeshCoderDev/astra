import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Globe, Shield, AlertTriangle } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  region: string;
}

interface GeoRestrictionEditorProps {
  blockedCountries?: string[];
  onUpdate: (blockedCountries: string[]) => void;
  disabled?: boolean;
}

// Common countries that may require geo-blocking for adult content
const COUNTRIES: Country[] = [
  // North America
  { code: 'US', name: 'United States', region: 'North America' },
  { code: 'CA', name: 'Canada', region: 'North America' },
  { code: 'MX', name: 'Mexico', region: 'North America' },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', region: 'Europe' },
  { code: 'DE', name: 'Germany', region: 'Europe' },
  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'IT', name: 'Italy', region: 'Europe' },
  { code: 'ES', name: 'Spain', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', region: 'Europe' },
  { code: 'SE', name: 'Sweden', region: 'Europe' },
  { code: 'NO', name: 'Norway', region: 'Europe' },
  { code: 'DK', name: 'Denmark', region: 'Europe' },
  { code: 'FI', name: 'Finland', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', region: 'Europe' },
  { code: 'AT', name: 'Austria', region: 'Europe' },
  { code: 'BE', name: 'Belgium', region: 'Europe' },
  { code: 'IE', name: 'Ireland', region: 'Europe' },
  { code: 'PT', name: 'Portugal', region: 'Europe' },
  { code: 'PL', name: 'Poland', region: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', region: 'Europe' },
  { code: 'HU', name: 'Hungary', region: 'Europe' },
  { code: 'RO', name: 'Romania', region: 'Europe' },
  { code: 'BG', name: 'Bulgaria', region: 'Europe' },
  { code: 'HR', name: 'Croatia', region: 'Europe' },
  { code: 'SI', name: 'Slovenia', region: 'Europe' },
  { code: 'SK', name: 'Slovakia', region: 'Europe' },
  { code: 'EE', name: 'Estonia', region: 'Europe' },
  { code: 'LV', name: 'Latvia', region: 'Europe' },
  { code: 'LT', name: 'Lithuania', region: 'Europe' },
  
  // Asia Pacific
  { code: 'AU', name: 'Australia', region: 'Asia Pacific' },
  { code: 'NZ', name: 'New Zealand', region: 'Asia Pacific' },
  { code: 'JP', name: 'Japan', region: 'Asia Pacific' },
  { code: 'KR', name: 'South Korea', region: 'Asia Pacific' },
  { code: 'SG', name: 'Singapore', region: 'Asia Pacific' },
  { code: 'HK', name: 'Hong Kong', region: 'Asia Pacific' },
  { code: 'TW', name: 'Taiwan', region: 'Asia Pacific' },
  { code: 'MY', name: 'Malaysia', region: 'Asia Pacific' },
  { code: 'TH', name: 'Thailand', region: 'Asia Pacific' },
  { code: 'PH', name: 'Philippines', region: 'Asia Pacific' },
  { code: 'ID', name: 'Indonesia', region: 'Asia Pacific' },
  { code: 'VN', name: 'Vietnam', region: 'Asia Pacific' },
  { code: 'IN', name: 'India', region: 'Asia Pacific' },
  
  // Middle East & Africa
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East & Africa' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East & Africa' },
  { code: 'IL', name: 'Israel', region: 'Middle East & Africa' },
  { code: 'ZA', name: 'South Africa', region: 'Middle East & Africa' },
  { code: 'EG', name: 'Egypt', region: 'Middle East & Africa' },
  { code: 'TR', name: 'Turkey', region: 'Middle East & Africa' },
  
  // South America
  { code: 'BR', name: 'Brazil', region: 'South America' },
  { code: 'AR', name: 'Argentina', region: 'South America' },
  { code: 'CL', name: 'Chile', region: 'South America' },
  { code: 'CO', name: 'Colombia', region: 'South America' },
  { code: 'PE', name: 'Peru', region: 'South America' },
  { code: 'UY', name: 'Uruguay', region: 'South America' },
];

// US states that commonly restrict adult content
const US_STATES = [
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VA', name: 'Virginia' },
  { code: 'FL', name: 'Florida' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'MT', name: 'Montana' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'LA', name: 'Louisiana' },
];

export function GeoRestrictionEditor({ 
  blockedCountries = [], 
  onUpdate, 
  disabled = false 
}: GeoRestrictionEditorProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(blockedCountries);
  const [showUSStates, setShowUSStates] = useState(false);

  const groupedCountries = COUNTRIES.reduce((acc, country) => {
    if (!acc[country.region]) {
      acc[country.region] = [];
    }
    acc[country.region].push(country);
    return acc;
  }, {} as Record<string, Country[]>);

  const handleCountryToggle = (countryCode: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedCountries, countryCode]
      : selectedCountries.filter(code => code !== countryCode);
    
    setSelectedCountries(updated);
  };

  const handleRegionToggle = (region: string, checked: boolean) => {
    const regionCountries = groupedCountries[region].map(c => c.code);
    const updated = checked
      ? [...new Set([...selectedCountries, ...regionCountries])]
      : selectedCountries.filter(code => !regionCountries.includes(code));
    
    setSelectedCountries(updated);
  };

  const handleSave = () => {
    onUpdate(selectedCountries);
  };

  const handleReset = () => {
    setSelectedCountries(blockedCountries);
  };

  const isRegionFullySelected = (region: string) => {
    const regionCountries = groupedCountries[region].map(c => c.code);
    return regionCountries.every(code => selectedCountries.includes(code));
  };

  const isRegionPartiallySelected = (region: string) => {
    const regionCountries = groupedCountries[region].map(c => c.code);
    return regionCountries.some(code => selectedCountries.includes(code)) && 
           !regionCountries.every(code => selectedCountries.includes(code));
  };

  const hasChanges = JSON.stringify(selectedCountries.sort()) !== JSON.stringify(blockedCountries.sort());

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Geographic Restrictions</h3>
          <p className="text-sm text-muted-foreground">
            Block access to your content in specific countries or regions
          </p>
        </div>
      </div>

      {selectedCountries.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Content will be blocked in {selectedCountries.length} location{selectedCountries.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-300">
            Geo-blocking is enforced at the CDN level. Users may still access content through VPNs.
          </p>
        </div>
      )}

      <div className="space-y-6 max-h-96 overflow-y-auto">
        {Object.entries(groupedCountries).map(([region, countries]) => (
          <div key={region}>
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id={`region-${region}`}
                checked={isRegionFullySelected(region)}
                onCheckedChange={(checked) => handleRegionToggle(region, checked as boolean)}
                disabled={disabled}
                className={isRegionPartiallySelected(region) ? 'data-[state=checked]:bg-orange-500' : ''}
              />
              <Label 
                htmlFor={`region-${region}`} 
                className="text-sm font-medium cursor-pointer"
              >
                {region}
                {isRegionPartiallySelected(region) && (
                  <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                    (Partial)
                  </span>
                )}
              </Label>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6 mb-4">
              {countries.map((country) => (
                <div key={country.code} className="flex items-center gap-2">
                  <Checkbox
                    id={`country-${country.code}`}
                    checked={selectedCountries.includes(country.code)}
                    onCheckedChange={(checked) => handleCountryToggle(country.code, checked as boolean)}
                    disabled={disabled}
                  />
                  <Label 
                    htmlFor={`country-${country.code}`} 
                    className="text-sm cursor-pointer"
                  >
                    {country.name}
                  </Label>
                </div>
              ))}
            </div>
            
            <Separator />
          </div>
        ))}

        {/* US State-level restrictions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUSStates(!showUSStates)}
              disabled={disabled}
              className="p-0 h-auto font-medium text-sm"
            >
              <Shield className="h-4 w-4 mr-2" />
              US State Restrictions
              <span className="ml-2 text-xs text-muted-foreground">
                {showUSStates ? '(Hide)' : '(Show)'}
              </span>
            </Button>
          </div>
          
          {showUSStates && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6 mb-4">
              {US_STATES.map((state) => (
                <div key={`US-${state.code}`} className="flex items-center gap-2">
                  <Checkbox
                    id={`state-${state.code}`}
                    checked={selectedCountries.includes(`US-${state.code}`)}
                    onCheckedChange={(checked) => handleCountryToggle(`US-${state.code}`, checked as boolean)}
                    disabled={disabled}
                  />
                  <Label 
                    htmlFor={`state-${state.code}`} 
                    className="text-sm cursor-pointer"
                  >
                    {state.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {selectedCountries.length} location{selectedCountries.length !== 1 ? 's' : ''} blocked
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={disabled || !hasChanges}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={disabled || !hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}