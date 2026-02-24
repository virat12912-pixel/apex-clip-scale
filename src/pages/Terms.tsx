import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl px-4 py-12 sm:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="Amplify" className="w-8 h-8 rounded-md" />
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Terms of Service</h1>
        </div>

        <p className="text-xs text-muted-foreground/50 mb-10">Last updated: February 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">1. Overview</h2>
            <p>Amplify is a managed short-form content growth platform. Clients apply to work with Amplify, campaign terms are finalized between the client and our team, and campaigns are created and managed by Amplify administrators. Performance is reported via the client dashboard.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">2. No Guaranteed Results</h2>
            <p>Amplify does not guarantee any specific number of views, followers, engagement, conversions, or revenue. Campaign performance depends on content quality, platform algorithms, audience behavior, and other factors outside our control. All projections or benchmarks shared are estimates based on historical data and are not promises of future performance.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">3. Budget Usage</h2>
            <p>Campaign budgets are allocated across content production, distribution to our clipper network, platform operations, and administrative overhead. Amplify reserves the right to allocate budget across these categories as needed to optimize campaign outcomes. Detailed budget breakdowns are available upon request through your account manager.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">4. Client Responsibilities</h2>
            <p>Clients are responsible for providing accurate brand information, timely feedback on campaign content, and approval of deliverables within agreed timelines. Delays in client approvals may affect campaign scheduling and performance. Clients must ensure all provided materials comply with applicable laws and do not infringe on third-party intellectual property rights.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">5. Content Usage Rights</h2>
            <p>Unless otherwise agreed in writing, Amplify retains the right to use campaign content, performance metrics, and anonymized case study data for portfolio, marketing, and promotional purposes. Clients grant Amplify a non-exclusive license to distribute submitted content across short-form platforms as part of campaign execution.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">6. Platform Algorithm Dependency</h2>
            <p>Campaign distribution relies on third-party platforms (TikTok, Instagram, YouTube) whose algorithms, policies, and content moderation practices are beyond Amplify's control. Changes to platform algorithms, content policies, or account restrictions may impact campaign performance at any time without notice.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">7. Termination & Refunds</h2>
            <p>Either party may terminate a campaign with written notice. Refunds are evaluated on a case-by-case basis and are limited to the unspent portion of the campaign budget, minus any production costs already incurred. Amplify reserves the right to decline refund requests for budget already allocated to active distribution.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Amplify's total liability for any claims arising from the use of our services shall not exceed the total fees paid by the client for the specific campaign in question. Amplify is not liable for indirect, incidental, consequential, or punitive damages arising from campaign performance or platform-related issues.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">9. Changes to Terms</h2>
            <p>Amplify reserves the right to update these terms at any time. Clients will be notified of material changes via email or through the client dashboard. Continued use of Amplify services after notification constitutes acceptance of the updated terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
