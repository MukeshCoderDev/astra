import React from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FileText, Shield, Eye, AlertTriangle } from 'lucide-react';
import { TermsOfService } from './TermsOfService';
import { PrivacyPolicy } from './PrivacyPolicy';
import { DMCAPolicy } from './DMCAPolicy';

function LegalHome() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Legal Information</h1>
        <p className="text-lg text-muted-foreground">
          Important legal documents and policies for our adult content platform
        </p>
      </div>

      {/* Adult Content Warning */}
      <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
              Adult Platform Legal Notice
            </h2>
            <p className="text-red-700 dark:text-red-300 text-sm">
              This platform contains adult content and is subject to specific legal requirements. 
              Please review all legal documents carefully before using our services.
            </p>
          </div>
        </div>
      </Card>

      {/* Legal Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Terms of Service */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Terms of Service</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adult-specific terms and conditions for using our platform, including age verification 
                requirements and content guidelines.
              </p>
              <Button asChild className="w-full">
                <Link to="/legal/terms">Read Terms</Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Privacy Policy */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Privacy Policy</h3>
              <p className="text-sm text-muted-foreground mb-4">
                How we collect, use, and protect your personal information, with enhanced security 
                for adult content platforms.
              </p>
              <Button asChild className="w-full">
                <Link to="/legal/privacy">Read Policy</Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* DMCA Policy */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">DMCA Policy</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Copyright protection procedures, takedown notices, and intellectual property 
                compliance for content creators.
              </p>
              <Button asChild className="w-full">
                <Link to="/legal/dmca">Read Policy</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Legal Highlights */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6">Key Legal Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Age Verification</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Must be 18+ to access platform</li>
              <li>• Must be 21+ to create content</li>
              <li>• Government ID verification required</li>
              <li>• Persistent age consent tracking</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Content Compliance</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 18 USC §2257 record keeping</li>
              <li>• Model release documentation</li>
              <li>• Geographic content restrictions</li>
              <li>• Forensic watermarking available</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Payment Protection</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 3-day escrow for all tips</li>
              <li>• KYC verification for payouts</li>
              <li>• Dispute resolution process</li>
              <li>• Compliance reporting</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Privacy Protection</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Enhanced data security</li>
              <li>• Minimal data collection</li>
              <li>• No marketing data sales</li>
              <li>• Secure compliance storage</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Legal Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <h3 className="font-medium mb-2">General Legal</h3>
            <p className="text-sm text-muted-foreground">legal@example.com</p>
          </div>
          <div className="text-center">
            <h3 className="font-medium mb-2">DMCA Notices</h3>
            <p className="text-sm text-muted-foreground">dmca@example.com</p>
          </div>
          <div className="text-center">
            <h3 className="font-medium mb-2">Privacy Concerns</h3>
            <p className="text-sm text-muted-foreground">privacy@example.com</p>
          </div>
        </div>
      </Card>

      {/* Footer Notice */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          All legal documents are effective as of their respective dates and may be updated from time to time. 
          Please review regularly for any changes.
        </p>
      </div>
    </div>
  );
}

function Legal() {
  const location = useLocation();
  
  return (
    <Routes>
      <Route index element={<LegalHome />} />
      <Route path="terms" element={<TermsOfService />} />
      <Route path="privacy" element={<PrivacyPolicy />} />
      <Route path="dmca" element={<DMCAPolicy />} />
    </Routes>
  );
}

export default Legal;