import { useNavigate } from "react-router-dom";
import { Rocket, Megaphone, BarChart3, Users } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  {
    icon: Megaphone,
    title: "Define Your Campaign",
    desc: "Set your goals, budget, and target audience — whether you're a brand, musician, streamer, or creator.",
  },
  {
    icon: Users,
    title: "Connect with Creators",
    desc: "Get matched with talented creators ready to amplify your content across TikTok, Instagram, and YouTube.",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    desc: "Monitor views, engagement, and earnings in real-time with powerful analytics.",
  },
  {
    icon: Rocket,
    title: "Scale & Grow",
    desc: "Pay only for results. Scale campaigns effortlessly as your audience grows.",
  },
];

const LaunchCampaignSection = () => {
  const navigate = useNavigate();
  const headerRef = useScrollReveal();
  const contentRef = useScrollReveal();

  return (
    <section id="launch-a-campaign" className="py-24 sm:py-32 px-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[200px]" />
      </div>

      <div className="container relative max-w-5xl">
        <div ref={headerRef} className="scroll-reveal text-center mb-16">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            Campaigns
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Launch a <span className="text-gradient">Campaign</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            Whether you're a brand, musician, streamer, or creator — launching a campaign on Amplify is simple and powerful.
          </p>
        </div>

        <div ref={contentRef} className="scroll-reveal grid sm:grid-cols-2 gap-5 mb-12">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group glass-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--primary)/0.12)]"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-xs text-primary/60 font-semibold">Step {i + 1}</span>
                  <p className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate("/brand-application")}
            className="btn-shimmer px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium text-sm transition-all duration-300 hover:scale-105 active:scale-[0.98] shadow-[0_0_25px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)]"
          >
            Launch a Campaign →
          </button>
        </div>
      </div>
    </section>
  );
};

export default LaunchCampaignSection;
