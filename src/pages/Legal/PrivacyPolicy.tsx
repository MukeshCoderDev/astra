import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Shield, Eye, Database, Cookie, Mail, FileText, Users, Lock, AlertTriangle } from 'lucide-react';

export function PrivacyPolicy() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">
          How We Collect, Use, and Protect Your Personal Information
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Adult Content Warning */}
      <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
              Adult Platform Privacy Notice
            </h2>
            <p className="text-red-700 dark:text-red-300 text-sm">
              This privacy policy applies to an adult content platform. We handle sensitive personal 
              information with the highest level of security and discretion. Your privacy is paramount 
              to us, especially given the sensitive nature of adult content.
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
            onClick={() => scrollToSection('information-collection')}
            className="justify-start"
          >
            <Database className="h-4 w-4 mr-2" />
            Data Collection
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('usage')}
            className="justify-start"
          >
            <Eye className="h-4 w-4 mr-2" />
            How We Use Data
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('sharing')}
            className="justify-start"
          >
            <Users className="h-4 w-4 mr-2" />
            Data Sharing
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('security')}
            className="justify-start"
          >
            <Lock className="h-4 w-4 mr-2" />
            Security
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('rights')}
            className="justify-start"
          >
            <Shield className="h-4 w-4 mr-2" />
            Your Rights
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('contact')}
            className="justify-start"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Us
          </Button>
        </div>
      </Card>

      {/* Information Collection */}
      <Card className="p-8" id="information-collection">
        <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
            <p className="text-muted-foreground mb-3">
              We collect personal information that you provide directly to us:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Account information (username, email address, password)</li>
              <li>• Profile information (display name, bio, profile picture)</li>
              <li>• Age verification data (date of birth, government ID for verification)</li>
              <li>• Payment information (wallet addresses, transaction history)</li>
              <li>• Communication data (messages, support tickets)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Content and Usage Data</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Videos, images, and other content you upload</li>
              <li>• Metadata associated with your content (titles, descriptions, tags)</li>
              <li>• Viewing history and preferences</li>
              <li>• Interaction data (likes, tips, comments, follows)</li>
              <li>• Search queries and browsing behavior</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Technical Information</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• IP address and geographic location</li>
              <li>• Device information (browser type, operating system)</li>
              <li>• Usage analytics and performance metrics</li>
              <li>• Cookies and similar tracking technologies</li>
              <li>• Session data and authentication tokens</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Compliance and Verification Data</h3>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>18 USC §2257 Compliance:</strong> For content creators, we collect and maintain 
                government-issued identification, model releases, and other documentation required by 
                federal law. This information is stored securely and accessed only as required for 
                legal compliance.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* How We Use Information */}
      <Card className="p-8" id="usage">
        <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Platform Operations</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Provide and maintain platform services</li>
              <li>• Process payments and financial transactions</li>
              <li>• Authenticate users and prevent fraud</li>
              <li>• Personalize content recommendations</li>
              <li>• Enable communication between users</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Legal Compliance</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Verify age and identity as required by law</li>
              <li>• Maintain records for 18 USC §2257 compliance</li>
              <li>• Respond to legal requests and court orders</li>
              <li>• Enforce geographic content restrictions</li>
              <li>• Report suspicious or illegal activity</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Safety and Security</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Monitor for prohibited content and behavior</li>
              <li>• Investigate reports of abuse or violations</li>
              <li>• Implement forensic watermarking for content protection</li>
              <li>• Detect and prevent unauthorized access</li>
              <li>• Maintain platform security and integrity</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Communication</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Send important account and security notifications</li>
              <li>• Provide customer support and respond to inquiries</li>
              <li>• Send updates about platform changes or new features</li>
              <li>• Process and respond to legal requests</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Information Sharing */}
      <Card className="p-8" id="sharing">
        <h2 className="text-2xl font-bold mb-4">3. Information Sharing and Disclosure</h2>
        <div className="space-y-6">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                  Privacy Commitment
                </p>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  We do not sell, rent, or trade your personal information to third parties for 
                  marketing purposes. Your privacy is especially important given the sensitive 
                  nature of adult content.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">When We May Share Information</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Service Providers</h4>
                <p className="text-sm text-muted-foreground">
                  We may share information with trusted service providers who help us operate the platform:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground mt-2">
                  <li>• Payment processors for financial transactions</li>
                  <li>• Cloud storage providers for content hosting</li>
                  <li>• Identity verification services for KYC compliance</li>
                  <li>• Analytics providers for platform improvement</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Legal Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  We may disclose information when required by law or to protect our rights:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground mt-2">
                  <li>• In response to valid legal process (subpoenas, court orders)</li>
                  <li>• To comply with 18 USC §2257 record-keeping requirements</li>
                  <li>• To report suspected child exploitation or abuse</li>
                  <li>• To protect the safety and rights of users and the public</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Business Transfers</h4>
                <p className="text-sm text-muted-foreground">
                  In the event of a merger, acquisition, or sale of assets, user information may be 
                  transferred as part of the business transaction, subject to equivalent privacy protections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Security */}
      <Card className="p-8" id="security">
        <h2 className="text-2xl font-bold mb-4">4. Data Security and Protection</h2>
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Enhanced Security for Adult Content
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Given the sensitive nature of adult content, we implement enhanced security measures 
                  to protect your personal information and content from unauthorized access, disclosure, 
                  or misuse.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Security Measures</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• End-to-end encryption for sensitive data transmission</li>
              <li>• Secure storage with industry-standard encryption at rest</li>
              <li>• Multi-factor authentication for account protection</li>
              <li>• Regular security audits and penetration testing</li>
              <li>• Access controls and employee background checks</li>
              <li>• Secure data centers with physical security measures</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Content Protection</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Forensic watermarking to prevent unauthorized distribution</li>
              <li>• Geographic restrictions and access controls</li>
              <li>• Digital rights management (DRM) for premium content</li>
              <li>• Automated content monitoring and protection systems</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Data Breach Response</h3>
            <p className="text-sm text-muted-foreground mb-2">
              In the unlikely event of a data breach:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• We will notify affected users within 72 hours</li>
              <li>• Law enforcement and regulatory authorities will be contacted as required</li>
              <li>• We will provide detailed information about the breach and remediation steps</li>
              <li>• Additional security measures will be implemented to prevent future incidents</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* User Rights */}
      <Card className="p-8" id="rights">
        <h2 className="text-2xl font-bold mb-4">5. Your Privacy Rights</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Access and Control</h3>
            <p className="text-muted-foreground mb-3">
              You have the following rights regarding your personal information:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li>• <strong>Correction:</strong> Update or correct inaccurate personal information</li>
              <li>• <strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
              <li>• <strong>Portability:</strong> Request your data in a machine-readable format</li>
              <li>• <strong>Restriction:</strong> Limit how we process your personal information</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Account Management</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Update your profile and privacy settings at any time</li>
              <li>• Control who can see your content and profile information</li>
              <li>• Manage communication preferences and notifications</li>
              <li>• Delete your account and associated content</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Legal Compliance Limitations</h3>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                <strong>Important:</strong> Some information, particularly 18 USC §2257 compliance records, 
                must be retained for legal purposes even after account deletion. We will maintain only 
                the minimum information required by law and will securely destroy it when legally permissible.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Exercising Your Rights</h3>
            <p className="text-sm text-muted-foreground">
              To exercise any of these rights, please contact our privacy team at privacy@example.com. 
              We will respond to your request within 30 days and may require identity verification 
              to protect your privacy.
            </p>
          </div>
        </div>
      </Card>

      {/* Cookies and Tracking */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">6. Cookies and Tracking Technologies</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold mb-2">How We Use Cookies</h3>
              <p className="text-sm text-muted-foreground mb-3">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Essential Cookies:</strong> Required for platform functionality and security</li>
                <li>• <strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li>• <strong>Analytics Cookies:</strong> Help us understand how you use the platform</li>
                <li>• <strong>Age Verification:</strong> Remember your age verification status</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Managing Cookies</h3>
            <p className="text-sm text-muted-foreground">
              You can control cookies through your browser settings, but disabling certain cookies 
              may affect platform functionality. Essential cookies cannot be disabled as they are 
              required for security and legal compliance.
            </p>
          </div>
        </div>
      </Card>

      {/* International Transfers */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">7. International Data Transfers</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            Our platform operates globally, and your information may be transferred to and processed 
            in countries other than your own. We ensure that international transfers comply with 
            applicable privacy laws and provide adequate protection for your personal information.
          </p>
          <p>
            For transfers from the European Union, we rely on adequacy decisions, standard contractual 
            clauses, or other approved transfer mechanisms to ensure your data remains protected.
          </p>
        </div>
      </Card>

      {/* Data Retention */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Retention Periods</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Account information: Retained while your account is active</li>
              <li>• Content and interactions: Retained until you delete them or close your account</li>
              <li>• Payment records: Retained for 7 years for tax and financial compliance</li>
              <li>• 18 USC §2257 records: Retained as required by federal law (typically 7+ years)</li>
              <li>• Legal compliance data: Retained as required by applicable laws</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              <strong>Account Deletion:</strong> When you delete your account, we will remove your 
              personal information within 30 days, except for information we are legally required 
              to retain for compliance purposes.
            </p>
          </div>
        </div>
      </Card>

      {/* Children's Privacy */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                Strict Age Restrictions
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Our platform is strictly for adults 18 years and older. We do not knowingly collect 
                personal information from minors. If we discover that a minor has provided personal 
                information, we will immediately delete it and terminate the account.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Changes to Privacy Policy */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">10. Changes to This Privacy Policy</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices, 
            technology, legal requirements, or other factors. We will notify you of any material 
            changes by:
          </p>
          <ul className="space-y-2 text-sm">
            <li>• Posting the updated policy on our platform</li>
            <li>• Sending you an email notification</li>
            <li>• Displaying a prominent notice on the platform</li>
          </ul>
          <p>
            Your continued use of the platform after the effective date of the updated Privacy Policy 
            constitutes your acceptance of the changes.
          </p>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-8" id="contact">
        <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            If you have questions, concerns, or requests regarding this Privacy Policy or our 
            privacy practices, please contact us:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Privacy Officer</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Email: privacy@example.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Response Time: Within 30 days</p>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Mailing Address</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Privacy Department</p>
                <p>Web3 Content Platform</p>
                <p>123 Privacy Street, Suite 200</p>
                <p>San Francisco, CA 94105</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border rounded-lg">
            <h3 className="font-semibold mb-2">Data Protection Officer (EU)</h3>
            <p className="text-sm text-muted-foreground">
              For users in the European Union, you may also contact our Data Protection Officer 
              at dpo@example.com for privacy-related inquiries and to exercise your rights under GDPR.
            </p>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          This Privacy Policy is effective as of the date listed above and may be updated from time to time. 
          Please review this policy regularly to stay informed about how we protect your privacy.
        </p>
      </div>
    </div>
  );
}