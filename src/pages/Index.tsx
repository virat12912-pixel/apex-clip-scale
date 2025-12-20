import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import MetricsSection from "@/components/landing/MetricsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhoItsForSection from "@/components/landing/WhoItsForSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <MetricsSection />
        <HowItWorksSection />
        <WhoItsForSection />
        <TestimonialsSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
