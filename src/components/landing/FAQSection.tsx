import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const faqs = [
  { q: "Who can sign up as a creator?", a: "Anyone with a social media presence — from micro-influencers to full-time creators — is welcome. We support TikTok, Instagram, YouTube, and more." },
  { q: "How much does it cost to run a campaign?", a: "You set your own budget. You only pay for results — whether it's posts, clicks, or conversions." },
  { q: "How do I get paid?", a: "You'll receive payouts via your preferred method once you hit the minimum payout threshold." },
  { q: "Can I choose the creators I work with?", a: "Yes. You can hand-pick creators or let our system match you with the best fits based on your campaign goals." },
  { q: "Is there a fee to join?", a: "Nope. It's 100% free to join and apply to campaigns." },
  { q: "Can I track results in real time?", a: "Absolutely. Our dashboard gives you live insights into performance — views, engagement, and content stats." },
  { q: "Do I need a large following?", a: "Not necessarily. We work with creators of all sizes. Brands care about engagement and authenticity, not just follower count." },
  { q: "Do I need to sign a long-term contract?", a: "No. You can run one-off campaigns or scale over time — completely on your terms." },
];

const FAQSection = () => {
  const headerRef = useScrollReveal();
  const listRef = useScrollReveal();

  return (
    <section id="faq" className="py-28 px-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container max-w-3xl relative">
        <div ref={headerRef} className="scroll-reveal text-center mb-14">
          <span className="inline-block text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5">
            Got Questions?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Everything you need to know about Amplify — for creators and brands.
          </p>
        </div>

        <div ref={listRef} className="scroll-reveal">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="faq-item border border-border/30 rounded-xl px-6 bg-card/30 hover:border-primary/20 transition-all duration-300 data-[state=open]:border-primary/30 data-[state=open]:shadow-[0_0_20px_hsl(var(--primary)/0.08)]"
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-5 hover:text-primary transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-5 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
