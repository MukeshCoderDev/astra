import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '../ui/separator';

export function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-semibold mb-4">Web3 Content Platform</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A decentralized platform for adult content creators and viewers, 
              built with privacy and compliance in mind.
            </p>
            <p className="text-xs text-muted-foreground">
              18+ Adult Content Platform
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/legal/terms" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/privacy" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/dmca" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  All Legal Documents
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="mailto:support@example.com" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a 
                  href="mailto:legal@example.com" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Legal Inquiries
                </a>
              </li>
              <li>
                <a 
                  href="mailto:dmca@example.com" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  DMCA Notices
                </a>
              </li>
              <li>
                <a 
                  href="mailto:privacy@example.com" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Concerns
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h3 className="font-semibold mb-4">Compliance</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>18 USC §2257 Compliant</li>
              <li>Age Verification Required</li>
              <li>GDPR Compliant</li>
              <li>CCPA Compliant</li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Web3 Content Platform. All rights reserved.
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>18+ Adult Content</span>
            <span>•</span>
            <span>Age Verification Required</span>
            <span>•</span>
            <span>Privacy Protected</span>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            This website contains adult content and is intended solely for adults 18 years of age or older. 
            By accessing this website, you confirm that you are at least 18 years old and consent to viewing adult content. 
            All content is provided by independent creators and the platform does not endorse or control user-generated content.
          </p>
        </div>
      </div>
    </footer>
  );
}