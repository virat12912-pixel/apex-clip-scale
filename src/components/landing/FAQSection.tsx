import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const creatorFAQs = [
  { q: "Who can sign up as a creator?", a: "Anyone with a social media presence — from micro-influencers to full-time creators — is welcome. We support TikTok, Instagram, YouTube, and more." },
  { q: "How do I get paid?", a: "You'll receive payouts via your preferred method once you hit the minimum payout threshold." },
  { q: "Is there a fee to join?", a: "Nope. It's 100% free to join and apply to campaigns." },
  { q: "Do I need a large following?", a: "Not necessarily. We work with creators of all sizes. Brands care about engagement and authenticity, not just follower count." },
  { q: "Can I work with multiple brands?", a: "Yes! You can apply to and run multiple campaigns at the same time." },
];

const brandFAQs = [
  { q: "How much does it cost to run a campaign?", a: "You set your own budget. You only pay for results — whether it's posts, clicks, or conversions." },
  { q: "Can I choose the creators I work with?", a: "Yes. You can hand-pick creators or let our system match you with the best fits based on your campaign goals." },
  { q: "Is there a minimum budget?", a: "We recommend starting with at least $100 to attract quality creators, but there's no strict minimum." },
  { q: "Can I track results in real time?", a: "Absolutely. Our dashboard gives you live insights into performance — views, engagement, and content stats." },
  { q: "Do I need to sign a long-term contract?", a: "No. You can run one-off campaigns or scale over time — completely on your terms." },
];

const FAQSection = () => {
  const [activeTab, setActiveTab] = useState<"creators" | "brands">("creators");
  const faqs = activeTab === "creators" ? creatorFAQs : brandFAQs;

  return (
    <section id="faq" className="py-28 px-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container max-w-3xl relative">
        <div className="text-center mb-14">
          <span className="inline-block text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base mb-10">
            Amplify is suitable for: apps / influencers / streamers / youtubers / software / SaaS / physical & digital products
          </p>

          {/* Tab Toggle */}
          <div className="inline-flex items-center rounded-full border border-border bg-card p-1 gap-1">
            <button
              onClick={() => setActiveTab("creators")}
              className={`px-7 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "creators"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Creators
            </button>
            <button
              onClick={() => setActiveTab("brands")}
              className={`px-7 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "brands"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
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
              className="border border-border rounded-xl px-6 bg-card/50 hover:border-primary/30 transition-colors data-[state=open]:border-primary/30 opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm pb-5 leading-relaxed">
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
