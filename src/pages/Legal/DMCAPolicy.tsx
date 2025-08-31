import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { AlertTriangle, Mail, FileText, Clock, Shield } from 'lucide-react';

export function DMCAPolicy() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">DMCA Policy</h1>
        <p className="text-lg text-muted-foreground">
          Digital Millennium Copyright Act Compliance and Takedown Procedures
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Quick Navigation */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => scrollToSection('overview')}
            className="justify-start"
          >
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('filing-notice')}
            className="justify-start"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Filing a Notice
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('counter-notice')}
            className="justify-start"
          >
            <Shield className="h-4 w-4 mr-2" />
            Counter-Notice
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollToSection('contact')}
            className="justify-start"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Information
          </Button>
        </div>
      </Card>

      {/* Overview Section */}
      <Card className="p-8" id="overview">
        <h2 className="text-2xl font-bold mb-4">Overview</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            We respect the intellectual property rights of others and expect our users to do the same. 
            In accordance with the Digital Millennium Copyright Act (DMCA), we will respond expeditiously 
            to claims of copyright infringement committed using our platform.
          </p>
          <p>
            If you are a copyright owner, or authorized to act on behalf of one, and believe that content 
            on our platform infringes your copyright, you may submit a DMCA takedown notice to have the 
            content removed.
          </p>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                  Important Notice
                </p>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  Filing a false DMCA notice may result in legal liability. Please ensure you have 
                  a good faith belief that the use of the material is not authorized by the copyright 
                  owner before submitting a notice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filing a DMCA Notice */}
      <Card className="p-8" id="filing-notice">
        <h2 className="text-2xl font-bold mb-4">Filing a DMCA Takedown Notice</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Required Information</h3>
            <p className="text-muted-foreground mb-4">
              To file a valid DMCA notice, you must include the following information:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Identification of the copyrighted work</p>
                  <p className="text-sm text-muted-foreground">
                    Describe the copyrighted work that you claim has been infringed, including 
                    registration numbers if applicable.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Identification of the infringing material</p>
                  <p className="text-sm text-muted-foreground">
                    Provide the URL(s) of the specific content on our platform that you claim 
                    is infringing your copyright.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Your contact information</p>
                  <p className="text-sm text-muted-foreground">
                    Include your name, address, telephone number, and email address.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium">Good faith statement</p>
                  <p className="text-sm text-muted-foreground">
                    A statement that you have a good faith belief that the use is not authorized 
                    by the copyright owner, its agent, or the law.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">5</span>
                </div>
                <div>
                  <p className="font-medium">Accuracy statement</p>
                  <p className="text-sm text-muted-foreground">
                    A statement that the information in the notice is accurate and, under penalty 
                    of perjury, that you are authorized to act on behalf of the copyright owner.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">6</span>
                </div>
                <div>
                  <p className="font-medium">Physical or electronic signature</p>
                  <p className="text-sm text-muted-foreground">
                    Your physical or electronic signature (typing your full name is acceptable 
                    for electronic signatures).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Our Response Process</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  <strong>24-48 hours:</strong> We review and process valid DMCA notices
                </span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">
                  <strong>Immediate:</strong> Infringing content is removed or disabled
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  <strong>Notification:</strong> Content uploader is notified of the takedown
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Counter-Notice */}
      <Card className="p-8" id="counter-notice">
        <h2 className="text-2xl font-bold mb-4">Filing a Counter-Notice</h2>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            If you believe your content was removed in error or misidentification, you may file 
            a counter-notice. Upon receiving a valid counter-notice, we will forward it to the 
            original complainant and restore the content within 10-14 business days unless the 
            complainant files a court action.
          </p>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Counter-Notice Requirements</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Your physical or electronic signature</li>
              <li>• Identification of the material that was removed and its location</li>
              <li>• A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
              <li>• Your name, address, and telephone number</li>
              <li>• A statement consenting to jurisdiction of federal court in your district</li>
              <li>• A statement that you will accept service of process from the complainant</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Repeat Infringer Policy */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">Repeat Infringer Policy</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            We maintain a policy of terminating accounts of users who are repeat infringers. 
            Users who receive multiple valid DMCA takedown notices may have their accounts 
            suspended or permanently terminated.
          </p>
          
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                  Account Termination
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  Accounts with 3 or more valid DMCA strikes may be permanently terminated. 
                  This includes loss of all content, earnings, and account privileges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-8" id="contact">
        <h2 className="text-2xl font-bold mb-4">DMCA Agent Contact Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Designated DMCA Agent</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> Legal Department</p>
              <p><strong>Company:</strong> Web3 Content Platform</p>
              <p><strong>Address:</strong> 123 Legal Street, Suite 100<br />San Francisco, CA 94105</p>
              <p><strong>Email:</strong> dmca@example.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Submission Methods</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm mb-1">Email (Preferred)</p>
                <p className="text-sm text-muted-foreground">dmca@example.com</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm mb-1">Online Form</p>
                <Button size="sm" className="mt-1">
                  Submit DMCA Notice
                </Button>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm mb-1">Postal Mail</p>
                <p className="text-sm text-muted-foreground">
                  Send to address above<br />
                  Attn: DMCA Agent
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          This DMCA policy is effective as of the date listed above and may be updated from time to time. 
          Please check this page regularly for any changes.
        </p>
      </div>
    </div>
  );
}