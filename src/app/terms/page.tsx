import { FileText, User, Copyright, Ban, XCircle, Mail } from 'lucide-react';
import LegalPageShell from '@/components/legal/LegalPageShell';

const sections = [
  {
    title: 'Introduction',
    icon: FileText,
    content:
      'Welcome to DuoTrak. These Terms of Service govern your use of our application and services. By using DuoTrak, you agree to these terms. If you do not agree, please stop using the app.',
  },
  {
    title: 'User Accounts',
    icon: User,
    content:
      'You must provide accurate and current information when creating an account. You are responsible for maintaining account security and for all activity under your account.',
  },
  {
    title: 'Content Ownership',
    icon: Copyright,
    content:
      'You retain ownership of content you submit. You grant DuoTrak a non-exclusive license to store, process, and display that content so the service can function as intended.',
  },
  {
    title: 'Prohibited Activities',
    icon: Ban,
    content:
      'Do not abuse the service, access it through unauthorized automation, or interfere with other users. Any misuse may result in account suspension or termination.',
  },
  {
    title: 'Termination',
    icon: XCircle,
    content:
      'We may suspend or terminate access if these terms are violated or if required for legal or operational reasons.',
  },
  {
    title: 'Contact',
    icon: Mail,
    content: 'Questions about these terms can be sent to support@duotrak.com.',
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms"
      title="Terms of Service"
      summary="Clear rules that keep DuoTrak safe, reliable, and useful for accountability partners."
    >
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <section key={section.title} className="rounded-2xl border border-landing-clay/70 bg-white/95 p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-landing-espresso sm:text-2xl">
              <Icon className="h-5 w-5 text-landing-terracotta" />
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-landing-espresso-light sm:text-base">{section.content}</p>
          </section>
        );
      })}
    </LegalPageShell>
  );
}
