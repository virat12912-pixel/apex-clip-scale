import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl px-4 py-12 sm:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="Amplify" className="w-8 h-8 rounded-md" />
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Privacy Policy</h1>
        </div>

        <p className="text-xs text-muted-foreground/50 mb-10">Last updated: February 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">1. Data We Collect</h2>
            <p>We collect the following types of information when you use Amplify:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground/90">Account information:</strong> Name, email address, company name, and payment details provided during onboarding.</li>
              <li><strong className="text-foreground/90">Onboarding details:</strong> Campaign goals, target audience, brand assets, and content preferences shared during the application process.</li>
              <li><strong className="text-foreground/90">Campaign metrics:</strong> Views, engagement data, submission details, and performance analytics collected during campaign execution.</li>
              <li><strong className="text-foreground/90">Communication data:</strong> Messages, feedback, and correspondence between you and our team through the platform or email.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">2. How We Use Your Data</h2>
            <p>Your data is used exclusively for service delivery and reporting purposes, including:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Creating, managing, and optimizing your campaigns</li>
              <li>Generating performance reports and analytics dashboards</li>
              <li>Communicating campaign updates, approvals, and deliverables</li>
              <li>Improving platform functionality and user experience</li>
              <li>Processing payments and managing billing</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">3. Data Sharing</h2>
            <p>Amplify does not sell, rent, or trade your personal data to any third party. We may share limited data with trusted service providers (payment processors, hosting providers) solely to operate and maintain the platform. All third-party providers are bound by confidentiality agreements.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">4. Data Retention & Security</h2>
            <p>We retain your data for as long as your account is active or as needed to provide services. Campaign data may be retained in anonymized form for benchmarking purposes. We implement industry-standard security measures including encryption in transit and at rest, access controls, and regular security audits to protect your information.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground/90">Access</strong> your personal data and request a copy</li>
              <li><strong className="text-foreground/90">Correct</strong> inaccurate or incomplete information</li>
              <li><strong className="text-foreground/90">Delete</strong> your account and associated personal data</li>
              <li><strong className="text-foreground/90">Object</strong> to certain types of data processing</li>
            </ul>
            <p>To exercise any of these rights, contact us at contact@amplifyclipping.com.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">6. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last updated" date above.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
