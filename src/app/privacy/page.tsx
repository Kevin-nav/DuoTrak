import { Shield, Database, Cog, Lock, CheckSquare, Mail } from 'lucide-react';
import LegalPageShell from '@/components/legal/LegalPageShell';

const sections = [
  {
    title: 'Introduction',
    icon: Shield,
    content:
      'Your privacy matters to us. This policy explains what we collect, why we collect it, and how we protect it while you use DuoTrak.',
  },
  {
    title: 'Information We Collect',
    icon: Database,
    content:
      'We collect account details and app usage data needed to provide shared goal tracking, partner collaboration, and support services.',
  },
  {
    title: 'How We Use Data',
    icon: Cog,
    content:
      'We use your information to operate DuoTrak features, improve reliability, and communicate important updates related to your account and goals.',
  },
  {
    title: 'Security',
    icon: Lock,
    content:
      'We apply practical safeguards to protect personal data. No system is perfect, but we continuously improve operational security and monitoring.',
  },
  {
    title: 'Your Choices',
    icon: CheckSquare,
    content:
      'You can request access, updates, or deletion of your account data. Some requests may impact feature availability if required data is removed.',
  },
  {
    title: 'Contact',
    icon: Mail,
    content: 'For privacy questions, contact support@duotrak.com.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      summary="How DuoTrak handles your information so accountability stays supportive, secure, and respectful."
    >
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <section key={section.title} className="rounded-2xl border border-landing-clay/70 bg-white/95 p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-landing-espresso sm:text-2xl">
              <Icon className="h-5 w-5 text-landing-sage" />
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-landing-espresso-light sm:text-base">{section.content}</p>
          </section>
        );
      })}
    </LegalPageShell>
  );
}
