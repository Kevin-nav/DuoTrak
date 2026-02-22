import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface FlowShellProps {
  stepLabel: string;
  title: string;
  subtitle: string;
  progress: number;
  backHref?: string;
  statusChip?: string;
  children: ReactNode;
  actionBar?: ReactNode;
}

export default function FlowShell({
  stepLabel,
  title,
  subtitle,
  progress,
  backHref,
  statusChip,
  children,
  actionBar,
}: FlowShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-landing-cream px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-[-10%] h-64 w-64 rounded-full bg-landing-gold/15 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-10%] h-72 w-72 rounded-full bg-landing-sage/15 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-4xl">
        <header className="rounded-2xl border border-landing-clay/80 bg-white/90 p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {backHref ? (
                  <Link
                    href={backHref}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-landing-espresso-light hover:text-landing-terracotta"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Link>
                ) : null}
                <span className="inline-flex rounded-full border border-landing-clay bg-landing-sand/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-landing-espresso-light sm:text-xs">
                  {stepLabel}
                </span>
                {statusChip ? (
                  <span className="inline-flex rounded-full border border-landing-sage/30 bg-landing-sage/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-landing-espresso-light sm:text-xs">
                    {statusChip}
                  </span>
                ) : null}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-landing-espresso sm:text-3xl">{title}</h1>
              <p className="text-sm text-landing-espresso-light sm:text-base">{subtitle}</p>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-landing-sand">
            <div
              className="h-full rounded-full bg-gradient-to-r from-landing-terracotta via-landing-gold to-landing-sage transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </header>

        <section className="mt-4 rounded-2xl border border-landing-clay/80 bg-white/95 p-4 shadow-sm sm:mt-5 sm:p-6">{children}</section>
      </div>

      {actionBar ? (
        <div className="sticky bottom-0 left-0 right-0 mt-4 border-t border-landing-clay/80 bg-landing-cream/95 py-3 backdrop-blur">
          <div className="mx-auto w-full max-w-4xl px-1 sm:px-0">{actionBar}</div>
        </div>
      ) : null}
    </main>
  );
}
