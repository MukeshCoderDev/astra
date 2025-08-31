import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { AlertTriangle, Shield, Users, DollarSign, Eye, Clock, FileText, Mail } from 'lucide-react';

export function TermsOfService() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-lg text-muted-foreground">
          Adult Content Platform Terms and Conditions
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Age Warning */}
      <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
              18+ Adult Content Platform
            </h2>
            <p className="text-red-700 dark:text-red-300 text-sm">
              This platform contains adult content and is intended solely for users 18 years of age or older. 
              By accessing this platform, you confirm that you are at least 18 years old and consent to viewing 
              adult content. If you are under 18, you must leave immediately.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Navigation */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={() => scrollToSection('acceptance')}
            className="justify-start"
          >
            <FileText className="h-4 w-4 mr-2" />
            Acceptance
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('age-verification')}
            className="justify-start"
          >
            <Shield className="h-4 w-4 mr-2" />
            Age Verification
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('content-rules')}
            className="justify-start"
          >
            <Eye className="h-4 w-4 mr-2" />
            Content Rules
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('payments')}
            className="justify-start"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Payments
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('compliance')}
            className="justify-start"
          >
            <Users className="h-4 w-4 mr-2" />
            Compliance
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('contact')}
            className="justify-start"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </Card>

      {/* Acceptance */}
      <Card className="p-8" id="acceptance">
        <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            By accessing or using our Web3 Content Platform ("Platform"), you agree to be bound by these 
            Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use 
            the Platform.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you and Web3 Content Platform 
            ("Company", "we", "us", or "our"). We may modify these Terms at any time, and such 
            modifications will be effective immediately upon posting.
          </p>
        </div>
      </Card>

      {/* Age Verification */}
      <Card className="p-8" id="age-verification">
        <h2 className="text-2xl font-bold mb-4">2. Age Verification and Adult Content</h2>
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                  Mandatory Age Verification
                </p>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  You must be at least 18 years old to access this platform. Age verification is 
                  required and may include government-issued ID verification in certain jurisdictions.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-muted-foreground">
            <h3 className="text-lg font-semibold text-foreground">Age Requirements</h3>
            <ul className="space-y-2 text-sm">
              <li>• You must be at least 18 years of age to access any part of this platform</li>
              <li>• You must be at least 21 years of age to create content or earn money on this platform</li>
              <li>• Age verification may be required through government-issued identification</li>
              <li>• False age representation may result in immediate account termination and legal action</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Adult Content Acknowledgment</h3>
            <ul className="space-y-2 text-sm">
              <li>• This platform contains explicit adult content including nudity and sexual activity</li>
              <li>• You voluntarily choose to access this adult content and assume all responsibility</li>
              <li>• You will not access this platform from locations where adult content is prohibited</li>
              <li>• You understand that content may be subject to geographic restrictions</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Content Rules */}
      <Card className="p-8" id="content-rules">
        <h2 className="text-2xl font-bold mb-4">3. Content Guidelines and Restrictions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Permitted Content</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Adult content featuring consenting adults (18+) only</li>
              <li>• Original content that you own or have proper licensing for</li>
              <li>• Content that complies with 18 USC §2257 record-keeping requirements</li>
              <li>• Content that respects intellectual property rights</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Prohibited Content</h3>
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <ul className="space-y-2 text-sm text-red-700 dark:text-red-300">
                <li>• Content involving minors (under 18) in any context</li>
                <li>• Non-consensual content or revenge pornography</li>
                <li>• Content depicting violence, abuse, or illegal activities</li>
                <li>• Copyrighted material without proper authorization</li>
                <li>• Content that violates any applicable laws or regulations</li>
                <li>• Misleading or fraudulent content</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Content Moderation</h3>
            <p className="text-sm text-muted-foreground mb-3">
              We reserve the right to review, moderate, and remove content at our discretion:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Content may be subject to pre-publication review</li>
              <li>• Reported content will be reviewed within 24-48 hours</li>
              <li>• Violations may result in content removal and account penalties</li>
              <li>• Repeat violations may result in permanent account termination</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Payments */}
      <Card className="p-8" id="payments">
        <h2 className="text-2xl font-bold mb-4">4. Payments and Financial Terms</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Payment Processing</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• All payments are processed through our walletless Web3 system</li>
              <li>• Tips and payments are made in USDC (USD Coin)</li>
              <li>• Payment processing fees may apply to transactions</li>
              <li>• Minimum payout thresholds may apply for creators</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Escrow and Dispute Resolution</h3>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    3-Day Escrow Period
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    All tips are held in escrow for 3 days to allow for dispute resolution. 
                    Funds may be frozen pending investigation of reported violations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Creator Earnings</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Creators retain a percentage of tips received (platform fee applies)</li>
              <li>• KYC verification required for payouts above certain thresholds</li>
              <li>• Tax reporting obligations may apply based on jurisdiction</li>
              <li>• Earnings may be subject to withholding for compliance purposes</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Compliance */}
      <Card className="p-8" id="compliance">
        <h2 className="text-2xl font-bold mb-4">5. Legal Compliance and Record Keeping</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">18 USC §2257 Compliance</h3>
            <div className="space-y-3 text-muted-foreground">
              <p className="text-sm">
                All content creators must comply with federal record-keeping requirements:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Government-issued photo identification verification required</li>
                <li>• Model release forms must be completed for all performers</li>
                <li>• Records must be maintained and available for inspection</li>
                <li>• Failure to comply may result in content removal and account termination</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Geographic Restrictions</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Content may be subject to geographic restrictions based on local laws:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Creators may set country-specific content blocking</li>
              <li>• Platform may enforce additional restrictions based on legal requirements</li>
              <li>• Users accessing from restricted locations may be blocked</li>
              <li>• VPN or proxy use to circumvent restrictions is prohibited</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Forensic Watermarking</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Content may include forensic watermarks for security and compliance:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Unique session identifiers may be embedded in video content</li>
              <li>• Watermarks help prevent unauthorized distribution</li>
              <li>• Creators can enable/disable watermarking per video</li>
              <li>• Watermark removal or circumvention is strictly prohibited</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* User Responsibilities */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">6. User Responsibilities</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>By using this platform, you agree to:</p>
          <ul className="space-y-2 text-sm">
            <li>• Provide accurate and truthful information during registration</li>
            <li>• Maintain the security and confidentiality of your account</li>
            <li>• Comply with all applicable laws and regulations</li>
            <li>• Respect the rights and privacy of other users</li>
            <li>• Report violations of these Terms or illegal content</li>
            <li>• Accept responsibility for all activity on your account</li>
          </ul>
        </div>
      </Card>

      {/* Termination */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">7. Account Termination</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>We may terminate or suspend your account immediately, without prior notice, for:</p>
          <ul className="space-y-2 text-sm">
            <li>• Violation of these Terms of Service</li>
            <li>• Uploading prohibited or illegal content</li>
            <li>• Fraudulent or deceptive practices</li>
            <li>• Failure to complete required age or identity verification</li>
            <li>• Repeated copyright infringement (DMCA violations)</li>
            <li>• Any conduct that we deem harmful to the platform or other users</li>
          </ul>
          
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg mt-4">
            <p className="text-red-700 dark:text-red-300 text-sm">
              <strong>Account Termination Consequences:</strong> Upon termination, you will lose access 
              to your account, content, and any pending earnings. We are not obligated to provide 
              refunds or compensation for terminated accounts.
            </p>
          </div>
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">8. Disclaimers and Limitation of Liability</h2>
        <div className="space-y-4 text-muted-foreground">
          <p className="text-sm">
            THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL 
            WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF 
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="text-sm">
            IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
            OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, 
            GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-8" id="contact">
        <h2 className="text-2xl font-bold mb-4">9. Contact Information</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            If you have questions about these Terms of Service, please contact us:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Legal Department</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Email: legal@example.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Address: 123 Legal Street, Suite 100<br />San Francisco, CA 94105</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Support Team</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Email: support@example.com</p>
                <p>Hours: 24/7 Support Available</p>
                <p>Response Time: Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          These Terms of Service are effective as of the date listed above and may be updated from time to time. 
          Continued use of the platform after changes constitutes acceptance of the new terms.
        </p>
      </div>
    </div>
  );
}