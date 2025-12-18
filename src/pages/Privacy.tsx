import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#f5f3f0] to-[#faf9f7] py-8 px-6">
        <div className="container mx-auto">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Button>
          </Link>
          <h1 className="text-4xl font-normal text-[#2d2d2d] tracking-wide">Privacy Policy</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="prose prose-lg">
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Parent Assist ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We may collect the following types of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, and family information you provide during registration.</li>
              <li><strong>Calendar Data:</strong> Events and schedules from connected calendars (with your explicit consent).</li>
              <li><strong>Email Data:</strong> Information extracted from emails you authorise us to scan for dates and events.</li>
              <li><strong>Usage Data:</strong> How you interact with our service, including features used and preferences.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We use collected information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and maintain our service</li>
              <li>Sync and manage your family calendar</li>
              <li>Extract dates and events from your emails</li>
              <li>Generate meal plans and shopping lists</li>
              <li>Provide personalised gift suggestions</li>
              <li>Send you relevant notifications and reminders</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar tracking technologies to improve your experience:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Essential Cookies:</strong> Required for the service to function properly.</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our service (only with your consent).</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can manage your cookie preferences at any time through your browser settings or by clicking "Decline" on our cookie banner.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal data. We may share information with trusted service providers who assist in operating our service, subject to confidentiality agreements. We may also disclose information if required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Under GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data.</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten").</li>
              <li><strong>Portability:</strong> Request your data in a portable format.</li>
              <li><strong>Objection:</strong> Object to processing of your data.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise any of these rights, please contact us at privacy@parentassist.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data only for as long as necessary to provide our services and fulfil the purposes outlined in this policy. You can request deletion of your account and associated data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:<br />
              <strong>Email:</strong> privacy@parentassist.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Parent Assist. Made with care for busy parents everywhere.</p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
