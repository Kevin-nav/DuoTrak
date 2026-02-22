'use client';

import Link from 'next/link';
import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthShellProps {
  badge: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthShell({ badge, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-landing-cream px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-8%] h-64 w-64 rounded-full bg-landing-gold/15 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-10%] h-72 w-72 rounded-full bg-landing-sage/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
        <section className="hidden rounded-3xl border border-landing-clay/70 bg-white/70 p-10 shadow-[0_14px_35px_rgba(44,37,32,0.08)] lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-landing-espresso-light">
              <Sparkles className="h-4 w-4 text-landing-terracotta" />
              DuoTrak
            </Link>
            <h2 className="max-w-sm text-4xl font-black tracking-tight text-landing-espresso">
              Build consistency together.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-landing-espresso-light">
              DuoTrak makes accountability feel human. Share progress, celebrate streaks, and support each other through real goals.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-landing-clay/70 bg-landing-cream/80 p-5">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 text-landing-sage" />
              <p className="text-sm font-medium text-landing-espresso-light">Partner-first habits with daily check-ins and shared wins.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-landing-terracotta" />
              <p className="text-sm font-medium text-landing-espresso-light">Secure auth and transparent controls over your account data.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-landing-clay/70 bg-white/95 p-5 shadow-[0_18px_40px_rgba(44,37,32,0.1)] sm:p-7 lg:p-10">
          <div className="mb-6 space-y-3 sm:mb-8">
            <span className="inline-flex rounded-full border border-landing-clay bg-landing-sand/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-landing-espresso-light">
              {badge}
            </span>
            <h1 className="text-3xl font-black tracking-tight text-landing-espresso sm:text-4xl">{title}</h1>
            <p className="text-sm leading-relaxed text-landing-espresso-light sm:text-base">{subtitle}</p>
          </div>

          <div>{children}</div>

          <div className="mt-7 border-t border-landing-clay/70 pt-5 text-sm text-landing-espresso-light">{footer}</div>
        </section>
      </div>
    </main>
  );
}
