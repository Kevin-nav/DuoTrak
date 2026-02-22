import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import ContactSection from '@/components/landing/ContactSection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-landing-cream text-landing-espresso font-sans selection:bg-landing-terracotta selection:text-white">
      <LandingNavbar />
      <main className="overflow-x-hidden pt-20">
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SocialProofSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
