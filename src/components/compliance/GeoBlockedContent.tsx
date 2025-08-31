import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Globe, MapPin, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useGeoBlockCheck } from '../../hooks/useGeoRestriction';
import { useNavigate } from 'react-router-dom';

interface GeoBlockedContentProps {
  videoTitle?: string;
  creatorName?: string;
  blockedCountries: string[];
  userCountry?: string;
  onRetry?: () => void;
}

const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'AU': 'Australia',
  'JP': 'Japan',
  'KR': 'South Korea',
  'BR': 'Brazil',
  'IN': 'India',
  'CN': 'China',
  'RU': 'Russia',
  'MX': 'Mexico',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'TR': 'Turkey',
  'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates',
  'IL': 'Israel',
  'SG': 'Singapore',
  'MY': 'Malaysia',
  'TH': 'Thailand',
  'PH': 'Philippines',
  'ID': 'Indonesia',
  'VN': 'Vietnam',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'NZ': 'New Zealand',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'IE': 'Ireland',
  'PT': 'Portugal',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'EE': 'Estonia',
  'LV': 'Latvia',
  'LT': 'Lithuania',
  'UY': 'Uruguay',
  // US States
  'US-TX': 'Texas, United States',
  'US-UT': 'Utah, United States',
  'US-VA': 'Virginia, United States',
  'US-FL': 'Florida, United States',
  'US-NC': 'North Carolina, United States',
  'US-MT': 'Montana, United States',
  'US-AR': 'Arkansas, United States',
  'US-MS': 'Mississippi, United States',
  'US-LA': 'Louisiana, United States',
};

export function GeoBlockedContent({
  videoTitle = 'this content',
  creatorName,
  blockedCountries,
  userCountry,
  onRetry,
}: GeoBlockedContentProps) {
  const navigate = useNavigate();
  const { userLocation, detectUserLocation, isDetecting } = useGeoBlockCheck();
  const [detectedCountry, setDetectedCountry] = useState<string | null>(userCountry || userLocation);

  useEffect(() => {
    if (!detectedCountry && !isDetecting) {
      detectUserLocation().then(setDetectedCountry);
    }
  }, [detectedCountry, isDetecting, detectUserLocation]);

  const currentCountry = detectedCountry || userCountry;
  const currentCountryName = currentCountry ? COUNTRY_NAMES[currentCountry] || currentCountry : 'your location';
  
  const blockedCountryNames = blockedCountries
    .map(code => COUNTRY_NAMES[code] || code)
    .slice(0, 5); // Show max 5 countries

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <Globe className="h-8 w-8 text-orange-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Content Not Available</h1>
          <p className="text-muted-foreground">
            {videoTitle} is not available in {currentCountryName}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Geographic Restriction
              </span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {creatorName ? `${creatorName} has` : 'The creator has'} restricted this content 
              from being viewed in certain locations due to legal or licensing requirements.
            </p>
          </div>

          {currentCountry && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Detected location: {currentCountryName}</span>
            </div>
          )}

          {blockedCountryNames.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">This content is restricted in:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {blockedCountryNames.map((country, index) => (
                  <span key={country} className="px-2 py-1 bg-muted rounded text-xs">
                    {country}
                    {index < blockedCountryNames.length - 1 && blockedCountries.length <= 5 ? ',' : ''}
                  </span>
                ))}
                {blockedCountries.length > 5 && (
                  <span className="px-2 py-1 bg-muted rounded text-xs">
                    +{blockedCountries.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="w-full"
              disabled={isDetecting}
            >
              {isDetecting ? 'Checking location...' : 'Retry'}
            </Button>
          )}
          
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <Button
            onClick={handleGoHome}
            className="w-full"
          >
            Browse Other Content
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
          <p>
            If you believe this is an error, please contact support or try accessing 
            the content from a different location.
          </p>
        </div>
      </Card>
    </div>
  );
}