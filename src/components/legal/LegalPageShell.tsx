import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalPageShellProps {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}

export default function LegalPageShell({ eyebrow, title, summary, children }: LegalPageShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-landing-cream px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-100px] h-64 w-64 rounded-full bg-landing-sage/15 blur-3xl" />
        <div className="absolute bottom-[-130px] right-[-8%] h-72 w-72 rounded-full bg-landing-gold/20 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-landing-clay bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-landing-espresso-light transition-colors hover:text-landing-terracotta"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to DuoTrak
        </Link>

        <header className="rounded-3xl border border-landing-clay/80 bg-white/90 p-6 shadow-[0_16px_34px_rgba(44,37,32,0.09)] sm:p-8 lg:p-10">
          <span className="inline-flex rounded-full border border-landing-clay bg-landing-sand/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-landing-espresso-light">
            {eyebrow}
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-landing-espresso sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-landing-espresso-light sm:text-base">{summary}</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.11em] text-landing-espresso-light">
            Last updated: February 22, 2026
          </p>
        </header>

        <div className="space-y-4 sm:space-y-5">{children}</div>
      </div>
    </main>
  );
}
