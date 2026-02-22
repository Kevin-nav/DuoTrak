import { Info, HelpCircle, BookOpen, Mail, ChevronDown } from 'lucide-react';
import LegalPageShell from '@/components/legal/LegalPageShell';

const FaqItem = ({ question, answer }: { question: string; answer: string }) => (
  <details className="group rounded-xl border border-landing-clay/70 bg-landing-cream/70 p-4">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-landing-espresso">
      {question}
      <ChevronDown className="h-5 w-5 text-landing-espresso-light transition-transform duration-300 group-open:rotate-180" />
    </summary>
    <p className="mt-3 text-sm leading-relaxed text-landing-espresso-light sm:text-base">{answer}</p>
  </details>
);

export default function HelpPage() {
  return (
    <LegalPageShell
      eyebrow="Help"
      title="How can we help?"
      summary="Practical guidance for setting up DuoTrak fast and getting the most from your accountability partnership."
    >
      <section className="rounded-2xl border border-landing-clay/70 bg-white/95 p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-landing-espresso sm:text-2xl">
          <Info className="h-5 w-5 text-landing-terracotta" />
          About DuoTrak
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-landing-espresso-light sm:text-base">
          DuoTrak helps accountability partners stay consistent through shared goals, proof-based check-ins, and daily encouragement.
        </p>
      </section>

      <section className="rounded-2xl border border-landing-clay/70 bg-white/95 p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-landing-espresso sm:text-2xl">
          <BookOpen className="h-5 w-5 text-landing-sage" />
          Getting Started
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-landing-espresso-light sm:text-base">
          Invite your partner, define a shared goal, then check in consistently with proof. Keep updates short, honest, and encouraging.
        </p>
      </section>

      <section className="rounded-2xl border border-landing-clay/70 bg-white/95 p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-landing-espresso sm:text-2xl">
          <HelpCircle className="h-5 w-5 text-landing-gold" />
          Frequently Asked Questions
        </h2>
        <div className="mt-4 space-y-3">
          <FaqItem
            question="Can I use DuoTrak by myself?"
            answer="Yes. DuoTrak works best with a partner, but you can still use it solo while keeping your progress history and routines."
          />
          <FaqItem
            question="How do I invite a partner?"
            answer="Open your Partner page, send an invitation link, and wait for your partner to accept. Once accepted, your shared dashboard activates automatically."
          />
          <FaqItem
            question="What if my partner misses a day?"
            answer="Use chat to support each other and reset expectations quickly. DuoTrak is built for consistency over perfection."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-landing-clay/70 bg-white/95 p-6 text-center shadow-sm sm:p-7">
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold tracking-tight text-landing-espresso sm:text-2xl">
          <Mail className="h-5 w-5 text-landing-terracotta" />
          Still have questions?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-landing-espresso-light sm:text-base">
          Reach out to support@duotrak.com and we will help you as quickly as possible.
        </p>
        <a
          href="mailto:support@duotrak.com"
          className="mt-5 inline-flex rounded-xl bg-landing-espresso px-5 py-3 text-sm font-bold text-landing-cream transition-colors hover:bg-landing-terracotta"
        >
          Contact Support
        </a>
      </section>
    </LegalPageShell>
  );
}
