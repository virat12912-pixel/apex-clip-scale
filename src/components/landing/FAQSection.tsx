import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const creatorFAQs = [
  {
    q: "How do I start earning on Amplify?",
    a: "Sign up as a creator, browse available campaigns, and start submitting clips. Once approved and your content gains views, you'll earn based on the campaign's pay rate.",
  },
  {
    q: "How much can I earn?",
    a: "Earnings depend on your views and the campaign rate. Top creators earn $1,000–$5,000+ per month. The more views your content gets, the more you earn.",
  },
  {
    q: "When do I get paid?",
    a: "You can request a payout once your earnings reach the minimum threshold. Payouts are processed quickly via your chosen payment method.",
  },
  {
    q: "Do I need a large following?",
    a: "No! What matters is the quality of your content and the views it generates. Many successful creators started with small followings.",
  },
  {
    q: "What platforms are supported?",
    a: "Currently TikTok, Instagram Reels, and YouTube Shorts. We're always expanding to new platforms.",
  },
];

const brandFAQs = [
  {
    q: "How does pricing work?",
    a: "Amplify uses budget-based pricing. You set a total campaign budget and a pay rate per views. You only pay for actual performance — no upfront fees or commitments.",
  },
  {
    q: "Do I approve content before it goes live?",
    a: "Yes, you have full approval control. Every submission is reviewed by you before any content is published. You can approve, reject, or request changes.",
  },
  {
    q: "How many creators will work on my campaign?",
    a: "It depends on your campaign's appeal and budget. Popular campaigns can attract hundreds of creators. You can also set requirements to filter for quality.",
  },
  {
    q: "Are views guaranteed?",
    a: "No. All views are organic — we never use bots or paid promotions. Results vary based on content quality and platform algorithms.",
  },
  {
    q: "Can I track campaign performance?",
    a: "Absolutely. Your dashboard shows real-time views, submissions, earnings spent, and per-creator breakdowns across all platforms.",
  },
];

const FAQSection = () => {
  const [activeTab, setActiveTab] = useState<"creators" | "brands">("creators");
  const faqs = activeTab === "creators" ? creatorFAQs : brandFAQs;

  return (
    <section id="faq" className="py-24 px-4">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked <span className="text-gradient-animated">Questions</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Everything you need to know about Amplify.
          </p>

          {/* Tab Toggle */}
          <div className="inline-flex items-center rounded-full border border-border bg-secondary/50 p-1">
            <button
              onClick={() => setActiveTab("creators")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "creators"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Creators
            </button>
            <button
              onClick={() => setActiveTab("brands")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "brands"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Brands
            </button>
          </div>
        </div>

        <Accordion type="single" collapsible className="space-y-3" key={activeTab}>
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border rounded-xl px-6 bg-card/50 hover:border-primary/30 transition-colors data-[state=open]:border-primary/30"
            >
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm pb-4 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
